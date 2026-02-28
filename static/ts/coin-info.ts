declare const Highcharts: any;
import {
  getAllCoinNamesDict,
  formatFloatToUSD,
  scrollToSection,
} from "./helpers.js";

// ==============================
// ===== TYPES + INTERFACES =====
// ==============================

type CurrentCoinInfoType = {
  ath?: number;
  ath_change_percentage?: number;
  ath_date?: string;
  atl?: number;
  atl_change_percentage?: number;
  atl_date?: string;
  circulating_supply?: number;
  current_price?: number;
  fully_diluted_valuation?: number;
  high_24h?: number;
  id: string;
  image?: string;
  last_updated?: string;
  low_24h?: number;
  market_cap?: number;
  market_cap_change_24h?: number;
  market_cap_change_percentage_24h?: number;
  market_cap_rank?: number;
  max_supply?: number;
  name: string;
  price_change_24h?: number;
  price_change_percentage_24h?: number;
  price_change_percentage_24h_in_currency?: number;
  roi?: null | {
    currency: string;
    percentage: number;
    times: number;
  };
  symbol?: string;
  total_supply?: number;
  total_volume?: number;
};

type RedditPostInfo = {
  comment_count: number;
  content: string;
  fullname: string;
  id: string;
  score: number;
  subreddit: string;
  thumbnail: string;
  timestamp: string;
  title: string;
  url: string;
};

type NewsArticleInfo = {
  description: string;
  publisher: string;
  timestamp: string;
  title: string;
  url: string;
};

type CoinHistoricalData = {
  prices: number[];
  market_caps: number[];
  total_volumes: number[];
};

type RawRedditPostsData = {
  comment_count: number;
  content: string;
  fullname: string;
  id: string;
  score: number;
  subreddit: string;
  thumbnail: string;
  timestamp: string;
  title: string;
  url: string;
};

type RawNewsArticlesData = {
  description: string;
  publisher: string;
  timestamp: string;
  title: string;
  url: string;
};

// ========================
// ===== INITIAL DATA =====
// ========================

let currentCoin: CurrentCoinInfoType = { id: "bitcoin", name: "Bitcoin" };
let coinNamesDict: Record<string, [string, string]> = {};
let currentCoinOHLC: [number, number, number, number, number][] = [];
let currentCoinHistoricalData: CoinHistoricalData = {
  prices: [],
  market_caps: [],
  total_volumes: [],
};
let newsArticlesToRender: NewsArticleInfo[] = [];
let newsArticlesCurrentPage = 1;
let redditPostsToRender: RedditPostInfo[] = [];

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
 * @function cacheCoinNamesInSession
 * @returns {Promise<void>} A promise that resolves once the data is either fetched and
 *                          stored in session storage or retrieved from session storage.
 * @global {Object} coinNamesDict - A module-scoped global variable holding the coin
 *                                  names dictionary.
 * @throws {Error} Will throw an error if getAllCoinNamesDict() fails or session storage
 *                 access fails.
 */
async function cacheCoinNamesInSession(): Promise<void> {
  // If data doesn't exist in session storage
  if (sessionStorage.getItem("coinNamesDict") === null) {
    const temp = await getAllCoinNamesDict();
    if (!temp) return;
    coinNamesDict = temp;
    sessionStorage.setItem("coinNamesDict", JSON.stringify(coinNamesDict));
  } else {
    coinNamesDict = JSON.parse(sessionStorage.getItem("coinNamesDict")!);
  }
}

// ////////// SEARCH BOX EVENT LISTENERS //////////
/**
 * Attaches event listeners to the search bar, search results container, and the
 * document to handle search input, result selection, and clicks outside of the
 * search context.
 *
 * The function sets up three main event listeners:
 * 1. An input event on the search bar to filter and display results dynamically as
 *    the user types.
 * 2. A click event on the search results to handle user interactions with the
 *    dynamically generated search results. It processes the selection of a coin by
 *    fetching and displaying detailed information about the selected coin, and
 *    updates various components of the UI such as charts and news related to the
 *    selected coin.
 * 3. A click event on the document to clear the search results if a click occurs
 *    outside the search bar or results area.
 *
 * @function addSearchBarEventListeners
 */
