import {
  COINGECKO_API_OPTIONS,
  showMessagePopup,
  hideMessagePopup,
  toTitleCase,
  formatFloatToUSD,
  addMessagePopupCloseEventListener,
} from "../js/helpers.js";
import { showNewTradeSidebarForSpecificCoin } from "../js/new-trade.js";

let globalFeedPosts = [];
let ownFeedPosts = [];
let globalPageCount = 1;
let ownPageCount = 0;
let currFeed = "global";

// type can be one of "global" or "own"
// page is 1-indexed

/**
 * Fetches feed posts from the server based on the specified feed type and page number
 *
 * @async
 * @function fetchFeedPosts
 * @param {string} type - The type of feed to fetch ("global" or "own" are the ONLY
 *                        options)
 * @param {number} page - The page number of the feed to fetch (1-indexed)
 * @returns {Promise<void>} - A promise that resolves when the feed posts have been
 *                            fetched and assigned.
 *
 * The function sends a POST request to the "/get_feedposts" endpoint, including the
 * feed type and page number in the request body. If the request is successful, it
 * updates either `globalFeedPosts` or `ownFeedPosts` with the received data. If no
 * data is available, it sets the respective feed to an empty array.
 */
async function fetchFeedPosts(type, page) {
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: type, page: page }),
  };

  const response = await fetch("/get_feedposts", fetchOptions);
  const data = await response.json();

  if (type == "global") {
    // If successful response
    if (data.success) {
      // If there are feedposts to show
      if (data.data) {
        globalFeedPosts = data.data;
      } else {
        // If there are no feedposts to show
        globalFeedPosts = [];
      }
    }
  } else if (type == "own") {
    // If successful response
    if (data.success) {
      // If there are feedposts to show
      if (data.data) {
        ownFeedPosts = data.data;
      } else {
        // If there are no feedposts to show
        ownFeedPosts = [];
      }
    }
  }
}

/**
 * Renders feed posts on the page based on the specified type ("global" or "own").
 *
 * @function renderFeedPosts
 *
 * This function dynamically generates feed post elements, updates their content based
 * on the transaction data, and appends them to the appropriate feed post container. It
 * also handles the like button animation, toggling, and sends an update request to the
 * server when a post is liked or unliked.
 *
 * @param {string} type - The type of feed to render. Can be either "global" for all
 *                        users' visible posts or "own" for the current user's posts
 *                        (both visible and invisible).
 *
 * Global feed posts are rendered into the ".global-feedposts-container" and own posts
 * into the ".own-feedposts-container".
 *
 * Each feed post includes:
 * - Profile image
 * - Username
 * - Timestamp of the transaction
 * - Order quantity and transaction type (buy or sell)
 * - Coin name and price per unit
 * - Optional comment on the transaction
 * - Like button with current likes count
 *
 * Clicking the like button toggles the "active" state and sends a request to update the like count on the server.
 *
 * @returns {void}
 */

