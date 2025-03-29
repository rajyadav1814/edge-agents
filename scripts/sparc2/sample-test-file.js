/**
 * Sample Test File for SPARC2 SSE Example
 * 
 * This is a simple JavaScript file with some code that can be analyzed
 * and modified by the SPARC2 agent.
 */

// Constants for discount logic
const DISCOUNT_THRESHOLD = 100;
const DISCOUNT_RATE = 0.9;

// A simple function with some issues to fix
function calculateTotalPrice(items) {
  // Use reduce to calculate total
  const total = items.reduce((sum, item) => sum + item.price, 0);
  
  // Apply discount if total is over the threshold
  return total > DISCOUNT_THRESHOLD ? total * DISCOUNT_RATE : total;
}

// An efficient way to find an item
function findItemById(items, id) {
  return items.find(item => item.id === id) || null;
}

// A simplified function to format price
function formatPrice(price) {
  const parsedPrice = parseFloat(price) || 0;
  return `$${parsedPrice.toFixed(2)}`;
}

// Example usage
const items = [
  { id: 1, name: "Item 1", price: 10.5 },
  { id: 2, name: "Item 2", price: 25.75 },
  { id: 3, name: "Item 3", price: 5.25 }
];

const total = calculateTotalPrice(items);
console.log("Total: " + formatPrice(total));

const item = findItemById(items, 2);
if (item) {
  console.log("Found item: " + item.name + " - " + formatPrice(item.price));
}