function addSearchBarEventListeners(): void {
  // Event listener for showing dynamic results when the user types something in the
  // search bar
  document
    .querySelector(".coin-info__search-input")!
    .addEventListener("input", function (this: HTMLInputElement) {
      const input = this.value.trim();
      const resultsContainer = document.querySelector(
        ".coin-info__search-results",
      ) as HTMLDivElement;

      if (!input) {
        resultsContainer.style.display = "none";
        return;
      }

      const data = Object.keys(coinNamesDict);

      // Filter data based on input
      const filteredData = data.filter((item) =>
        item.toLowerCase().includes(input.toLowerCase()),
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
    .querySelector(".coin-info__search-results")!
    .addEventListener("click", async function (e) {
      // Check if the clicked element is a result item
      const targetElement = e.target as HTMLDivElement;

      if (targetElement.classList.contains("result-item")) {
        if (targetElement.textContent !== "No results found") {
          const selectedCoinName = targetElement.textContent;
          document.querySelector(".coin-info__search-results")!.innerHTML = "";
          (
            document.querySelector(
              ".coin-info__search-input",
            ) as HTMLInputElement
          ).value = selectedCoinName;

          currentCoin.id = coinNamesDict[targetElement.textContent]![1];

          // Get market info of selected coin and update the page
          await getCurrentCoinInfo();
          updateCoinInfo();

          // Get OHLC data of selected coin and render the chart
          await getCurrentCoinOHLC();
          drawOHLCChart();

          resetNewsArticles();
          await getAndRenderNewsArticles();

          resetRedditPosts();
          await getAndRenderRedditPosts();

          // Click the "OHLC Chart" button so that the OHLC chart is the one that is
          // shown
          (
            document.querySelector(".sn-btn--ohlc") as HTMLParagraphElement
          ).click();
        }
      } else {
        (document.querySelector(".search-box") as HTMLInputElement).value = "";
      }
    });

  // Event listener for when when the dynamically generated results are being shown
  // under the search bar, and the user clicks something other than one of the results
  // or the search bar
  document.addEventListener("click", function (e) {
    if (
      !(e.target as HTMLElement).classList.contains("coin-info__search") &&
      !(e.target as HTMLElement).classList.contains("coin-info__search-input")
    ) {
      document.querySelector(".coin-info__search-results")!.innerHTML = "";
    }
  });
}

/**
 * Gets information from the CoinGecko API about the coin that is stored in the
 * currentCoin global variable
 *
 * @async
 * @function getCurrentCoinInfo
 */
async function getCurrentCoinInfo(): Promise<[] | undefined> {
  // Make API call to get percentage_price_change and current price
  const fetchOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coin_id: currentCoin.id }),
  };

  try {
    const response = await fetch("/get_single_coin_data", fetchOptions);
    const data = await response.json();

    // Update currentCoin global variable
    currentCoin = data[0];

    // Update the coin last_updated time
    currentCoin.last_updated = timeAgoMinutesSeconds(currentCoin.last_updated!);

    // Update the coin ath_date and atl_date
    currentCoin.ath_date = timeAgoDaysMonths(currentCoin.ath_date!);
    currentCoin.atl_date = timeAgoDaysMonths(currentCoin.atl_date!);
  } catch (error) {
    console.error("Error:", error);
    return []; // Return an empty array in case of error
  }
}

/**
 * Converts a given date string into a relative time string expressed in minutes and
 * seconds ago.
 *
 * @function timeAgoMinutesSeconds
 * @param {string} dateString - The date string to convert. Must be a valid format
 *                              parseable by Date().
 * @returns {string} - A string representing the time elapsed since the given date, in
 *                     the format of minutes and seconds ago.
 */
function timeAgoMinutesSeconds(dateString: string): string {
  const dateObject = new Date(dateString);
  const now = new Date();

  // Calculate the difference in milliseconds
  const diffMs = now.getTime() - dateObject.getTime();

  // Convert the difference to seconds
  const diffSeconds = Math.floor(diffMs / 1000);

  // Calculate minutes and seconds
  const minutes = Math.floor(diffSeconds / 60);
  const seconds = diffSeconds % 60;

  return `${minutes} minutes ${seconds} seconds ago`;
}