function renderFeedPosts(type) {
  const markup = `
    <div class="feedpost-header">
      <img class="profile-img" src="" />

      <div class="feedpost-header__first">
        <p class="username"></p>
        <p class="timestamp"></p>
      </div>

      <div class="feedpost-header__second">
        <div>
          <p class="order-quantity"></p>
          <p class=coin-id></p>
        </div>

        <div>
          <p class="transaction-type"></p>
          <p>@</p>
          <p class="order-price"></p>
        </div>
      </div>
    </div>

    <div class="feedpost-comment">
      <p></p>
    </div>

    <div class="feedpost-likes">
      <ion-icon name="heart" class="like-btn">
        <div class='red-bg'></div>
      </ion-icon>
      <p class="likes-count"></p>
      <p>Likes</p>
    </div>
  `;

  let currFeedPosts = [];

  if (type === "global") {
    currFeedPosts = globalFeedPosts;
  } else if (type == "own") {
    currFeedPosts = ownFeedPosts;
  }

  for (let i = 0; i < currFeedPosts.length; i++) {
    // Create a new div element
    const div = document.createElement("div");
    div.classList.add("feedpost");
    div.innerHTML = markup;
    const currFeedPost = currFeedPosts[i];

    if (type == "global") {
      document.querySelector(".global-feedposts-container").appendChild(div);
    } else if (type == "own") {
      document.querySelector(".own-feedposts-container").appendChild(div);
    }

    // //////////////////// Update the feedpost content ////////////////////////
    // Add like button animation
    let icon = div.querySelector(".like-btn");
    icon.addEventListener("click", function () {
      icon.classList.toggle("active");
    });

    // Update the feedpost content
    // Update profile image
    div.querySelector(
      ".profile-img"
    ).src = `../../static/img/profileLetters/${currFeedPost.username[0]}.png`;

    // Update username
    div.querySelector(".username").textContent = currFeedPost.username;

    // Update timestamp
    div.querySelector(".timestamp").textContent = currFeedPost.timestamp;

    // Update order quantity
    if (currFeedPost.transaction_type === "buy") {
      div.querySelector(".order-quantity").textContent =
        "+" + currFeedPost.quantity.toFixed(4);
      div.querySelector(".order-quantity").style.color = "#17c671";
    } else {
      div.querySelector(".order-quantity").textContent =
        "-" + currFeedPost.quantity.toFixed(4);
      div.querySelector(".order-quantity").style.color = "#EB5757";
    }

    // Update coin name
    div.querySelector(".coin-id").textContent = toTitleCase(
      currFeedPost.coin_id
    );

    // Update transaction type (buy or sell)
    if (currFeedPost.transaction_type === "buy") {
      div.querySelector(".transaction-type").textContent = "Buy";
    } else if (currFeedPost.transaction_type === "sell") {
      div.querySelector(".transaction-type").textContent = "Sell";
    }

    // Update transaction price
    div.querySelector(".order-price").textContent =
      "$" + currFeedPost.price_per_unit.toLocaleString();

    // Update transaction comment
    if (currFeedPost.comment) {
      div.querySelector(".feedpost-comment p").textContent =
        currFeedPost.comment;
      div.querySelector(".feedpost-comment p").style.fontSize = "2.6rem";
      div.querySelector(".feedpost-comment p").style.color = "#000000";
    } else {
      div.querySelector(".feedpost-comment p").textContent =
        "This trade has no description";
    }

    // Update like button state
    if (currFeedPost.curr_user_liked) {
      div.querySelector(".like-btn").classList.add("active");
    }

    // Update likes count
    div.querySelector(".likes-count").textContent = currFeedPost.likes;

    // //////////////////// Add like button event listeners ////////////////////
    // TODO Add like button event listener
    div.querySelector(".like-btn").addEventListener("click", async function () {
      console.log(`Like button clicked for ${currFeedPost.timestamp}`);
      if (this.classList.contains("active")) {
        const response = (await updateLikeCounter(true, currFeedPost.id))[0];

        if (response.success) {
          div.querySelector(".likes-count").textContent = response.currLikes;
        } else {
          // TODO show error message popup
        }
      } else {
        const response = (await updateLikeCounter(false, currFeedPost.id))[0];

        if (response.success) {
          div.querySelector(".likes-count").textContent = response.currLikes;
        } else {
          // TODO show error message popup
        }
      }
    });
  }
}

/**
 * Updates the like counter for a specific transaction by either incrementing or
 * decrementing it.
 *
 * @async
 * @function updateLikeCounter
 * @param {boolean} isIncrement - Indicates whether to add a like (true) or remove a
 *                                like (false) from the transaction like counter.
 * @param {string} transactionID - The ID of the transaction whose like counter needs
 *                                 to be updated.
 * @returns {Promise<Object>} - A promise that resolves to the response data from the
 *                              server.
 *
 * The function sends a POST request to the "/update_likes" endpoint with the
 * `isIncrement` flag and `transactionID` in the request body. The server is expected
 * to return a JSON object which is then returned by this function.
 *
 * Error handling for unsuccessful responses is currently not implemented. TODO
 */
