import {
  COINGECKO_API_OPTIONS,
  showMessagePopup,
  hideMessagePopup,
  addMessagePopupCloseEventListener,
  getAllCoinNamesDict,
  formatFloatToUSD,
} from "../js/helpers.js";

let currentCoin = { id: "bitcoin", name: "Bitcoin" };
let coinNamesDict = {};
let currentCoinOHLC = [];
let currentCoinHistoricalData = {
  prices: [],
  market_caps: [],
  total_volumes: [],
};
let newsArticlesToRender = [];
let newsArticlesCurrentPage = 1;
let redditPostsToRender = [];

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
          document.document.querySelector(".sn-btn--ohlc").click();
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

    // Update currentCoin global variable
    currentCoin = data[0];
  } catch (error) {
    console.error("Error:", error);
    return []; // Return an empty array in case of error
  }
}

/**
 * Fetches the OHLC (Open, High, Low, Close) data for the cryptocurrency specified by
 * the "currentCoin" global variable over the last 365 days using the CoinGeckoAPI.
 *
 * @async
 * @function getCurrentCoinOHLC
 *
 * @returns {Promise<void>} A promise that resolves when the API call is complete.
 * On success, it updates the global `currentCoinOHLC` variable with the fetched OHLC data.
 * On failure, it logs an error and returns an empty array.
 *
 * @throws Will log an error if the API request fails.
 */
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

/**
 * Fetches the historical market data (prices, market caps, and total volumes)
 * for the cryptocurrency specified by the "currentCoin" global variable over the last
 * 365 days using the CoinGecko API.
 *
 * @async
 * @function getCurrentCoinHistoricalData
 *
 * @returns {Promise<void>} A promise that resolves when the API call is complete.
 * On success, it updates the global `currentCoinHistoricalData` object with
 * the fetched data, including prices, market caps, and total volumes.
 * On failure, it logs an error and returns an empty array.
 *
 * @throws Will log an error if the API request fails.
 */
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

/**
 * Draws a candlestick chart for the cryptocurrency (specified by the "currentCoin"
 * global variable), based off of its OHLC (Open, High, Low, Close) data using the
 * Highcharts library.
 *
 * @function drawOHLCChart
 *
 * @throws Will log an error if the chart rendering fails or if the `currentCoinOHLC` data is not properly loaded.
 */
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

/**
 * Draws a historical chart for the cryptocurrency specified by the "currentCoin" global
 * variable.
 * This function uses the Highcharts library to render a stock chart displaying
 * historical price, market cap, or total volume data based on the `coin_data` parameter.
 *
 * @param {string} [coin_data="price"] - The type of cryptocurrency data to display in
 *                                       the chart. It can be "price", "market-cap", or
 *                                       "total-volume".
 */
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
      scrollToSection(event, "#recent-news-section", 90);
    });

  // "Reddit" Button Event Listener
  document
    .querySelector(".sn-btn--reddit")
    .addEventListener("click", async function () {
      scrollToSection(event, "#reddit-section", 90);
    });
}