/**
 * Converts a given date string into a relative time string expressed in months and
 * days ago.
 *
 * @function timeAgoDaysMonths
 * @param {string} dateString - The date string to convert. Must be a valid format
 *                              parseable by Date().
 * @returns {string} - A string representing the time elapsed since the given date,
 *                     potentially in months and days. Returns only days if the elapsed
 *                     time is less than a month.
 */
function timeAgoDaysMonths(dateString: string): string {
  const dateObject = new Date(dateString);
  const now = new Date();

  // Calculate the difference in milliseconds
  const diffMs = now.getTime() - dateObject.getTime();

  // Convert the difference to days
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Calculate months and days
  const months = Math.floor(diffDays / 30); // Approximate months as 30 days
  const days = diffDays % 30;

  if (months > 0) {
    return `${months} months ${days} days ago`;
  } else {
    return `${days} days ago`;
  }
}

/**
 * Fetches the OHLC (Open, High, Low, Close) data for the cryptocurrency specified by
 * the "currentCoin" global variable over the last 365 days using the CoinGeckoAPI.
 *
 * @async
 * @function getCurrentCoinOHLC
 * @returns {Promise<void>} A promise that resolves when the API call is complete.
 * On success, it updates the global `currentCoinOHLC` variable with the fetched OHLC data.
 * On failure, it logs an error and returns an empty array.
 * @throws Will log an error if the API request fails.
 */
async function getCurrentCoinOHLC(): Promise<[] | undefined> {
  // Make API call to get percentage_price_change and current price
  const fetchOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coin_id: currentCoin.id }),
  };

  try {
    const response = await fetch("/get_coin_OHLC_data", fetchOptions);
    const data = await response.json();
    currentCoinOHLC = data;
  } catch (error) {
    console.error("Error:", error);
    return []; // Return an empty array in case of error
  }
}

/**
 * Fetches the historical market data (prices, market caps, and total volumes)
 * for the cryptocurrency specified by the "currentCoin" global variable over the last
 * 365 days using the CoinGecko API.
 *
 * @async
 * @function getCurrentCoinHistoricalData
 * @returns {Promise<void>} A promise that resolves when the API call is complete:
 *                          - On success, it updates the global
 *                            `currentCoinHistoricalData` object with the fetched data,
 *                            including prices, market caps, and total volumes.
 *                          - On failure, it logs an error and returns an empty array.
 * @throws Will log an error if the API request fails.
 */
async function getCurrentCoinHistoricalData(): Promise<[] | undefined> {
  // Make API call to get percentage_price_change and current price
  const fetchOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coin_id: currentCoin.id }),
  };

  try {
    const response = await fetch("/get_coin_historical_data", fetchOptions);
    const data = await response.json();

    currentCoinHistoricalData.prices = data.prices;
    currentCoinHistoricalData.market_caps = data.market_caps;
    currentCoinHistoricalData.total_volumes = data.total_volumes;
  } catch (error) {
    console.error("Error:", error);
    return []; // Return an empty array in case of error
  }
}

/**
 * Draws a candlestick chart for the cryptocurrency (specified by the "currentCoin"
 * global variable), based off of its OHLC (Open, High, Low, Close) data using the
 * Highcharts library.
 *
 * @function drawOHLCChart
 * @throws - Will log an error if the chart rendering fails or if the `currentCoinOHLC`
 *           data is not properly loaded.
 */