async function updateLikeCounter(isIncrement, transactionID) {
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      isIncrement: isIncrement,
      transactionID: transactionID,
    }),
  };

  const response = await fetch("/update_likes", fetchOptions);
  const data = await response.json();

  // TODO add error handling for if /update_likes doesn't return a success
  return data;
}

/**
 * Handles the intersection of observed elements and triggers fetching and rendering of
 * new feed posts when the user reaches the end of the page/feed.
 *
 * @function handleIntersect
 * @param {IntersectionObserverEntry[]} entries - An array of IntersectionObserverEntry
 *                                                objects representing the observed
 *                                                elements
 *
 * This function is called when the user has scrolled to the end of the page. When this
 * happens, the function checks the current feed type ("global" or "own"), increments
 * the respective page count, fetches the next page of feed posts of that type, and
 * renders them.
 */
function handleIntersect(entries) {
  entries.forEach(async (entry) => {
    if (entry.isIntersecting) {
      if (currFeed == "global") {
        globalPageCount++;
        await fetchFeedPosts("global", globalPageCount);
        renderFeedPosts("global");
      } else if (currFeed == "own") {
        ownPageCount++;
        await fetchFeedPosts("own", ownPageCount);
        renderFeedPosts("own");
      }
    }
  });
}

/**
 * Sets up an IntersectionObserver to detect when the user has scrolled to the bottom
 * of the page/feed and triggers fetching and rendering more feed posts.
 *
 * @function setupObserver
 *
 * This function creates a new IntersectionObserver that monitors the visibility of an
 * element (in this case, the element with the ID "page-end"). When half of the target
 * element is visible in the viewport (as defined by the threshold of 0.5), the
 * `handleIntersect` function is called to fetch and render additional feed posts.
 *
 * - `root`: Set to `null` to use the viewport as the observing area.
 * - `rootMargin`: No margin (set to "0px").
 * - `threshold`: Triggers the observer when 50% of the target is visible.
 */
function setupObserver() {
  let observer = new IntersectionObserver(handleIntersect, {
    root: null, // observing in viewport
    rootMargin: "0px",
    threshold: 0.5, // trigger when half of the target is visible
  });

  let target = document.getElementById("page-end");
  observer.observe(target);
}

/**
 * Adds event listeners to the "Global feed" and "Own feed" buttons for switching
 * between what feed type is currently visible.
 *
 * @function addFeedMenuButtonEventListeners
 *
 * This function attaches click event listeners to the "Global feed" and "Own feed" #
 * menu buttons. When the user clicks on one of the buttons:
 * - The corresponding feed posts container is displayed.
 * - The other feed posts container is hidden.
 * - The `currFeed` variable is updated to reflect the current feed type ("global" or
 *   "own").
 */
function addFeedMenuButtonEventListeners() {
  const globalFeedBtn = document.querySelector(".feed-header__global-label");
  const ownFeedBtn = document.querySelector(".feed-header__own-label");
  const globalFeedContainer = document.querySelector(
    ".global-feedposts-container"
  );
  const ownFeedContainer = document.querySelector(".own-feedposts-container");

  globalFeedBtn.addEventListener("click", function () {
    // Hide both feedposts sections
    globalFeedContainer.style.display = "flex";
    ownFeedContainer.style.display = "none";

    currFeed = "global";
  });

  ownFeedBtn.addEventListener("click", function () {
    ownFeedContainer.style.display = "flex";
    globalFeedContainer.style.display = "none";

    currFeed = "own";
  });
}

