/**
 * Sample Test File for SPARC2 SSE Example
 * 
 * This is a simple JavaScript file with some code that can be analyzed
 * and modified by the SPARC2 agent.
 */

// A simple function with some issues to fix
function calculateTotal(items) {
  let total = 0;
  
  // Loop through items and add prices
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  
  // Apply discount if total is over 100
  if (total > 100) {
    total = total * 0.9;
  }
  
  return total;
}

// An inefficient way to find an item
function findItem(items, id) {
  for (var i = 0; i < items.length; i++) {
    if (items[i].id == id) {
      return items[i];
    }
  }
  return null;
}

// A function with unnecessary complexity
function formatPrice(price) {
  var formatted = "";
  if (price) {
    if (typeof price === "number") {
      formatted = "$" + price.toFixed(2);
    } else {
      formatted = "$" + parseFloat(price).toFixed(2);
    }
  } else {
    formatted = "$0.00";
  }
  return formatted;
}

// Example usage
const items = [
  { id: 1, name: "Item 1", price: 10.5 },
  { id: 2, name: "Item 2", price: 25.75 },
  { id: 3, name: "Item 3", price: 5.25 }
];

const total = calculateTotal(items);
console.log("Total: " + formatPrice(total));

const item = findItem(items, 2);
if (item) {
  console.log("Found item: " + item.name + " - " + formatPrice(item.price));
}