function drawOHLCChart(): void {
  Highcharts.stockChart("coin-info-chart", {
    chart: {
      borderRadius: 8,
      height: 431,
    },

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
      text: `${currentCoin.name} OHLC`,
    },

    series: [
      {
        type: "candlestick",
        name: `${currentCoin.name} OHLC`,
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

/**
 * Draws a historical chart for the cryptocurrency specified by the "currentCoin" global
 * variable.
 * This function uses the Highcharts library to render a stock chart displaying
 * historical price, market cap, or total volume data based on the `coin_data` parameter.
 *
 * @function drawHistoricalChart
 * @param {string} [coin_data="price"] - The type of cryptocurrency data to display in
 *                                       the chart. It can be "price", "market-cap", or
 *                                       "total-volume".
 */
function drawHistoricalChart(coin_data = "price"): void {
  let data = [];

  if (coin_data === "price") {
    data = currentCoinHistoricalData.prices;
    coin_data = "Price";
  } else if (coin_data === "market-cap") {
    data = currentCoinHistoricalData.market_caps;
    coin_data = "Market Cap";
  } else if (coin_data === "total-volume") {
    data = currentCoinHistoricalData.total_volumes;
    coin_data = "Volume";
  } else {
    return;
  }

  Highcharts.stockChart("coin-info-chart", {
    chart: {
      borderRadius: 8,
      height: 431,
    },

    rangeSelector: {
      selected: 1,
    },

    title: {
      text: `${currentCoin.name} ${coin_data}`,
    },

    series: [
      {
        name: `${currentCoin.name} ${coin_data}`,
        data: data,
        tooltip: { valueDecimals: 2 },
        color: "#EB5757", // #17C671 #EB5757
      },
    ],
  });
}

/**
 * Adds event listeners to the second navigation buttons for interacting with various
 * charts and features.
 *
 * - "OHLC Chart" button triggers the drawing of the OHLC chart.
 * - "Price Chart" button fetches the historical data (if not already fetched) and
 *   draws the price chart.
 * - "Market Cap Chart" button fetches the historical data (if not already fetched) and
 *   draws the market cap chart.
 * - "Total Volume Chart" button fetches the historical data (if not already fetched)
 *   and draws the total volume chart.
 * - "News" and "Reddit" buttons are placeholders for future event handling.
 *
 * @async
 * @function addSecondNavButtonEventListeners
 */
async function addSecondNavButtonEventListeners(): Promise<void> {
  // "OHLC Chart" button selected by default
  (
    document.querySelector(".sn-btn--ohlc") as HTMLParagraphElement
  ).style.borderBottom = "1.6px solid #17c671";

  // "OHLC Chart" Button Event Listener
  document
    .querySelector(".sn-btn--ohlc")!
    .addEventListener("click", function (this: HTMLParagraphElement) {
      resetAllSecondNavButtonStyles();
      this.style.borderBottom = "1.6px solid #17c671";

      drawOHLCChart();
    });

  // "Price Chart" Button Event Listener
  document
    .querySelector(".sn-btn--price")!
    .addEventListener("click", async function (this: HTMLParagraphElement) {
      resetAllSecondNavButtonStyles();
      this.style.borderBottom = "1.6px solid #17c671";

      if (currentCoinHistoricalData.prices.length == 0) {
        await getCurrentCoinHistoricalData();
      }
      drawHistoricalChart("price");
    });

  // "Market Cap Chart" Button Event Listener
  document
    .querySelector(".sn-btn--market-cap")!
    .addEventListener("click", async function (this: HTMLParagraphElement) {
      resetAllSecondNavButtonStyles();
      this.style.borderBottom = "1.6px solid #17c671";

      if (currentCoinHistoricalData.prices.length == 0) {
        await getCurrentCoinHistoricalData();
      }
      drawHistoricalChart("market-cap");
    });

  // "Total Volume Chart" Button Event Listener
  document
    .querySelector(".sn-btn--total-volume")!
    .addEventListener("click", async function (this: HTMLParagraphElement) {
      resetAllSecondNavButtonStyles();
      this.style.borderBottom = "1.6px solid #17c671";

      if (currentCoinHistoricalData.prices.length == 0) {
        await getCurrentCoinHistoricalData();
      }
      drawHistoricalChart("total-volume");
    });

  // "News" Button Event Listener
  document
    .querySelector(".sn-btn--news")!
    .addEventListener("click", async function (e) {
      scrollToSection(e, "#recent-news-section", 90);
    });

  // "Reddit" Button Event Listener
  document
    .querySelector(".sn-btn--reddit")!
    .addEventListener("click", async function (e) {
      scrollToSection(e, "#reddit-section", 90);
    });
}

/**
 * Resets the style for all buttons in the secondary navigation bar in the coin info
 * page. Specifically, it removes the green bottom border style from all buttons. The
 * buttons are used to switch between different charts and the news and Reddit
 * sections.
 *
 * This function is typically called when there's a need to normalize the appearance of
 * navigation buttons, generally before highlighting a newly active button.
 *
 * @function resetAllSecondNavButtonStyles
 */
function resetAllSecondNavButtonStyles(): void {
  document.querySelectorAll(".second-nav-buttons p").forEach((button) => {
    (button as HTMLParagraphElement).style.borderBottom = "1.6px solid #f5f5fa";
  });
}

/**
 * Updates the DOM with current cryptocurrency data for the coin specified by the
 * "currentCoin" global variable.
 *
 * This function modifies various HTML elements to reflect the current information
 * of the selected cryptocurrency (`currentCoin`). It updates the coin's image,
 * name, ticker symbol, price, price changes, market cap, volume, supply details,
 * fully diluted market cap, all-time high (ATH), and all-time low (ATL) data.
 *
 * @function updateCoinInfo
 */
function updateCoinInfo(): void {
  const coinImg = document.querySelector(".coin-name img") as HTMLImageElement;
  const coinPriceChangeImg = document.querySelector(
    ".coin-price-change img",
  ) as HTMLImageElement;
  const coinPriceChangePara = document.querySelector(
    ".coin-price-change p",
  ) as HTMLParagraphElement;
  const coinMarketCapImg = document.querySelector(
    ".coin-market-cap img",
  ) as HTMLImageElement;

  // Update image + name + ticker
  coinImg.setAttribute("src", currentCoin.image!);
  document.querySelector(".coin-name p:nth-of-type(1)")!.textContent =
    currentCoin.name;
  document.querySelector(".coin-name p:nth-of-type(2)")!.textContent =
    "(" + currentCoin.symbol + ")";

  // Update coin price
  document.querySelector(".coin-price")!.textContent =
    "$" + formatFloatToUSD(currentCoin.current_price!, 2);

  // Update coin price changes
  if (currentCoin.price_change_percentage_24h! >= 0) {
    coinPriceChangeImg.setAttribute(
      "src",
      "../../static/img/icons/arrow-up.svg",
    );
    coinPriceChangeImg.style.filter =
      "brightness(0) saturate(100%) invert(64%) sepia(13%) saturate(6613%) hue-rotate(105deg) brightness(97%) contrast(82%)";
    coinPriceChangePara.style.color = "#17C671";
  } else {
    coinPriceChangeImg.setAttribute(
      "src",
      "../../static/img/icons/arrow-down.svg",
    );
    coinPriceChangeImg.style.filter =
      "brightness(0) saturate(100%) invert(38%) sepia(8%) saturate(7345%) hue-rotate(322deg) brightness(111%) contrast(82%)";
    coinPriceChangePara.style.color = "#EB5757";
  }

  coinPriceChangePara.textContent = `${currentCoin.price_change_percentage_24h!.toFixed(2)}% (1d)`;
  // Last updated text
  document.querySelector(".coin-last-updated")!.textContent =
    "Last updated: " + currentCoin.last_updated;

  // Market cap
  if (currentCoin.market_cap_change_percentage_24h! >= 0) {
    coinMarketCapImg.setAttribute("src", "../../static/img/icons/arrow-up.svg");
    coinMarketCapImg.style.filter =
      "brightness(0) saturate(100%) invert(64%) sepia(13%) saturate(6613%) hue-rotate(105deg) brightness(97%) contrast(82%)";
    (
      document.querySelector(
        ".coin-market-cap .percentage-change",
      ) as HTMLParagraphElement
    ).style.color = "#17C671";
  } else {
    coinMarketCapImg.setAttribute(
      "src",
      "../../static/img/icons/arrow-down.svg",
    );
    coinMarketCapImg.style.filter =
      "brightness(0) saturate(100%) invert(38%) sepia(8%) saturate(7345%) hue-rotate(322deg) brightness(111%) contrast(82%)";
    (
      document.querySelector(
        ".coin-market-cap .percentage-change",
      ) as HTMLParagraphElement
    ).style.color = "#EB5757";
  }
  document.querySelector(".coin-market-cap .percentage-change")!.textContent =
    `${currentCoin.market_cap_change_percentage_24h!.toFixed(2)}% (1d)`;
  document.querySelector(".coin-market-cap .value")!.textContent =
    `$${currentCoin.market_cap!.toLocaleString()}`;

  // Market cap rank
  const market_cap_rank = currentCoin.market_cap_rank
    ? "#" + currentCoin.market_cap_rank
    : "N/A";
  document.querySelector(".coin-market-cap .rank")!.textContent =
    market_cap_rank;
  document
    .querySelector(".coin-market-cap .rank")!
    .setAttribute("title", "Market Cap Rank: " + market_cap_rank);

  // Volume
  document.querySelector(".coin-volume .value")!.textContent =
    "$" + currentCoin.total_volume!.toLocaleString();

  // Circulating supply
  document.querySelector(".coin-circulating-supply .value")!.textContent =
    currentCoin.circulating_supply!.toLocaleString();

  // Total supply
  document.querySelector(".coin-total-supply .value")!.textContent =
    currentCoin.total_supply!.toLocaleString();

  // Max supply
  const max_supply = currentCoin.max_supply
    ? currentCoin.max_supply.toLocaleString()
    : "∞";

  document.querySelector(".coin-max-supply .value")!.textContent = max_supply;

  // Fully diluted market cap
  document.querySelector(".coin-fully-diluted-market-cap .value")!.textContent =
    `$${currentCoin.fully_diluted_valuation!.toLocaleString()}`;

  // All time high
  (document.querySelector(".coin-ath img") as HTMLImageElement).style.filter =
    "brightness(0) saturate(100%) invert(38%) sepia(8%) saturate(7345%) hue-rotate(322deg) brightness(111%) contrast(82%)";
  (
    document.querySelector(
      ".coin-ath .percentage-change",
    ) as HTMLParagraphElement
  ).style.color = "#EB5757";
  document.querySelector(".coin-ath .percentage-change")!.textContent =
    `${currentCoin.ath_change_percentage}%`;
  document.querySelector(".coin-ath .value")!.textContent = `$${currentCoin
    .ath!.toFixed(2)
    .toLocaleString()}`;
  document.querySelector(".coin-ath .timestamp")!.textContent =
    "(" + currentCoin.ath_date + ")";

  // All time low
  (document.querySelector(".coin-atl img") as HTMLImageElement).style.filter =
    "brightness(0) saturate(100%) invert(55%) sepia(91%) saturate(414%) hue-rotate(98deg) brightness(94%) contrast(90%)";
  (
    document.querySelector(
      ".coin-atl .percentage-change",
    ) as HTMLParagraphElement
  ).style.color = "#17C671";
  document.querySelector(".coin-atl .percentage-change")!.textContent =
    `${currentCoin.atl_change_percentage}%`;
  document.querySelector(".coin-atl .value")!.textContent = `$${currentCoin
    .atl!.toFixed(2)
    .toLocaleString()}`;
  document.querySelector(".coin-atl .timestamp")!.textContent =
    "(" + currentCoin.atl_date + ")";

  // Recent Coin News Heading
  document.querySelector(".recent-news__title")!.textContent =
    `Recent ${currentCoin.name} News`;
}

/**
 * Fetches news articles based on a search query (supposed to be the id of the current
 * coin) and page number.
 * Sends a POST request to the "/get_news" endpoint with the specified query and page.
 * Returns an array of objects, with each object containing information about each
 * article.
 *
 * @async
 * @function getNewsArticles
 * @param {string} query - The search query for fetching news articles
 * @param {number} page - The page number of the results to fetch
 * @returns {Promise<Object[]>} - A promise that resolves to an array of article objects
 */
async function getNewsArticles(
  query: string,
  page: number,
): Promise<RawNewsArticlesData[]> {
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page: page, query: query }),
  };

  const response = await fetch("/get_news", fetchOptions);
  const data: [{ articles: RawNewsArticlesData[]; succes: string }, number] =
    await response.json();
  return data[0].articles;
}

/**
 * Dynamically renders news articles into the DOM by creating and updating HTML elements.
 * Uses data stored in the global variable `newsArticlesToRender` to render the articles.
 *
 * - Removes the "See more" button if it exists
 * - Creates and appends a news article for each article object in `newsArticlesToRender`
 * - Adds a new "See more" button at the end of the news articles
 * - Adds a click event listener to the "See more" button to fetch and render more articles
 *
 * @function renderNewsArticles
 * @returns {void}
 */
function renderNewsArticles(): void {
  // Delete "See more" button if it exists
  let seeMoreNewsButton = document.querySelector(".see-more-btn--news");
  if (seeMoreNewsButton) seeMoreNewsButton.remove();

  for (const article of newsArticlesToRender) {
    const markup = `
      <div class="news-timeline-circle"></div>
      <p class="news-post__timestamp">24 minutes ago</p>
      <a class="news-post__title" href="">
        Miners ditch Bitcoin for AI as enery costs surge
      </a>
      <p class="news-post__description">
        Bitcoin miners are bailing on the crypto grind, switching gears to
        artificial intelligence (AI) as rising energy costs make it...
      </p>
      <p class="news-post__author">Cryptopolitan</p>
        `;

    const newsPost = document.createElement("div");
    newsPost.classList.add("news-post");
    newsPost.innerHTML = markup;

    // Change content of news post
    // Update timestamp
    newsPost.querySelector(".news-post__timestamp")!.textContent =
      article.timestamp;

    // Update title
    newsPost.querySelector(".news-post__title")!.textContent = article.title;
    (newsPost.querySelector(".news-post__title") as HTMLAnchorElement).href =
      article.url;

    // Update article description
    newsPost.querySelector(".news-post__description")!.textContent =
      article.description;

    document.querySelector(".news-container")!.appendChild(newsPost);
  }

  // Add in "See more" button at the end
  seeMoreNewsButton = document.createElement("div");
  seeMoreNewsButton.classList.add("see-more-btn--news");
  seeMoreNewsButton.textContent = "See more";
  document
    .querySelector(".see-more-btn--news__container")!
    .appendChild(seeMoreNewsButton);

  seeMoreNewsButton.addEventListener("click", function (this: HTMLDivElement) {
    this.textContent = "";
    this.classList.toggle("button--loading");

    getAndRenderNewsArticles();
  });
}

/**
 * Fetches news articles for the current coin and page, then renders them in the DOM.
 * Increments the page number after rendering the articles.
 *
 * @async
 * @function getAndRenderNewsArticles
 * @returns {Promise<void>} - A promise that resolves when the news articles have been
 *                            fetched and rendered.
 */
async function getAndRenderNewsArticles(): Promise<void> {
  newsArticlesToRender = await getNewsArticles(
    currentCoin.name,
    newsArticlesCurrentPage,
  );

  renderNewsArticles();
  newsArticlesCurrentPage++;
}

/**
 * Resets the news articles by clearing the array of articles to render, resetting the
 * page number to 1, and clearing the HTML content of the news articles container.
 *
 * @function resetNewsArticles
 * @returns {void}
 */
function resetNewsArticles(): void {
  newsArticlesToRender = [];
  newsArticlesCurrentPage = 1;
  document.querySelector(".news-container")!.innerHTML = "";
}

/**
 * Resets the reddit posts by clearing the array of reddit posts to render, and
 * clearing the HTML content of the news articles container.
 *
 * @function resetNewsArticles
 * @returns {void}
 */
function resetRedditPosts(): void {
  redditPostsToRender = [];
  document.querySelector(".reddit-posts-container")!.innerHTML = "";
}

/**
 * Fetches Reddit posts based on a search query and pagination cursor.
 * Sends a POST request to the "/get_reddit_posts" endpoint with the specified query
 * and after parameter.
 *
 * @async
 * @function getRedditPosts
 * @param {string} query - The search query for fetching Reddit posts.
 * @param {string} after - The pagination cursor for fetching posts after a specific
 *                         point.
 * @returns {Promise<Object[]>} -  A promise that resolves to an array of Reddit post
 *                                 objects.
 */
async function getRedditPosts(
  query: string,
  after: string,
): Promise<RawRedditPostsData[]> {
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: query, after: after }),
  };

  const response = await fetch("/get_reddit_posts", fetchOptions);
  const data: [{ posts: RawRedditPostsData[]; success: string }, number] =
    await response.json();

  return data[0].posts;
}

