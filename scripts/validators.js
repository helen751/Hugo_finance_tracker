//Regex patterns and functions to validate user input in forms

export function validateRequired(str) {
  return typeof str === 'string' && str.trim().length > 0;
}

export function validateAmount(input) {
  // Accept 12 or 12.34; reject negative numbers / zero / letters.
  const re = /^(?:0*[1-9]\d*(?:\.\d{1,2})?|0?\.\d{1,2})$/;

  if (!re.test(String(input).trim())) return false;
  const n = Number(input);
  return Number.isFinite(n) && n > 0;
}

export function validateDateNotFuture(yyyyMmDd) {
    //Checking if the user entered a future date as income or expense date
  if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return false;
  const chosen = new Date(yyyyMmDd + 'T00:00:00');
  const todayStr = new Date().toISOString().slice(0, 10);
  const today = new Date(todayStr + 'T00:00:00');
  return chosen <= today;
}

// Ensuring the string has at least `min` letters for descriptions
export function validateMinLetters(str, min = 5) {
  if (typeof str !== 'string') return false;
  const letters = str.match(/\p{L}/gu) || []; 
  return letters.length >= min;
}