function scrollToSection(event, sectionId, offset) {
  event.preventDefault(); // Prevent the default jump to anchor behavior

  const target = document.querySelector(sectionId);
  const elementPosition = target.getBoundingClientRect().top + window.scrollY;
  const offsetPosition = elementPosition - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth", // Optional smooth scrolling
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
 * @function
 * @global
 */
function updateCoinInfo() {
  // Update image + name + ticker
  document
    .querySelector(".coin-name img")
    .setAttribute("src", currentCoin.image);
  document.querySelector(".coin-name p:nth-of-type(1)").textContent =
    currentCoin.name;
  document.querySelector(".coin-name p:nth-of-type(2)").textContent =
    currentCoin.symbol;

  // Update coin price
  document.querySelector(".coin-price").textContent =
    "$" + formatFloatToUSD(currentCoin.current_price, 2);

  // Update coin price changes
  if (currentCoin.price_change_percentage_24h >= 0) {
    document
      .querySelector(".coin-price-change img")
      .setAttribute("src", "../../static/img/icons/arrow-up.svg");
    document.querySelector(".coin-price-change img").style.color = "#17C671";
    document.querySelector(".coin-price-change p").style.color = "#17C671";
  } else {
    document
      .querySelector(".coin-price-change img")
      .setAttribute("src", "../../static/img/icons/arrow-down.svg");
    document.querySelector(".coin-price-change img").style.color = "#EB5757";
    document.querySelector(".coin-price-change p").style.color = "#EB5757";
  }
  document.querySelector(
    ".coin-price-change p"
  ).textContent = `${currentCoin.price_change_percentage_24h.toFixed(2)} (1d)`;

  // Last updated text
  document.querySelector(".coin-last-updated").textContent = new Date();

  // Market cap
  if (currentCoin.market_cap_change_percentage_24h >= 0) {
    document
      .querySelector(".coin-market-cap img")
      .setAttribute("src", "../../static/img/icons/arrow-up.svg");
    document.querySelector(".coin-market-cap img").style.color = "#17C671";
    document.querySelector(".coin-market-cap .percentage-change").style.color =
      "#17C671";
  } else {
    document
      .querySelector(".coin-market-cap img")
      .setAttribute("src", "../../static/img/icons/arrow-up.svg");
    document.querySelector(".coin-market-cap img").style.color = "#EB5757";
    document.querySelector(".coin-market-cap .percentage-change").style.color =
      "#EB5757";
  }
  document.querySelector(
    ".coin-market-cap .percentage-change"
  ).textContent = `${currentCoin.market_cap_change_percentage_24h.toFixed(
    2
  )}% (1d)`;
  document.querySelector(
    ".coin-market-cap .value"
  ).textContent = `$${currentCoin.market_cap.toLocaleString()}`;
  document.querySelector(".coin-market-cap .rank").textContent =
    currentCoin.market_cap_rank;

  // Volume
  document.querySelector(".coin-volume .value").textContent =
    currentCoin.total_volume.toLocaleString();

  // Circulating supply
  document.querySelector(".coin-circulating-supply .value").textContent =
    currentCoin.circulating_supply.toLocaleString();

  // Total supply
  document.querySelector(".coin-total-supply .value").textContent =
    currentCoin.total_supply.toLocaleString();

  // Max supply
  const max_supply = currentCoin.max_supply
    ? currentCoin.max_supply.toLocaleString()
    : "∞";
  document.querySelector(".coin-max-supply .value").textContent = max_supply;

  // Fully diluted market cap
  document.querySelector(
    ".coin-fully-diluted-market-cap .value"
  ).textContent = `$${currentCoin.fully_diluted_valuation.toLocaleString()}`;

  // All time high
  document.querySelector(".coin-ath img").style.color = "#17C671";
  document.querySelector(".coin-ath .percentage-change").style.color =
    "#17C671";
  document.querySelector(
    ".coin-ath .percentage-change"
  ).textContent = `${currentCoin.ath_change_percentage}%`;
  document.querySelector(".coin-ath .value").textContent = `$${currentCoin.ath
    .toFixed(2)
    .toLocaleString()}`;
  document.querySelector(".coin-ath .timestamp").textContent =
    currentCoin.ath_date;

  // All time low
  document.querySelector(".coin-atl img").style.color = "#17C671";
  document.querySelector(".coin-atl .percentage-change").style.color =
    "#17C671";
  document.querySelector(
    ".coin-atl .percentage-change"
  ).textContent = `${currentCoin.atl_change_percentage}%`;
  document.querySelector(".coin-atl .value").textContent = `$${currentCoin.atl
    .toFixed(2)
    .toLocaleString()}`;
  document.querySelector(".coin-atl .timestamp").textContent =
    currentCoin.atl_date;

  // Recent Coin News Heading
  document.querySelector(
    ".recent-news__title"
  ).textContent = `Recent ${currentCoin.name} News`;
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
async function getNewsArticles(query, page) {
  // TODO add error handling to this function
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page: page, query: query }),
  };

  const response = await fetch("/get_news", fetchOptions);
  const data = await response.json();
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
function renderNewsArticles() {
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
    newsPost.querySelector(".news-post__timestamp").textContent =
      article.timestamp;

    // Update title
    newsPost.querySelector(".news-post__title").textContent = article.title;
    newsPost.querySelector(".news-post__title").href = article.url;

    // Update article description
    newsPost.querySelector(".news-post__description").textContent =
      article.description;

    document.querySelector(".news-container").appendChild(newsPost);
  }

  // Add in "See more" button at the end
  seeMoreNewsButton = document.createElement("div");
  seeMoreNewsButton.classList.add("see-more-btn--news");
  seeMoreNewsButton.textContent = "See more";
  document
    .querySelector(".see-more-btn--news__container")
    .appendChild(seeMoreNewsButton);

  seeMoreNewsButton.addEventListener("click", function () {
    console.log("BUTTON CLICKED");
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
async function getAndRenderNewsArticles() {
  newsArticlesToRender = await getNewsArticles(
    currentCoin.name,
    newsArticlesCurrentPage
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
function resetNewsArticles() {
  newsArticlesToRender = [];
  newsArticlesCurrentPage = 1;
  document.querySelector(".news-container").innerHTML = "";
}

/**
 * Resets the reddit posts by clearing the array of reddit posts to render, and
 * clearing the HTML content of the news articles container.
 *
 * @function resetNewsArticles
 * @returns {void}
 */
function resetRedditPosts() {
  redditPostsToRender = [];
  document.querySelector(".reddit-posts-container").innerHTML = "";
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
async function getRedditPosts(query, after) {
  // TODO add error handling to this function
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: query, after: after }),
  };

  const response = await fetch("/get_reddit_posts", fetchOptions);
  const data = await response.json();

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
      src="https://b.thumbs.redditmedia.com/eQzJHUaDCQofnouZQAAPJqsYgbhSpgt5tE84pYwzBUM.jpg"
    />
  `;

  for (const post of redditPostsToRender) {
    const newDiv = document.createElement("div");
    newDiv.classList.add("reddit-post");
    newDiv.innerHTML = markup;

    // Update content of reddit post
    // Update timestamp
    newDiv.querySelector(".timestamp").textContent = post.timestamp;

    // Update subreddit
    newDiv.querySelector(".subreddit").textConten = post.subreddit;

    // Update title
    newDiv.querySelector(".title").textContent = post.title;
    newDiv.querySelector(".title").href = post.url;

    // Update content
    newDiv.querySelector(".content").textContent = post.content;

    // Update score
    newDiv.querySelector(".score").textContent = post.score + " votes";

    // Update comment count
    newDiv.querySelector(".comment-count").textContent = post.comment_count;

    // Update thumbnail
    newDiv.querySelector(".reddit-post__thumbnail").src = post.thumbnail;

    document.querySelector(".reddit-posts-container").appendChild(newDiv);
  }

  // Add in "See more" button at the end
  seeMoreRedditButton = document.createElement("div");
  seeMoreRedditButton.classList.add("see-more-btn--reddit");
  seeMoreRedditButton.textContent = "See more";
  document
    .querySelector(".see-more-btn--reddit__container")
    .appendChild(seeMoreRedditButton);

  seeMoreRedditButton.addEventListener("click", function () {
    this.textContent = "";
    this.classList.toggle("button--loading");

    getAndRenderRedditPosts();
  });
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
async function getAndRenderRedditPosts() {
  const afterPost =
    redditPostsToRender.length > 0 ? redditPostsToRender.at(-1).fullname : "";

  redditPostsToRender = await getRedditPosts(currentCoin.name, afterPost);

  renderRedditPosts();
}

async function main() {
  await cacheCoinNamesInSession();

  addSearchBarEventListeners();
  await getCurrentCoinInfo();
  updateCoinInfo();

  await getCurrentCoinOHLC();
  drawOHLCChart();

  await addSecondNavButtonEventListeners();

  await getAndRenderNewsArticles();
  await getAndRenderRedditPosts();
}

main();