async function getWalletAssets() {
  const fetchOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch("/get_wallet_assets", fetchOptions);

  if (!response.ok) {
    // Handle HTTP errors
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();

  if (data.success) {
    // TODO what to actually return? perhaps only return data.assets and data.balance
    return data;
  }
}

async function getCoinDataFromAPI(coin_ids) {
  // TODO do 250 at a time
  const api_coin_ids = coin_ids.join(",");

  const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
  const params = {
    vs_currency: "usd",
    ids: api_coin_ids,
  };
  Object.keys(params).forEach((key) =>
    url.searchParams.append(key, params[key])
  );

  try {
    const response = await fetch(url, COINGECKO_API_OPTIONS);
    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error:", error);
    return []; // Return an empty array in case of error
  }
}

function getWalletAssetsDataForDisplay(coin_info, coin_quantities) {
  const res = {};

  for (const coin of coin_info) {
    res[coin.id] = {
      name: coin.name,
      img: coin.image,
      quantity: coin_quantities[coin.id],
    };
  }

  return res;
}

async function renderWalletAssets(assets, balance) {
  // Update USD balance in portfolio-overview-card
  document.querySelector(".portfolio-overview-card .amount-data").textContent =
    "$" + formatFloatToUSD(balance, 2);

  // Add in a new table row for every coin in the wallet
  const markup = `
    <td class="holdings-data">
      <img src="../../static/img/dollar_symbol.svg" />
      <p>Play USD</p>
    </td>
    <td class="amount-data">$95,514.63</td>
    `;

  for (const coin in assets) {
    const newTableRow = document.createElement("tr");
    newTableRow.innerHTML = markup;

    // Update coin image
    newTableRow.querySelector(".holdings-data img").src = assets[coin].img;

    // Update coin name
    newTableRow.querySelector(".holdings-data p").textContent =
      assets[coin].name;

    // Update coin quantity
    newTableRow.querySelector(".amount-data").textContent = formatFloatToUSD(
      assets[coin].quantity,
      4
    );

    document
      .querySelector(".portfolio-overview-card__table")
      .appendChild(newTableRow);
  }
}

async function updatePortfolioOverviewCard() {
  // let temp = Object.keys((await getWalletAssets()).assets);
  const data = await getWalletAssets();
  const balance = data["balance"];
  const assets = data["assets"];

  const ownedCoinsList = Object.keys(assets);
  const ownedCoinsData = await getCoinDataFromAPI(ownedCoinsList);
  const ownedCoinsNecessaryData = getWalletAssetsDataForDisplay(
    ownedCoinsData,
    assets
  );

  renderWalletAssets(ownedCoinsNecessaryData, balance);
}

async function getTrendingCoinsData() {
  // TODO add error handling
  const url = new URL("https://api.coingecko.com/api/v3/search/trending");

  const response = await fetch(url, COINGECKO_API_OPTIONS);
  const data = (await response.json()).coins;

  const res = data.map((coin) => coin.item);
  return res;
}

async function renderTrendingCoins(coinsData) {
  const markup = `
    <div class="trending-coins-card__header">
      <img
        class="img--first"
        src=""
        draggable="false"
        loading="lazy"
      />
      <img
        class="img--second"
        src="../../static/img/dollar_symbol.svg"
        draggable="false"
        loading="lazy"
      />
      <p class="coin-name"></p>
      <p class="coin-symbol"></p>
    </div>

    <div class="trending-coins-card__main">
      <p class="coin-price-change"></p>
      <img
        class="img--third"
        src=""
        draggable="false"
        loading="lazy"
      />
      <img
        class="img--fourth"
        src="../../static/img/dollar_symbol.svg"
        draggable="false"
        loading="lazy"
      />
    </div>

    <div class="trending-coins-card__footer">
      <p class="coin-price"></p>
    </div>
  `;

  for (const coin of coinsData) {
    const newCard = document.createElement("div");
    newCard.classList.add("trending-coins-card");
    newCard.innerHTML = markup;

    // Update card content
    // Update coin images
    newCard.querySelector(".trending-coins-card__header .img--first").src =
      coin.large;
    newCard.querySelector(".trending-coins-card__main .img--third").src =
      coin.large;

    // Update coin name and symbol
    newCard.querySelector(
      ".trending-coins-card__header .coin-name"
    ).textContent = coin.name;
    newCard.querySelector(
      ".trending-coins-card__header .coin-symbol"
    ).textContent = `(${coin.symbol})`;

    // Update coin price change and colour
    newCard.querySelector(
      ".trending-coins-card__main .coin-price-change"
    ).textContent = coin.data.price_change_percentage_24h.usd.toFixed(2) + "%";

    if (coin.data.price_change_percentage_24h.usd >= 0) {
      newCard.querySelector(
        ".trending-coins-card__main .coin-price-change"
      ).style.color = "#17c671";
    } else {
      newCard.querySelector(
        ".trending-coins-card__main .coin-price-change"
      ).style.color = "#EB5757";
    }

    // Update coin price
    newCard.querySelector(
      ".trending-coins-card__footer .coin-price"
    ).textContent = "$" + formatFloatToUSD(coin.data.price, 4);

    document.querySelector(".trending-coins-cards").appendChild(newCard);

    // Add event listener to each card
    newCard.addEventListener("click", async function () {
      await showNewTradeSidebarForSpecificCoin(coin.id);
    });
  }
}

async function getAndRenderTrendingCoins() {
  const trendingCoinsData = await getTrendingCoinsData();
  renderTrendingCoins(trendingCoinsData);
}

function addTrendingCoinsDraggableEventListener() {
  const slider = document.querySelector(".trending-coins-cards");
  let isDown = false;
  let startX;
  let scrollLeft;
  let lastMoveTime = 0;
  let lastMoveX = 0;
  let velocity = 0;
  let animationFrameId;

  // Parameters for inertia
  const friction = 0.95; // Deceleration factor
  const minVelocity = 0.5; // Minimum velocity before stopping

  slider.addEventListener("mousedown", (e) => {
    isDown = true;
    slider.classList.add("active");
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
    velocity = 0; // Reset velocity
    cancelMomentumScrolling(); // Stop any ongoing momentum
    lastMoveTime = Date.now();
    lastMoveX = e.pageX;
  });

  slider.addEventListener("mouseleave", () => {
    if (isDown) {
      isDown = false;
      slider.classList.remove("active");
      beginMomentumScrolling();
    }
  });

  slider.addEventListener("mouseup", () => {
    if (isDown) {
      isDown = false;
      slider.classList.remove("active");
      beginMomentumScrolling();
    }
  });

  slider.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1; // Adjust scroll speed by changing the multiplier
    slider.scrollLeft = scrollLeft - walk;

    const now = Date.now();
    const deltaTime = now - lastMoveTime;
    if (deltaTime > 0) {
      velocity = (e.pageX - lastMoveX) / deltaTime;
      lastMoveTime = now;
      lastMoveX = e.pageX;
    }
  });

  // Touch Events for Mobile
  slider.addEventListener("touchstart", (e) => {
    isDown = true;
    slider.classList.add("active");
    startX = e.touches[0].pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
    velocity = 0; // Reset velocity
    cancelMomentumScrolling(); // Stop any ongoing momentum
    lastMoveTime = Date.now();
    lastMoveX = e.touches[0].pageX;
  });

  slider.addEventListener("touchend", () => {
    if (isDown) {
      isDown = false;
      slider.classList.remove("active");
      beginMomentumScrolling();
    }
  });

  slider.addEventListener("touchmove", (e) => {
    if (!isDown) return;
    const x = e.touches[0].pageX - slider.offsetLeft;
    const walk = (x - startX) * 1;
    slider.scrollLeft = scrollLeft - walk;

    const now = Date.now();
    const deltaTime = now - lastMoveTime;
    if (deltaTime > 0) {
      velocity = (e.touches[0].pageX - lastMoveX) / deltaTime;
      lastMoveTime = now;
      lastMoveX = e.touches[0].pageX;
    }
  });

  // Function to begin momentum scrolling
  function beginMomentumScrolling() {
    // Multiply velocity by a factor to increase scrolling speed
    velocity *= 1000; // Convert to pixels per second

    const momentum = () => {
      slider.scrollLeft -= velocity * 0.016; // Assuming ~60fps, so 16ms per frame

      // Apply friction
      velocity *= friction;

      // Stop if velocity is below threshold
      if (Math.abs(velocity) > minVelocity) {
        animationFrameId = requestAnimationFrame(momentum);
      } else {
        cancelMomentumScrolling();
      }
    };

    momentum();
  }

  // Function to cancel ongoing momentum scrolling
  function cancelMomentumScrolling() {
    cancelAnimationFrame(animationFrameId);
  }
}

