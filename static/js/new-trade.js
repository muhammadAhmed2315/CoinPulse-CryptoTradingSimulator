import {
  COINGECKO_API_OPTIONS,
  showMessagePopup,
  hideMessagePopup,
  addMessagePopupCloseEventListener,
  getAllCoinNamesDict,
} from "../js/helpers.js";

let currentCoin = {
  id: "bitcoin",
  name: "",
  image: "",
  current_price: 0,
  price_change_24h: 0,
  ticker: "",
};
let coinNamesDict = {};
let currentTransactionType = "buy";
let currentOrderType = "market";

/**
 * Caches a dictionary of the form "Coin Name": ["Coin Ticker", "Coin API Specific ID"]
 * in session storage.
 *
 * If the data is not already cached, it fetches the data from the
 * CoinGecko API using getAllCoinNamesDict(), stores it in session storage, and assigns
 * it to the module-scoped global variable coinNamesDict.
 *
 * If the data is already cached in session storage, it retrieves and parses the data
 * into the coinNamesDict variable.
 *
 * @async
 * @function
 * @returns {Promise<void>} A promise that resolves once the data is either fetched and
 *                          stored in session storage or retrieved from session storage.
 * @global {Object} coinNamesDict - A module-scoped global variable holding the coin
 *                                  names dictionary.
 * @throws {Error} Will throw an error if getAllCoinNamesDict() fails or session storage
 *                 access fails.
 */
async function cacheCoinNamesInSession() {
  // If data doesn't exist in session storage
  if (sessionStorage.getItem("coinNamesDict") === null) {
    coinNamesDict = await getAllCoinNamesDict();
    sessionStorage.setItem("coinNamesDict", JSON.stringify(coinNamesDict));
  } else {
    coinNamesDict = JSON.parse(sessionStorage.getItem("coinNamesDict"));
  }
}

// ////////// NEW TRADE SIDEBAR SEARCH BOX //////////
function addNewTradeSidebarSearchEventListeners() {
  // Event listener for when the user types something in the search bar
  document
    .querySelector(".nts-search-box input")
    .addEventListener("input", function () {
      const input = this.value.trim();
      const resultsContainer = document.querySelector(
        ".nts-search-box__results"
      );

      if (!input) {
        resultsContainer.style.display = "none";
        return;
      }

      const data = Object.keys(coinNamesDict);

      // Filter data based on input
      const filteredData = data.filter((item) =>
        item.toLowerCase().includes(input.toLowerCase())
      );

      // Display results
      if (filteredData.length > 0) {
        resultsContainer.innerHTML = filteredData
          .map((item) => `<div class="result-item">${item}</div>`)
          .join("");
        resultsContainer.style.display = "block";
      } else {
        resultsContainer.innerHTML =
          '<div class="result-item">No results found</div>';
        resultsContainer.style.display = "block";
      }
    });

  // Event listener for when user clicks a dynamically generated result item below
  // the search bar
  document
    .querySelector(".nts-search-box div")
    .addEventListener("click", async function (e) {
      // Check if the clicked element is a result item
      if (e.target.classList.contains("result-item")) {
        if (e.target.textContent !== "No results found") {
          const selectedCoinName = e.target.textContent;
          document.querySelector(".nts-search-box__results").innerHTML = "";
          document.querySelector(".nts-search-box__input").value =
            selectedCoinName;

          currentCoin.id = coinNamesDict[e.target.textContent][1];

          await getCurrentCoinInfo();
          updateNewTradeCoinInfo();

          // Update amount box (.market-output-box)
          let input = document
            .querySelector(".input-box--dollars input")
            .value.trim();

          let quantity = parseFloat(input) / currentCoin.current_price;
          quantity = quantity;

          document
            .querySelector(".input-box--crypto input")
            .setAttribute("placeholder", quantity);
        }
      } else {
        document.querySelector(".search-box").value = "";
      }
    });

  // Event listener for removing all of the results when the user clicks elsewhere
  // on the screen
  document.addEventListener("click", function (e) {
    if (
      !e.target.classList.contains("nts-search-box") &&
      !e.target.classList.contains("nts-search-box__input")
    ) {
      document.querySelector(".nts-search-box__results").innerHTML = "";
    }
  });
}

/**
 * Gets information from the CoinGecko API about the coin that is stored in the
 * currentCoin global variable
 */
async function getCurrentCoinInfo() {
  // Make API call to get percentage_price_change and current price
  const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
  const params = {
    vs_currency: "usd",
    ids: currentCoin.id,
    price_change_percentage: "24h",
  };
  Object.keys(params).forEach((key) =>
    url.searchParams.append(key, params[key])
  );

  try {
    const response = await fetch(url, COINGECKO_API_OPTIONS);
    const data = await response.json();

    let { name, image, current_price, price_change_24h, symbol } = data[0];
    price_change_24h =
      (price_change_24h / (current_price - price_change_24h)) * 100;
    currentCoin;

    // Update currentCoin global variable
    currentCoin.name = name;
    currentCoin.image = image;
    currentCoin.current_price = current_price;
    currentCoin.price_change_24h = price_change_24h;
    currentCoin.ticker = symbol;
  } catch (error) {
    console.error("Error:", error);
    return []; // Return an empty array in case of error
  }
}

