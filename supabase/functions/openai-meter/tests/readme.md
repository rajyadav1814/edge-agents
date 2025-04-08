Set up usage-based billing with products and prices
Charge customers based on their usage of your product or service.
Copy page
Usage-based billing enables you to charge customers based on their usage of your product or service.

This guide demonstrates how to create a meter, set up pricing and billing, and send meter events to record customer usage using Products and Prices. You’ll learn core concepts of a usage-based billing model through a fictional GenAI company called Alpaca AI. Alpaca AI charges their customers 0.04 USD per hundred tokens, and bills them at the end of the month in arrears.

Here’s what the lifecycle looks like for a typical usage-based billing integration that uses products and prices:









Usage-based billing with pricing models
Create a meter
Meters specify how to aggregate meter events over a billing period. Meter events represent all actions that customers take in your system (for example, API requests). Meters attach to prices and form the basis of what’s billed.

For the Alpaca AI example, meter events are the number of tokens a customer uses in a query. The meter is the sum of tokens over a month.

You can use the Stripe Dashboard or API to configure a meter. To use the API with the Stripe CLI to create a meter, get started with the Stripe CLI.


Dashboard

API
Command Line
Select a language



curl https://api.stripe.com/v1/billing/meters \
  -u "sk_test_51PTWInHci4IG4d4kPSqMuthCoG9Ey5lMsLwefJ0bWha1SWmznQF76xDCofGqOvRTPDW9zT7jHQLAn9hWF4xZBR7000Tir3xDa8:" \
  -d display_name="Alpaca AI tokens" \
  -d event_name=alpaca_ai_tokens \
  -d "default_aggregation[formula]"=sum \
  -d "customer_mapping[event_payload_key]"=stripe_customer_id \
  -d "customer_mapping[type]"=by_id \
  -d "value_settings[event_payload_key]"=value
Create a pricing model
Use the Stripe Dashboard or API to create a pricing model that includes your Products and their pricing options. Prices define the unit cost, currency, and billing cycle.

For the Alpaca AI example, you create a product with a metered price of 0.04 USD per hundred units, billed at a monthly interval. You use the meter that you created in the previous step.


Dashboard

API
You can locate your meter ID on the meter details page.

Command Line
Select a language



curl https://api.stripe.com/v1/prices \
  -u "sk_test_51PTWInHci4IG4d4kPSqMuthCoG9Ey5lMsLwefJ0bWha1SWmznQF76xDCofGqOvRTPDW9zT7jHQLAn9hWF4xZBR7000Tir3xDa8:" \
  -d currency=usd \
  -d unit_amount=4 \
  -d billing_scheme=per_unit \
  -d "transform_quantity[divide_by]"=1000 \
  -d "transform_quantity[round]"=up \
  -d "recurring[usage_type]"=metered \
  -d "recurring[interval]"=month \
  -d "recurring[meter]"={{METER_ID}} \
  -d "product_data[name]"="Alpaca AI tokens"
Create a customer
Next, create a customer.


Dashboard

API
Command Line
Select a language



curl https://api.stripe.com/v1/customers \
  -u "sk_test_51PTWInHci4IG4d4kPSqMuthCoG9Ey5lMsLwefJ0bWha1SWmznQF76xDCofGqOvRTPDW9zT7jHQLAn9hWF4xZBR7000Tir3xDa8:" \
  -d name="John Doe"
Create a subscription
Subscriptions allow you to charge recurring amounts by associating a customer with a specific price.

Use the Stripe Dashboard or API to create a subscription that includes your customer, product, and usage-based price.

For the Alpaca AI example, you create a subscription for the Alpaca AI product, with a metered price of 0.04 USD per unit, billed monthly to John Doe.

Note
You can associate a single metered price with one or more subscriptions.


Dashboard

API
You can locate your customer ID on the customer details page. To locate your price ID, go to the product details page and click the overflow menu () under Pricing. Select Copy price ID.

Command Line
Select a language



curl https://api.stripe.com/v1/subscriptions \
  -u "sk_test_51PTWInHci4IG4d4kPSqMuthCoG9Ey5lMsLwefJ0bWha1SWmznQF76xDCofGqOvRTPDW9zT7jHQLAn9hWF4xZBR7000Tir3xDa8:" \
  -d customer={{CUSTOMER_ID}} \
  -d "items[0][price]"={{PRICE_ID}}
Send a test meter event
Use Meter Events to record customer usage for your meter. At the end of the billing period, Stripe bills the reported usage.

You can test your usage-based billing by sending a meter event through the Stripe Dashboard or API. When using the API, specify the customer ID and value for the payload.

After you send meter events, you can view usage details for your meter on the Meters page in the Dashboard.


Dashboard

API
Command Line
Select a language



curl https://api.stripe.com/v1/billing/meter_events \
  -u "sk_test_51PTWInHci4IG4d4kPSqMuthCoG9Ey5lMsLwefJ0bWha1SWmznQF76xDCofGqOvRTPDW9zT7jHQLAn9hWF4xZBR7000Tir3xDa8:" \
  -d event_name=alpaca_ai_tokens \
  -d "payload[stripe_customer_id]"={{CUSTOMER_ID}} \
  -d "payload[value]"=25
Create a preview invoice
Create a preview invoice to see a preview of a customer’s invoice that includes details such as the meter price and usage quantity.


Dashboard

API
Command Line
Select a language



curl https://api.stripe.com/v1/invoices/create_preview \
  -u "sk_test_51PTWInHci4IG4d4kPSqMuthCoG9Ey5lMsLwefJ0bWha1SWmznQF76xDCofGqOvRTPDW9zT7jHQLAn9hWF4xZBR7000Tir3xDa8:" \
  -d subscription={{SUBSCRIPTION_ID}}