function addOverviewOpenButtonsEventListeners() {
  const overviewBtn = document.querySelector(
    ".positions-header__overview-label"
  );
  const openPositionsBtn = document.querySelector(
    ".positions-header__open-positions-label"
  );

  const overviewCard = document.querySelector(".portfolio-overview-card");
  const openPositionsCard = document.querySelector(".open-positions-card");

  // Open Positions card should not initially be visible
  openPositionsCard.style.display = "none";

  overviewBtn.addEventListener("click", function () {
    overviewCard.style.display = "flex";
    openPositionsCard.style.display = "none";
  });

  openPositionsBtn.addEventListener("click", function () {
    overviewCard.style.display = "none";
    openPositionsCard.style.display = "block";
  });
}

async function getOpenTradesData() {
  const fetchOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch("/get_open_trades", fetchOptions);

  if (!response.ok) {
    // Handle HTTP errors
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();

  if (data.success) {
    // TODO what to actually return? perhaps only return data.assets and data.balance
    return data.data;
  }
}

function splitOpenTradesData(data) {
  const res = {
    limitBuy: [],
    limitSell: [],
    stopBuy: [],
    stopSell: [],
  };

  for (const trade of data) {
    if (trade.order_type === "limit" && trade.transaction_type === "buy") {
      res.limitBuy.push(trade);
    } else if (
      trade.order_type === "limit" &&
      trade.transaction_type === "sell"
    ) {
      res.limitSell.push(trade);
    } else if (
      trade.order_type === "stop" &&
      trade.transaction_type === "buy"
    ) {
      res.stopBuy.push(trade);
    } else if (
      trade.order_type === "stop" &&
      trade.transaction_type === "sell"
    ) {
      res.stopSell.push(trade);
    }
  }

  return res;
}

function getUniqueCoins(trades) {
  const uniqueCoins = new Set();

  for (const tradeType in trades) {
    for (const trade of trades[tradeType]) {
      uniqueCoins.add(trade.coin_id);
    }
  }
  return Array.from(uniqueCoins);
}

function getOpenTradesMarkup() {
  return `
  <div class="first">
    <div class="order-price-info">
      <img
        src="https://cryptoparrot.com/assets/images/crypto-icons/color/eth.svg"
      />
      <p>1.000</p>
      <p>at</p>
      <img
        src="https://cryptoparrot.com/assets/images/crypto-icons/color/usd.svg"
      />
      <p>1000</p>
    </div>

    <div class="current-price-info">
      <p>Current Price: $2331.2</p>
      <p>|</p>
      <p>Spread: $1331.2</p>
    </div>
  </div>
  <div class="second">
    <img
      src="https://raw.githubusercontent.com/ant-design/ant-design-icons/91b720521ac8969aebcd6ddc484624915d76010c/packages/icons-svg/svg/outlined/close-circle.svg"
    />
    <p>Cancel</p>
  </div>
`;
}

function renderOpenTrades(trades, coinData) {
  const markup = getOpenTradesMarkup();

  for (const orderType in trades) {
    if (trades[orderType].length == 0) {
      const noTradesDiv = document.createElement("div");
      noTradesDiv.classList.add("no-open-trades-to-show");
      noTradesDiv.textContent = "You currently have no trade of this type";

      // Append to correct div
      if (orderType === "limitBuy") {
        document
          .querySelector(".limit-buy-orders-container")
          .appendChild(noTradesDiv);
      } else if (orderType === "limitSell") {
        document
          .querySelector(".limit-sell-orders-container")
          .appendChild(noTradesDiv);
      } else if (orderType === "stopBuy") {
        document
          .querySelector(".stop-buy-orders-container")
          .appendChild(noTradesDiv);
      } else if (orderType === "stopSell") {
        document
          .querySelector(".stop-sell-orders-container")
          .appendChild(noTradesDiv);
      }
    }

    for (const trade of trades[orderType]) {
      const tradeInfoDiv = document.createElement("div");
      tradeInfoDiv.classList.add("open-order-container");
      tradeInfoDiv.innerHTML = markup;

      // Update order content
      // Update coin image
      tradeInfoDiv.querySelector(".order-price-info img:first-of-type").src =
        coinData[trade.coin_id].img;

      // Update coin quantity
      tradeInfoDiv.querySelector(
        ".order-price-info p:first-of-type"
      ).textContent = formatFloatToUSD(trade.quantity, 4);

      // Update coin desired price
      tradeInfoDiv.querySelector(
        ".order-price-info p:last-of-type"
      ).textContent = formatFloatToUSD(trade.price_per_unit, 2);

      // Update coin current price
      tradeInfoDiv.querySelector(
        ".current-price-info p:first-of-type"
      ).textContent =
        "Current Price: $" +
        formatFloatToUSD(coinData[trade.coin_id].current_price, 2);

      // Update spread
      tradeInfoDiv.querySelector(
        ".current-price-info p:last-of-type"
      ).textContent =
        "Spread: $" +
        formatFloatToUSD(
          Math.abs(
            coinData[trade.coin_id].current_price - trade.price_per_unit
          ),
          2
        );

      // Add cancel trade event listener
      tradeInfoDiv
        .querySelector(".open-order-container .second")
        .addEventListener("click", async function () {
          const success = await requestOpenTradeCancellation(
            trade.id,
            coinData[trade.coin_id].current_price
          );

          if (success) {
            tradeInfoDiv.querySelector(".second").innerHTML = "Cancelled";
          } else {
            // TODO error handling
          }
        });

      // Append to correct div
      if (orderType === "limitBuy") {
        document
          .querySelector(".limit-buy-orders-container")
          .appendChild(tradeInfoDiv);
      } else if (orderType === "limitSell") {
        document
          .querySelector(".limit-sell-orders-container")
          .appendChild(tradeInfoDiv);
      } else if (orderType === "stopBuy") {
        document
          .querySelector(".stop-buy-orders-container")
          .appendChild(tradeInfoDiv);
      } else if (orderType === "stopSell") {
        document
          .querySelector(".stop-sell-orders-container")
          .appendChild(tradeInfoDiv);
      }
    }
  }
}

async function requestOpenTradeCancellation(
  transaction_id,
  coin_current_price
) {
  // TODO add error handling
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transaction_id: transaction_id,
      coin_current_price: coin_current_price,
    }),
  };

  const response = await fetch("/cancel_open_trade", fetchOptions);
  const data = await response.json();

  if (data.success) {
    return true;
  } else if (data.error) {
    return false;
  }
}

async function getAndRenderOpenTradesData() {
  let openTradesData = await getOpenTradesData();
  openTradesData = splitOpenTradesData(openTradesData);
  const uniqueCoins = getUniqueCoins(openTradesData);
  let coinData = await getCoinDataFromAPI(uniqueCoins);

  const res = {};
  for (const coin of coinData) {
    res[coin.id] = {
      name: coin.name,
      img: coin.image,
      current_price: coin.current_price,
    };
  }

  renderOpenTrades(openTradesData, res);
}

async function main() {
  addMessagePopupCloseEventListener();
  addOverviewOpenButtonsEventListeners();
  await fetchFeedPosts("global", 1);

  renderFeedPosts("global");
  setupObserver();

  addFeedMenuButtonEventListeners();

  await updatePortfolioOverviewCard();
  await getAndRenderTrendingCoins();

  addTrendingCoinsDraggableEventListener();

  await getAndRenderOpenTradesData();
}

main();
