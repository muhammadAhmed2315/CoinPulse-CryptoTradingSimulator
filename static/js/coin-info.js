import {
  COINGECKO_API_OPTIONS,
  showMessagePopup,
  hideMessagePopup,
  addMessagePopupCloseEventListener,
  getAllCoinNamesDict,
} from "../js/helpers.js";

let currentCoin = { id: "bitcoin", name: "Bitcoin" };
let coinNamesDict = {};
let currentCoinOHLC = [];
let currentCoinHistoricalData = {
  prices: [],
  market_caps: [],
  total_volumes: [],
};

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

// ////////// SEARCH BOX EVENT LISTENERS //////////
function addSearchBarEventListeners() {
  // Event listener for showing dynamic results when the user types something in the
  // search bar
  document
    .querySelector(".coin-info__search-input")
    .addEventListener("input", function () {
      const input = this.value.trim();
      const resultsContainer = document.querySelector(
        ".coin-info__search-results"
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

  // Event listener for when the user clicks a dynamically generated result item below
  // the search bar
  document
    .querySelector(".coin-info__search-results")
    .addEventListener("click", async function (e) {
      // Check if the clicked element is a result item
      if (e.target.classList.contains("result-item")) {
        if (e.target.textContent !== "No results found") {
          const selectedCoinName = e.target.textContent;
          document.querySelector(".coin-info__search-results").innerHTML = "";
          document.querySelector(".coin-info__search-input").value =
            selectedCoinName;

          currentCoin.id = coinNamesDict[e.target.textContent][1];

          await getCurrentCoinInfo();
        }
      } else {
        document.querySelector(".search-box").value = "";
      }
    });

  // Event listener for when when the dynamically generated results are being shown
  // under the search bar, and the user clicks something other than one of the results
  // or the search bar
  document.addEventListener("click", function (e) {
    if (
      !e.target.classList.contains("coin-info__search") &&
      !e.target.classList.contains("coin-info__search-input")
    ) {
      document.querySelector(".coin-info__search-results").innerHTML = "";
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

async function getCurrentCoinOHLC() {
  // Make API call to get percentage_price_change and current price
  const url = new URL(
    `https://api.coingecko.com/api/v3/coins/${currentCoin.id}/ohlc?vs_currency=usd&days=365`
  );

  try {
    const response = await fetch(url, COINGECKO_API_OPTIONS);
    const data = await response.json();

    currentCoinOHLC = data;
  } catch (error) {
    console.error("Error:", error);
    return []; // Return an empty array in case of error
  }
}

async function getCurrentCoinHistoricalData() {
  // Make API call to get percentage_price_change and current price
  const url = new URL(
    `https://api.coingecko.com/api/v3/coins/${currentCoin.id}/market_chart?vs_currency=usd&days=365&interval=daily`
  );

  try {
    const response = await fetch(url, COINGECKO_API_OPTIONS);
    const data = await response.json();

    currentCoinHistoricalData.prices = data.prices;
    currentCoinHistoricalData.market_caps = data.market_caps;
    currentCoinHistoricalData.total_volumes = data.total_volumes;
  } catch (error) {
    console.error("Error:", error);
    return []; // Return an empty array in case of error
  }
}

function drawOHLCChart() {
  Highcharts.stockChart("coin-info-chart", {
    rangeSelector: {
      selected: 1,
    },

    plotOptions: {
      candlestick: {
        color: "#EB5757 ",
        lineColor: "#EB5757 ",
        upColor: "#17c671",
        upLineColor: "#17c671",
      },
    },

    title: {
      text: `${currentCoin.name} Price`,
    },

    series: [
      {
        type: "candlestick",
        name: `${currentCoin.name} Price`,
        data: currentCoinOHLC,
        dataGrouping: {
          units: [
            [
              "week", // unit name
              [1], // allowed multiples
            ],
            ["month", [1, 2, 3, 4, 6]],
          ],
        },
      },
    ],
  });
}

function drawHistoricalChart(coin_data = "price") {
  let data = [];

  if (coin_data === "price") {
    data = currentCoinHistoricalData.prices;
  } else if (coin_data === "market-cap") {
    data = currentCoinHistoricalData.market_caps;
  } else if (coin_data === "total-volume") {
    data = currentCoinHistoricalData.total_volumes;
  }

  Highcharts.stockChart("coin-info-chart", {
    rangeSelector: {
      selected: 1,
    },

    title: {
      text: `${currentCoin.name} Price`,
    },

    series: [
      {
        name: `${currentCoin.name} Price`,
        data: data,
        tooltip: { valueDecimals: 2 },
        color: "#EB5757", // #17C671 #EB5757
      },
    ],
  });
}

async function addSecondNavButtonEventListeners() {
  // "OHLC Chart" Button Event Listener
  document
    .querySelector(".sn-btn--ohlc")
    .addEventListener("click", function () {
      drawOHLCChart();
    });

  // "Price Chart" Button Event Listener
  document
    .querySelector(".sn-btn--price")
    .addEventListener("click", async function () {
      if (currentCoinHistoricalData.prices.length == 0) {
        await getCurrentCoinHistoricalData();
      }
      drawHistoricalChart("price");
    });

  // "Market Cap Chart" Button Event Listener
  document
    .querySelector(".sn-btn--market-cap")
    .addEventListener("click", async function () {
      if (currentCoinHistoricalData.prices.length == 0) {
        await getCurrentCoinHistoricalData();
      }
      drawHistoricalChart("market-cap");
    });

  // "Total Volume Chart" Button Event Listener
  document
    .querySelector(".sn-btn--total-volume")
    .addEventListener("click", async function () {
      if (currentCoinHistoricalData.prices.length == 0) {
        await getCurrentCoinHistoricalData();
      }
      drawHistoricalChart("total-volume");
    });

  // "News" Button Event Listener
  document
    .querySelector(".sn-btn--news")
    .addEventListener("click", async function () {
      // TODO
    });

  // "Reddit" Button Event Listener
  document
    .querySelector(".sn-btn--reddit")
    .addEventListener("click", async function () {
      // TODO
    });
}

async function main() {
  await cacheCoinNamesInSession();

  addSearchBarEventListeners();
  await getCurrentCoinInfo();

  await getCurrentCoinOHLC();
  drawOHLCChart();

  await addSecondNavButtonEventListeners();
}

main();
