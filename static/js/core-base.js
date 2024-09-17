let currentPortfolioTotalValue = 0;

async function fetchPortfolioBalance() {
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
    "$" +
    currentPortfolioTotalValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
}

async function main() {
  currentPortfolioTotalValue = await fetchPortfolioBalance();
  updatePortfolioTotalValueElement();
}

main();
