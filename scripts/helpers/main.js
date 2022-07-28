import { numericRegex } from "../regexp.js";

/**
 *
 * @returns {*[]}Array of HTML nodeElements of the target element
 * @param selector{string}Selector to be used
 */
export const getDomNodes = (selector) => {
  return [...document.querySelector(`${selector}`).children] || [];
};

/**
 * 
 * @param input Input element
 * @returns {Object} returns an object with the key as the name of the attribute and value as it's value
 * 
 */

export const getAttributeObject = (input) => {
  return [...input.attributes].reduce((obj, attr) => {
    obj[attr.name] = attr.value;
    return obj;
  }, {});
}

/**
 *
 * @param type {string} Type of input you want to get
 * @returns {*[]}Array of HTML nodes of the designated type
 */
export const getInputFields = (type) => {
  return [...document.querySelectorAll(`input[type="${type}"]`)];
};

/**
 *
 * @param input {HTMLInputElement} Target input element
 * @param type{string} Type of input attribute
 * @param value {*} Value of the attribute (will be turned to string anyway)
 */
export const setInputAttribute = (input, type, value) => {
  return input.setAttribute(`${type}`, `${value}`);
};

/**
 *
 * @param input {HTMLInputElement} Target input element
 * @param type{string} Type of input attribute
 * @returns {string} Value of the attribute
 */
export const getInputAttribute = (input, type) => {
  return input.getAttribute(`${type}`);
};

/**
 *
 * @param string Number String with comma as a thousand's separator character
 * @returns {string} String with white space as a thousand's separator character
 */
export const replaceDigitCommas = (string) => {
  return string.replace(/(?<!\..*)(\d)(?=(?:\d{3})+(?:\.|$))/g, "$1 ");
};

/**
 *
 * @param input {HTMLInputElement} Target input element
 * @param value {*} Value of the input element (will be turned to string anyway)
 * @returns {string} Result input value
 */
export const setInputValue = (input, value) => {
  return (input.value = value);
};
/**
 *
 * @param num {number} Number to be rounded
 * @param decimals {number} Number of decimal values after point
 * @returns {number} Number rounded to decimals
 */
export const roundNumber = (num, decimals) => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const formatDate = (date, counter) => {
  let year = date.getFullYear();
  let month = date.getMonth() + counter;

  date = new Date(year, month, 0);
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
  });
  return formatter.format(date);
};

/**
 *
 * @param value{string} Input value
 * @param max{string} max input value
 * @param min{string} min input value
 * @returns {number} Value of the progress bar represented as a percent
 */
export const calculateProgressValue = (value, max, min) => {
  const inputValue = parseFloat(value);
  const minValue = parseFloat(min);
  const maxValue = parseFloat(max);
  return ((inputValue - minValue) / (maxValue - minValue)) * 100;
};

/**
 *
 * @param arr {*[]} target Array
 * @param key {String} Object key
 * @param value {String} Value to be found
 * @returns {Object} Object with the designated key
 */
export const getObjectFromArray = (arr, key, value) => {
  return arr.find((elem) => elem[key] === value);
};

export const addPercentSymbol = (value) => {
  const symbol = "%";
  return `${parseFloat(value)}${symbol}`;
};

export const pluralize = (count, noun, suffix = "s") => {
  return `${count} ${noun}${count !== 1 ? suffix : ""}`;
};

export const debounce = (fn, delay = 500) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn.apply(null, args)
    }, delay);
  };
};

export const formatNumber = (num, localeName, extraOpts) => {
  let currencyArray = [
    {
      currency: "EUR",
      symbol: "€",
      locale: "de-DE",
    },
    {
      currency: "USD",
      symbol: "$",
      locale: "en-US",
    },
    {
      currency: "AED",
      symbol: "AED",
      locale: "ar-AE",
    },
  ];
  let { currency = "USD", locale = "en-US" } = currencyArray.find(
    (c) => c.locale === localeName
  );
  let options = {
    style: "currency",
    currency: currency,
  };
  return new Intl.NumberFormat(locale, { ...options, ...extraOpts }).format(
    num
  );
};

export const numeric = (field) => {
  return numericRegex.test(field.value);
};
