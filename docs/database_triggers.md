# Database Triggers with Supabase Edge Functions

## Overview

Database triggers are a powerful feature that allows you to execute code automatically in response to database events. When combined with Supabase Edge Functions, database triggers enable you to build reactive, event-driven applications that respond to changes in your database in real-time.

## Key Concepts

### Database Triggers

Database triggers are procedures that are automatically executed in response to specific events on a particular table in a database. These events can include:

- **INSERT**: When a new row is added to a table
- **UPDATE**: When an existing row is modified
- **DELETE**: When a row is removed from a table
- **TRUNCATE**: When a table is truncated (all rows removed)

### Supabase Database Triggers

Supabase provides a simplified way to work with PostgreSQL database triggers through:

1. **Database Functions**: PostgreSQL functions that are executed when a trigger fires
2. **Trigger Definitions**: Specifications of when and how triggers should fire
3. **Edge Function Integration**: The ability to call edge functions from database triggers

## Architecture

The architecture for database triggers with Supabase Edge Functions typically follows this pattern:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│   Client    │────▶│  Database   │────▶│  Database   │
│             │     │   Change    │     │   Trigger   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │             │
                                        │    Edge     │
                                        │  Function   │
                                        │             │
                                        └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │             │
                                        │  External   │
                                        │   Service   │
                                        │             │
                                        └─────────────┘
```

## Setting Up Database Triggers

### 1. Create a Database Function

First, create a PostgreSQL function that will be executed when the trigger fires:

```sql
-- Create a function that calls an edge function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the edge function with the new row data
  PERFORM http_post(
    'https://your-project-ref.supabase.co/functions/v1/user-created',
    jsonb_build_object('user', row_to_json(NEW)),
    'application/json'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Create a Trigger

Next, create a trigger that will execute the function when a specific event occurs:

```sql
-- Create a trigger that fires after a new user is inserted
CREATE TRIGGER on_user_created
AFTER INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Implement the Edge Function

Create an edge function that will be called by the trigger:

```typescript
// user-created/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { user } = await req.json();
    
    // Process the new user
    console.log(`New user created: ${user.email}`);
    
    // Perform additional actions (e.g., send welcome email, create user profile, etc.)
    await sendWelcomeEmail(user.email);
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing new user:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

async function sendWelcomeEmail(email: string) {
  // Implementation of sending welcome email
  // ...
}
```

### 4. Deploy the Edge Function

Deploy the edge function using the Supabase CLI:

```bash
supabase functions deploy user-created
```

## Common Use Cases

### 1. Data Validation and Enrichment

Validate and enrich data after it's inserted or updated:

```typescript
// validate-product/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const { product } = await req.json();
  
  // Validate product data
  if (!product.name || !product.price || product.price <= 0) {
    // Update the product with an error flag
    await supabaseClient
      .from('products')
      .update({ validation_error: true, error_message: 'Invalid product data' })
      .eq('id', product.id);
    
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid product data' }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  
  // Enrich product data (e.g., add slug, calculate tax, etc.)
  const slug = product.name.toLowerCase().replace(/\s+/g, '-');
  const tax = product.price * 0.1;
  
  // Update the product with enriched data
  await supabaseClient
    .from('products')
    .update({ slug, tax, validation_error: false, error_message: null })
    .eq('id', product.id);
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

### 2. Notifications

Send notifications when specific events occur:

```typescript
// send-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { order } = await req.json();
  
  // Send notification to the user
  await sendNotification({
    userId: order.user_id,
    title: 'Order Placed',
    body: `Your order #${order.id} has been placed successfully.`,
    data: { orderId: order.id }
  });
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  );
});

