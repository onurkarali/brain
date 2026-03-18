/**
 * Shared utility functions following the project's functional style.
 */

const capitalize = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const isValidEmail = (email) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isNonEmpty = (str) =>
  typeof str === 'string' && str.trim().length > 0;

module.exports = Object.freeze({ capitalize, isValidEmail, isNonEmpty });
