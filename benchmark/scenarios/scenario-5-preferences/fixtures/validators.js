/**
 * Validation utilities using functional patterns.
 */

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const isValidAge = (value) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 150;

const validateRequired = (fields) => (record) => {
  const missing = fields.filter((f) => record[f] == null || record[f] === '');
  return missing.length === 0
    ? { ok: true, data: record }
    : { ok: false, error: `Missing fields: ${missing.join(', ')}` };
};

const pipe = (...fns) => (input) =>
  fns.reduce((result, fn) => (result.ok ? fn(result.data) : result), { ok: true, data: input });

module.exports = Object.freeze({
  isNonEmptyString,
  isValidAge,
  validateRequired,
  pipe,
});