async function sendNotification(notification) {
  // Implementation of sending notification
  // ...
}
```

### 3. External Service Integration

Integrate with external services when data changes:

```typescript
// sync-to-crm/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { customer } = await req.json();
  
  // Sync customer data to CRM
  try {
    const response = await fetch('https://api.crm.com/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('CRM_API_KEY')}`
      },
      body: JSON.stringify({
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        // Map other fields as needed
      })
    });
    
    if (!response.ok) {
      throw new Error(`CRM API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return new Response(
      JSON.stringify({ success: true, crm_id: result.id }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error syncing to CRM:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

### 4. Audit Logging

Create audit logs for sensitive operations:

```typescript
// audit-log/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const { operation, table, record, user_id } = await req.json();
  
  // Create audit log entry
  await supabaseClient
    .from('audit_logs')
    .insert({
      operation,
      table_name: table,
      record_id: record.id,
      user_id,
      data: record,
      timestamp: new Date().toISOString()
    });
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

## Advanced Patterns

### 1. Batching and Queuing

For high-volume operations, implement batching and queuing:

```typescript
// batch-processor/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BATCH_SIZE = 100;
let queue = [];
let processingTimer = null;

serve(async (req) => {
  const { item } = await req.json();
  
  // Add item to queue
  queue.push(item);
  
  // Start processing timer if not already running
  if (!processingTimer && queue.length >= BATCH_SIZE) {
    await processBatch();
  } else if (!processingTimer) {
    processingTimer = setTimeout(processBatch, 60000); // Process after 1 minute
  }
  
  return new Response(
    JSON.stringify({ success: true, queued: true }),
    { headers: { "Content-Type": "application/json" } }
  );
});

async function processBatch() {
  if (queue.length === 0) {
    processingTimer = null;
    return;
  }
  
  // Get items to process
  const batch = queue.splice(0, BATCH_SIZE);
  
  try {
    // Process batch
    await processItems(batch);
    
    // Schedule next batch if there are more items
    if (queue.length > 0) {
      processingTimer = setTimeout(processBatch, 1000); // Process after 1 second
    } else {
      processingTimer = null;
    }
  } catch (error) {
    console.error("Error processing batch:", error);
    
    // Put items back in queue
    queue = [...batch, ...queue];
    
    // Retry after a delay
    processingTimer = setTimeout(processBatch, 30000); // Retry after 30 seconds
  }
}

async function processItems(items) {
  // Implementation of processing items
  // ...
}
```

### 2. Transaction Handling

Ensure data consistency with transaction handling:

```typescript
// handle-order/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const { order } = await req.json();
  
  // Start a transaction
  const { data: transaction, error: transactionError } = await supabaseClient.rpc('begin_transaction');
  
  if (transactionError) {
    return new Response(
      JSON.stringify({ success: false, error: transactionError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  
  try {
    // Update inventory
    for (const item of order.items) {
      const { error: inventoryError } = await supabaseClient.rpc('update_inventory', {
        product_id: item.product_id,
        quantity: item.quantity,
        transaction_id: transaction.id
      });
      
      if (inventoryError) {
        throw new Error(`Inventory update failed: ${inventoryError.message}`);
      }
    }
    
    // Create invoice
    const { error: invoiceError } = await supabaseClient.rpc('create_invoice', {
      order_id: order.id,
      transaction_id: transaction.id
    });
    
    if (invoiceError) {
      throw new Error(`Invoice creation failed: ${invoiceError.message}`);
    }
    
    // Commit transaction
    await supabaseClient.rpc('commit_transaction', { transaction_id: transaction.id });
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Rollback transaction
    await supabaseClient.rpc('rollback_transaction', { transaction_id: transaction.id });
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

## Best Practices

### 1. Keep Triggers Lightweight

Database triggers should be lightweight and fast to avoid blocking database operations:

```sql
-- Good practice: Lightweight trigger that delegates to an edge function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Just call the edge function and return immediately
  PERFORM http_post(
    'https://your-project-ref.supabase.co/functions/v1/user-created',
    jsonb_build_object('user', row_to_json(NEW)),
    'application/json'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bad practice: Heavy processing in the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_bad()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't do heavy processing in the trigger
  PERFORM pg_sleep(5); -- Simulating heavy processing
  -- ... more processing
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Handle Errors Gracefully

Edge functions should handle errors gracefully to prevent data inconsistencies:

```typescript
// Good practice: Proper error handling
serve(async (req) => {
  try {
    const { data } = await req.json();
    
    // Process data
    const result = await processData(data);
    
    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing data:", error);
    
    // Return a proper error response
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// Bad practice: No error handling
serve(async (req) => {
  const { data } = await req.json();
  
  // This will crash if processData throws an error
  const result = await processData(data);
  
  return new Response(
    JSON.stringify({ success: true, result }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

### 3. Use Idempotent Operations

Edge functions should be idempotent to handle retries and duplicate events:

```typescript
// Good practice: Idempotent operation
serve(async (req) => {
  const { event } = await req.json();
  
  // Check if the event has already been processed
  const { data: existingEvent } = await supabaseClient
    .from('processed_events')
    .select('id')
    .eq('event_id', event.id)
    .single();
  
  if (existingEvent) {
    // Event already processed, return success
    return new Response(
      JSON.stringify({ success: true, already_processed: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
  
  // Process the event
  await processEvent(event);
  
  // Record that the event has been processed
  await supabaseClient
    .from('processed_events')
    .insert({ event_id: event.id, processed_at: new Date().toISOString() });
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

### 4. Monitor and Log

Implement proper monitoring and logging for database triggers and edge functions:

```typescript
// Good practice: Proper logging and monitoring
serve(async (req) => {
  const startTime = Date.now();
  const { event } = await req.json();
  
  console.log(`Processing event ${event.id} of type ${event.type}`);
  
  try {
    // Process the event
    await processEvent(event);
    
    const duration = Date.now() - startTime;
    console.log(`Event ${event.id} processed successfully in ${duration}ms`);
    
    // Record metrics
    await recordMetric('event_processed', { 
      event_type: event.type, 
      duration, 
      success: true 
    });
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Error processing event ${event.id}: ${error.message}`);
    
    // Record metrics
    await recordMetric('event_processed', { 
      event_type: event.type, 
      duration, 
      success: false,
      error: error.message
    });
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

async function recordMetric(name, data) {
  // Implementation of recording metrics
  // ...
}
```

## Troubleshooting

### 1. Trigger Not Firing

If a trigger is not firing, check the following:

1. Verify that the trigger is correctly defined:

```sql
-- Check if the trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'your_trigger_name';

-- Recreate the trigger if needed
DROP TRIGGER IF EXISTS your_trigger_name ON your_table;
CREATE TRIGGER your_trigger_name
AFTER INSERT ON your_table
FOR EACH ROW EXECUTE FUNCTION your_function_name();
```

2. Check the database logs for errors:

```sql
-- Check recent PostgreSQL logs
SELECT * FROM pg_logs ORDER BY log_time DESC LIMIT 100;
```

### 2. Edge Function Not Being Called

If the edge function is not being called, check the following:

1. Verify that the function URL is correct:

```sql
-- Check the function URL in the trigger function
SELECT prosrc FROM pg_proc WHERE proname = 'your_function_name';
```

2. Check that the edge function is deployed:

```bash
# List deployed functions
supabase functions list
```

3. Test the edge function directly:

```bash
# Test the edge function
curl -X POST https://your-project-ref.supabase.co/functions/v1/your-function \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### 3. Edge Function Errors

If the edge function is returning errors, check the following:

1. Check the edge function logs:

```bash
# View edge function logs
supabase functions logs your-function
```

2. Test the edge function locally:

```bash
# Serve the edge function locally
supabase functions serve your-function --no-verify-jwt

# Test the local function
curl -X POST http://localhost:54321/functions/v1/your-function \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## Resources

- [Supabase Database Triggers Documentation](https://supabase.com/docs/guides/database/triggers)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [PostgreSQL Trigger Documentation](https://www.postgresql.org/docs/current/trigger-definition.html)

---

Created by rUv, Agentics Foundation founder.