/**
 * String utility functions
 */

/**
 * Reverses a string
 * @param {string} str - The string to reverse
 * @returns {string} The reversed string
 */
function reverseString(str) {
  return str.split('').reverse().join('');
}

/**
 * Checks if a string is a palindrome
 * @param {string} str - The string to check
 * @returns {boolean} True if the string is a palindrome, false otherwise
 */
function isPalindrome(str) {
  const cleanStr = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleanStr === reverseString(cleanStr);
}

module.exports = { reverseString, isPalindrome };
