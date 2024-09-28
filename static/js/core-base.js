import { formatFloatToUSD } from "../js/helpers.js";

export async function fetchPortfolioBalance() {
  /**
   * Fetches the current USD balance from the user's wallet.
   *
   * This function makes an HTTP GET request to the server endpoint
   * `/get_wallet_usd_balance` to retrieve the latest wallet balance in USD. It handles
   * the HTTP response, checks for errors, and parses the JSON data. If the data
   * retrieval is successful, it returns the balance, otherwise, it throws an error
   * with the HTTP status.
   *
   * @returns {Promise<number>} A promise that resolves with the current USD balance if
   *                            the fetch operation is successful.
   * @throws {Error} Throws an error with the status code if the HTTP request fails.
   */
  const fetchOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch("/get_wallet_usd_balance", fetchOptions);

  if (!response.ok) {
    // Handle HTTP errors
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();

  if (data.success) {
    return data.data;
  }
}

async function fetchPortfolioTotalValue() {
  /**
   * Fetches the current total value of the user's wallet.
   *
   * This function makes an HTTP GET request to the server endpoint
   * `/get_wallet_total_current_value` to retrieve the total current value of the
   * user's wallet, which includes the combined value of all assets and cash in USD. It
   * handles the HTTP response, checks for errors, and parses the JSON data. If the
   * data retrieval is successful, it returns the total value, otherwise, it throws an
   * error with the HTTP status.
   *
   * @returns {Promise<number>} A promise that resolves with the current total value of
   *                            the wallet if the fetch operation is successful.
   * @throws {Error} Throws an error with the status code if the HTTP request fails.
   */
  const fetchOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch("/get_wallet_total_current_value", fetchOptions);

  if (!response.ok) {
    // Handle HTTP errors
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();

  if (data.success) {
    return data.data;
  }
}

function updatePortfolioTotalValueElement(currentPortfolioTotalValue) {
  /**
   * Updates the DOM element displaying the total value of the portfolio.
   *
   * @param {number} currentPortfolioTotalValue - The current total value of the
   *                                              portfolio to be displayed.
   */
  const portfolioTotalValueElement = document.querySelector(
    ".portfolio-container__total-value"
  );
  portfolioTotalValueElement.textContent =
    "$" + formatFloatToUSD(currentPortfolioTotalValue, 2);
}

export async function getAndRenderPortfolioTotalValue() {
  /**
   * Retrieves and displays the current total value of the user's portfolio.
   *
   * This function asynchronously fetches the current total value of the portfolio by
   * calling `fetchPortfolioTotalValue` and then updates the corresponding DOM element
   * with this value by calling `updatePortfolioTotalValueElement`.
   */
  const currentPortfolioTotalValue = await fetchPortfolioTotalValue();
  updatePortfolioTotalValueElement(currentPortfolioTotalValue);
}

function renderProfileImage() {
  /**
   * Renders the user's profile image based on the first letter of their username.
   */
  const username = document
    .querySelector(".profile-username")
    .textContent.slice(0, 1)
    .toUpperCase();

  document.querySelector(
    ".profile-img"
  ).src = `../../static/img/profileLetters/${username}.png`;
}

async function main() {
  // Renders profile image at the right hand side of the navbar
  renderProfileImage();

  // Fetches and renders the total value of the user's portfolio (cash + assets) at the
  // left of the navbar
  await getAndRenderPortfolioTotalValue();
}

main();