/**
 * Dynamically renders Reddit posts into the DOM by creating and updating HTML elements.
 * Uses data stored in the global variable `redditPostsToRender` to render the posts.
 *
 * - Removes the "See more" button if it exists
 * - Creates and appends a Reddit post for each post object in `redditPostsToRender`
 * - Adds a new "See more" button at the end of the Reddit posts
 * - Adds a click event listener to the "See more" button to fetch and render more posts
 *
 * @function renderRedditPosts
 * @returns {void}
 */
function renderRedditPosts() {
  // Delete "See more" button if it exists
  let seeMoreRedditButton = document.querySelector(".see-more-btn--reddit");
  if (seeMoreRedditButton) seeMoreRedditButton.remove();

  const markup = `
    <div class="reddit-timeline-circle"></div>
    <div class="reddit-post__main">
      <p class="timestamp">4d ago</p>

      <p class="subreddit">r/CryptoCurrency</p>
      <a class="title" href="">
        Bitcoin could soon hit six figures regardless of who wins U.S.
        election, investors say
      </a>

      <p class="content">
        Bitcoin (BTC) may soon kick off a significant bull run as it nears a
        pivotal price point, according...
      </p>

      <div class="last">
        <p class="score">495 votes</p>
        <p>·</p>
        <p class="comment-count">295 comments</p>
      </div>
    </div>
    <img
      class="reddit-post__thumbnail" loading="lazy"
      src="../../static/img/reddit-thumbnail-placeholder.png"
      draggable="false"
    />
  `;

  for (const post of redditPostsToRender) {
    const newDiv = document.createElement("div");
    newDiv.classList.add("reddit-post");
    newDiv.innerHTML = markup;

    // Update content of reddit post
    // Update timestamp
    newDiv.querySelector(".timestamp")!.textContent = post.timestamp;

    // Update subreddit
    newDiv.querySelector(".subreddit")!.textContent = post.subreddit;

    // Update title
    newDiv.querySelector(".title")!.textContent = post.title;
    (newDiv.querySelector(".title") as HTMLAnchorElement).href = post.url;

    // Update content
    newDiv.querySelector(".content")!.textContent = post.content
      ? post.content.slice(0, 200) + "..."
      : "";

    // Update score
    newDiv.querySelector(".score")!.textContent = post.score + " votes";

    // Update comment count
    newDiv.querySelector(".comment-count")!.textContent =
      post.comment_count + " comments";

    // Update thumbnail
    if (post.thumbnail) {
      (
        newDiv.querySelector(".reddit-post__thumbnail") as HTMLImageElement
      ).src = post.thumbnail;
    }

    document.querySelector(".reddit-posts-container")!.appendChild(newDiv);
  }

  // Add in "See more" button at the end
  seeMoreRedditButton = document.createElement("div");
  seeMoreRedditButton.classList.add("see-more-btn--reddit");
  seeMoreRedditButton.textContent = "See more";
  document
    .querySelector(".see-more-btn--reddit__container")!
    .appendChild(seeMoreRedditButton);

  seeMoreRedditButton.addEventListener(
    "click",
    function (this: HTMLDivElement) {
      this.textContent = "";
      this.classList.toggle("button--loading");

      getAndRenderRedditPosts();
    },
  );

  // Recent Reddit Posts Heading
  document.querySelector(".reddit-posts__title")!.textContent =
    `Recent Reddit Posts on ${currentCoin.name}`;
}