/**
 * Updates the new trade section to reflect the currentCoin global variable
 */
function updateNewTradeCoinInfo() {
  document.querySelector(".coin-image").setAttribute("src", currentCoin.image);
  document.querySelector(".coin-name").textContent = currentCoin.name;
  document.querySelector(".coin-ticker").textContent = currentCoin.ticker;

  document.querySelector(".coin-price-change").textContent =
    currentCoin.price_change_24h >= 0 ? "+" : "";
  document.querySelector(".coin-price-change").textContent +=
    currentCoin.price_change_24h.toFixed(2) + "%";
  document.querySelector(".coin-price").textContent =
    "$" + currentCoin.current_price.toLocaleString();

  if (currentCoin.price_change_24h >= 0) {
    document.querySelector(".coin-price-change").style.color = "#17C671";
  } else {
    document.querySelector(".coin-price-change").style.color = "#EB5757";
  }

  document
    .querySelector(".market-order--amount img")
    .setAttribute("src", currentCoin.image);

  document
    .querySelector(".limit-order--amount img")
    .setAttribute("src", currentCoin.image);

  document
    .querySelector(".stop-order--amount img")
    .setAttribute("src", currentCoin.image);

  document.querySelector(".limit-order--price input").value =
    currentCoin.current_price;

  document.querySelector(".stop-order--price input").value =
    currentCoin.current_price;
}

