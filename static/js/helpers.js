/**
 * Converts each word in a string to title case, where the first letter is capitalized
 * and the rest are lower case.
 *
 * @function toTitleCase
 * @param {string} str - The string to be converted to title case.
 * @returns {string} The converted title case string.
 */
export function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

/**
 * Formats a floating-point number into a US currency string, with a specified number
 * of decimal places.
 *
 * @function formatFloatToUSD
 * @param {number} float - The number to format.
 * @param {number} decimals - The number of decimal places to use.
 * @returns {string} The formatted string in US dollar currency.
 */
export function formatFloatToUSD(float, decimals) {
  return float.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Converts a UNIX timestamp into a localized date and time string.
 *
 * @function formatUNIXTimestamp
 * @param {number} timestamp - The UNIX timestamp to convert.
 * @returns {string} A localized date and time string.
 */
export function formatUNIXTimestamp(timestamp) {
  const date = new Date(timestamp * 1000); // Convert to milliseconds

  // Convert to a string in the user's local timezone and return
  return date.toLocaleString();
}

/**
 * Adds functionality to smoothly scroll to a specific section of the page.
 *
 * @function scrollToSection
 * @param {Event} event - The event object from a click or similar event.
 * @param {string} sectionId - The CSS selector ID of the section to scroll to.
 * @param {number} offset - The offset from the top of the section to accommodate fixed
 *                          headers or other elements.
 */
export function scrollToSection(event, sectionId, offset) {
  event.preventDefault(); // Prevent the default jump to anchor behavior

  const target = document.querySelector(sectionId);
  const elementPosition = target.getBoundingClientRect().top + window.scrollY;
  const offsetPosition = elementPosition - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth", // Optional smooth scrolling
  });
}

// //////////////////// GET DICT OF ALL COIN NAMES + SYMBOLS + IDS ////////////////////
/**
 * Asynchronously retrieves all coin names from the CoinGecko API and organizes them
 * into a dictionary. Each key in the resulting dictionary is a unique coin name,
 * associated with an array containing the coin's symbol and its API-specific ID.
 *
 * @function getAllCoinNamesDict
 * @returns {Promise<Object>} A promise that resolves to an object where keys are coin
 * names and values are arrays of [symbol, API-specific ID]. If an error occurs during
 * fetch, logs the error to the console.
 */
export async function getAllCoinNamesDict() {
  const fetchOptions = {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  };

  try {
    const response = await fetch("/get_all_coin_names", fetchOptions);
    const data = await response.json();

    const result = {};

    for (const coin of data) {
      // IMPORTANT: ID = API SPECIFIC ID, TICKERS = NOT UNIQUE, NAMES = UNIQUE, this
      // is why names are being used for the dictionary keys
      result[coin.name] = [coin.symbol, coin.id];
    }

    return result;
  } catch (error) {
    console.error(error);
  }
}

// //////////////////// MESSAGE POPUP FUNCTIONS ////////////////////
/**
 * Displays a message popup with customizable text and background color based on
 * success or failure.
 *
 * @function showMessagePopup
 * @param {string} text - The message text to display.
 * @param {boolean} success - A boolean that determines the background color of the popup; green if true, red if false.
 */
export function showMessagePopup(text, success) {
  document.querySelector(".message-popup-text").textContent = text;
  document.querySelector(".message-popup").style.display = "block";
  document.querySelector(".message-popup").style.backgroundColor = success
    ? "#17C671"
    : "#EB5757";
}

/**
 * Hides the message popup.
 *
 * @function hideMessagePopup
 */
export function hideMessagePopup() {
  document.querySelector(".message-popup").style.display = "none";
}

/**
 * Adds an event listener to the close button of the message popup to hide the popup
 * when the message popup close button is clicked.
 *
 * @function addMessagePopupCloseEventListener
 */
export function addMessagePopupCloseEventListener() {
  document
    .querySelector(".message-popup-close-btn")
    .addEventListener("click", hideMessagePopup);
}
