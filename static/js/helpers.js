export const COINGECKO_API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    "x-cg-demo-api-key": COINGECKO_API_KEY,
  },
};

// //////////////////// GET DICT OF ALL COIN NAMES + SYMBOLS + IDS ////////////////////
/**
 * Returns a dictionary of the form "Coin Name": ["Coin Ticker", "Coin API Specific ID"]
 * for every coin currently available in the CoinGecko API.
 *
 * @async
 * @function
 * @returns {Promise<Object>} A promise that resolves to a dictionary of coin names,
 *                            each associated with its ticker and API-specific ID.
 * @throws {Error} Will throw an error if the fetch request fails or if the API returns
 *                 an invalid response.
 */
export async function getAllCoinNamesDict() {
  const url = new URL("https://api.coingecko.com/api/v3/coins/list");

  const result = {};

  const data = await fetch(url, COINGECKO_API_OPTIONS);
  const response = await data.json();
  for (const coin of response) {
    // IMPORTANT: ID = API SPECIFIC ID, TICKERS = NOT UNIQUE, NAMES = UNIQUE
    result[coin.name] = [coin.symbol, coin.id];
  }
  return result;
}

// //////////////////// MESSAGE POPUP FUNCTIONS ////////////////////
export function showMessagePopup(text, success) {
  document.querySelector(".message-popup-text").textContent = text;
  document.querySelector(".message-popup").style.display = "block";
  document.querySelector(".message-popup").style.backgroundColor = success
    ? "#17C671"
    : "#EB5757";
}

export function hideMessagePopup() {
  document.querySelector(".message-popup").style.display = "none";
}

export function addMessagePopupCloseEventListener() {
  document
    .querySelector(".message-popup-close-btn")
    .addEventListener("click", hideMessagePopup);
}