// ////////// PLACE BUY ORDER BUTTON EVENT LISTENER BOX //////////
function addPlaceBuyOrderButtonEventListener() {
  document
    .querySelector(".nts-place-order-btn-container")
    .addEventListener("click", function () {
      // Get input data
      const type = currentTransactionType;
      const coin_id = currentCoin.id;
      const quantity = parseFloat(
        document.querySelector(".input-box--crypto input").value
      );
      const comment = document.querySelector(".nts-comment__input").value;
      const price_per_unit = currentCoin.current_price;

      const dataToSend = {
        transactionData: {
          type: type,
          coin_id: coin_id,
          quantity: quantity,
          comment: comment,
          price_per_unit: price_per_unit,
        },
      };

      // Validate input data
      // TODO (assume valid for now)

      // Send to Flask route
      fetch("/process_transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      })
        .then((response) => response.json())
        .then((data) => {
          if ("success" in data) {
            hideNewTradeSidebar();
            showMessagePopup(data["success"], true);
            document.querySelector(".input-box--crypto").value = "";
          } else if ("error" in data) {
            showMessagePopup(data["error"], false);
          }
        })
        .catch((error) => console.error("Error:", error));
    });
}

// //////////////////// NEW TRADE SIDEBAR ////////////////////
function addNewTradeSidebarEventListeners() {
  document
    .querySelector(".new-trade-btn")
    .addEventListener("click", showNewTradeSidebar);

  document
    .querySelector(".nts-header__close-btn")
    .addEventListener("click", hideNewTradeSidebar);
}

function showNewTradeSidebar() {
  document.querySelector(".new-trade-sidebar").style.right = "0px";
  document.querySelector(".new-trade-sidebar-overlay").style.display = "block";
}

function hideNewTradeSidebar() {
  document.querySelector(".new-trade-sidebar").style.right = "-100%";
  document.querySelector(".new-trade-sidebar-overlay").style.display = "none";
}

function addTransactionButtonEventListeners() {
  const buyButton = document.querySelector(".nts-transaction-btns__btn--buy");
  const sellButton = document.querySelector(".nts-transaction-btns__btn--sell");

  buyButton.addEventListener("click", function () {
    buyButton.classList.toggle("transaction-btn-active");
    sellButton.classList.toggle("transaction-btn-active");

    currentTransactionType = "buy";
  });

  sellButton.addEventListener("click", function () {
    buyButton.classList.toggle("transaction-btn-active");
    sellButton.classList.toggle("transaction-btn-active");

    currentTransactionType = "sell";
  });
}

// ////////// ORDER TYPE BUTTON EVENT LISTENERS //////////
function addOrderTypeButtonEventListeners() {
  // Have "Market" selected by default
  document.querySelector(".order-type-btn--market img").style.filter = "none";
  document.querySelector(".order-type-btn--market p").style.color = "#000000";

  // Only show "Market" input box
  document.querySelector(".limit-order-container").style.display = "none";
  document.querySelector(".stop-order-container").style.display = "none";

  document
    .querySelector(".order-type-btn--market")
    .addEventListener("click", function () {
      currentOrderType = "market";
      resetAllOrderTypeButtons();

      hideAllOrderContainers();
      document.querySelector(".market-order-container").style.display = "flex";

      document.querySelector(".order-type-btn--market img").style.filter =
        "none";
      document.querySelector(".order-type-btn--market p").style.color =
        "#000000";
    });

  document
    .querySelector(".order-type-btn--limit")
    .addEventListener("click", function () {
      currentOrderType = "limit";
      resetAllOrderTypeButtons();

      hideAllOrderContainers();
      document.querySelector(".limit-order-container").style.display = "flex";

      document.querySelector(".order-type-btn--limit img").style.filter =
        "none";
      document.querySelector(".order-type-btn--limit p").style.color =
        "#000000";
    });

  document
    .querySelector(".order-type-btn--stop")
    .addEventListener("click", function () {
      currentOrderType = "stop";
      resetAllOrderTypeButtons();

      hideAllOrderContainers();
      document.querySelector(".stop-order-container").style.display = "flex";

      document.querySelector(".order-type-btn--stop img").style.filter = "none";
      document.querySelector(".order-type-btn--stop p").style.color = "#000000";
    });
}

function resetAllOrderTypeButtons() {
  // Reset "Market" button
  document.querySelector(".order-type-btn--market img").style.filter =
    "brightness(0) saturate(100%) invert(68%) sepia(5%) saturate(1595%) hue-rotate(202deg) brightness(90%) contrast(85%)";
  document.querySelector(".order-type-btn--market p").style.color = "#9696bb";

  // Reset "Limit" button
  document.querySelector(".order-type-btn--limit img").style.filter =
    "brightness(0) saturate(100%) invert(68%) sepia(5%) saturate(1595%) hue-rotate(202deg) brightness(90%) contrast(85%)";
  document.querySelector(".order-type-btn--limit p").style.color = "#9696bb";

  // Reset "Stop" button
  document.querySelector(".order-type-btn--stop img").style.filter =
    "brightness(0) saturate(100%) invert(68%) sepia(5%) saturate(1595%) hue-rotate(202deg) brightness(90%) contrast(85%)";
  document.querySelector(".order-type-btn--stop p").style.color = "#9696bb";
}

function hideAllOrderContainers() {
  document.querySelector(".market-order-container").style.display = "none";
  document.querySelector(".limit-order-container").style.display = "none";
  document.querySelector(".stop-order-container").style.display = "none";
}

// ////////// ORDER TYPE INPUT QUANTITY BOX EVENT LISTENERS //////////
function addOrderTypeInputEventListeners() {
  addMarketOrderTypeInputEventListeners();
  addLimitOrderTypeInputEventListeners();
  addStopOrderTypeInputEventListeners();
}

function addMarketOrderTypeInputEventListeners() {
  const totalInput = document.querySelector(".market-order--total input");
  const amountOutput = document.querySelector(".market-order--amount input");
  totalInput.addEventListener("input", function () {
    const input = this.value.trim();
    if (isNaN(input) || input.includes(",") || input.trim() === "") {
      totalInput.value = "";
      amountOutput.value = "";
    } else {
      let quantity = parseFloat(input) / currentCoin.current_price;
      amountOutput.value = quantity;
    }
  });
}

function addLimitOrderTypeInputEventListeners() {
  const amountInput = document.querySelector(".limit-order--amount input");
  const priceInput = document.querySelector(".limit-order--price input");
  const totalOutput = document.querySelector(".limit-order--total input");

  amountInput.addEventListener("input", function () {
    const input = this.value.trim();
    if (isNaN(input) || input.includes(",") || input.trim() === "") {
      amountInput.value = "";
      totalOutput.value = "";
    } else {
      let quantity = parseFloat(input) * parseFloat(priceInput.value);
      totalOutput.value = quantity;
    }
  });

  priceInput.addEventListener("input", function () {
    const input = this.value.trim();
    if (isNaN(input) || input.includes(",") || input.trim() === "") {
      priceInput.value = "";
      amountOutput.value = "";
    } else {
      let quantity = parseFloat(input) * parseFloat(priceInput.value);
      totalOutput.value = quantity;
    }
  });
}

function addStopOrderTypeInputEventListeners() {
  const amountInput = document.querySelector(".stop-order--amount input");
  const priceInput = document.querySelector(".stop-order--price input");
  const totalOutput = document.querySelector(".stop-order--total input");

  amountInput.addEventListener("input", function () {
    const input = this.value.trim();
    if (isNaN(input) || input.includes(",") || input.trim() === "") {
      amountInput.value = "";
      totalOutput.value = "";
    } else {
      let quantity = parseFloat(input) * parseFloat(priceInput.value);
      totalOutput.value = quantity;
    }
  });

  priceInput.addEventListener("input", function () {
    const input = this.value.trim();
    if (isNaN(input) || input.includes(",") || input.trim() === "") {
      priceInput.value = "";
      amountOutput.value = "";
    } else {
      let quantity = parseFloat(input) * parseFloat(priceInput.value);
      totalOutput.value = quantity;
    }
  });
}

async function main() {
  await cacheCoinNamesInSession();

  addNewTradeSidebarSearchEventListeners();
  addNewTradeSidebarEventListeners();

  await getCurrentCoinInfo();
  updateNewTradeCoinInfo();

  addPlaceBuyOrderButtonEventListener();
  addTransactionButtonEventListeners();
  addOrderTypeButtonEventListeners();
  addOrderTypeInputEventListeners();
}

main();