/**
 * Fetches Reddit posts for the current coin and renders them in the DOM.
 * If there are already posts rendered, it fetches the next batch using the "fullname"
 * attribute of the last post for pagination (as required by the Reddit API)
 *
 * @async
 * @function getAndRenderRedditPosts
 * @returns {Promise<void>} - A promise that resolves when the Reddit posts have been
 *                            fetched and rendered.
 */
async function getAndRenderRedditPosts(): Promise<void> {
  const afterPost =
    redditPostsToRender.length > 0 ? redditPostsToRender.at(-1)!.fullname : "";

  redditPostsToRender = await getRedditPosts(currentCoin.name, afterPost);

  renderRedditPosts();
}

async function main(): Promise<void> {
  // Cache coin names in session storage
  await cacheCoinNamesInSession();

  // Get current coin info and update the page to reflect the data
  await getCurrentCoinInfo();
  updateCoinInfo();

  // Get OHLC data for the current coin and render the OHLC chart
  await getCurrentCoinOHLC();
  drawOHLCChart();

  // Get and render news articles and Reddit posts
  await getAndRenderNewsArticles();
  await getAndRenderRedditPosts();

  // Add event listeners to the search bar for dynamic search functionality
  addSearchBarEventListeners();

  // Add event listeners to each button in the secondary navigation bar
  await addSecondNavButtonEventListeners();
}

main();
