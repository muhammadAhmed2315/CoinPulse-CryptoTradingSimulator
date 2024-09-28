import { formatFloatToUSD } from "../js/helpers.js";

let currentPortfolioTotalValue = 0;

export async function fetchPortfolioBalance() {
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

function updatePortfolioTotalValueElement() {
  const portfolioTotalValueElement = document.querySelector(
    ".portfolio-container__total-value"
  );
  portfolioTotalValueElement.textContent =
    "$" + formatFloatToUSD(currentPortfolioTotalValue, 2);
}

function renderProfileImage() {
  const username = document
    .querySelector(".profile-username")
    .textContent.slice(0, 1);

  document.querySelector(
    ".profile-img"
  ).src = `../../static/img/profileLetters/${username}.png`;
}

async function main() {
  renderProfileImage();
  currentPortfolioTotalValue = await fetchPortfolioBalance();
  updatePortfolioTotalValueElement();
}

main();
