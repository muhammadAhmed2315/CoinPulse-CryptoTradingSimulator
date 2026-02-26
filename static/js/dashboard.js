import { toTitleCase, formatFloatToUSD, addMessagePopupCloseEventListener, showMessagePopup, } from "../js/helpers.js";
import { showNewTradeSidebarForSpecificCoin } from "../js/new-trade.js";
let globalFeedPosts = [];
let ownFeedPosts = [];
let globalPageCount = 1;
let ownPageCount = 0;
let currFeed = "global";
// ************************************************************
// ******************** FEEDPOST FUNCTIONS ********************
// ************************************************************
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
            }
            else {
                // If there are no feedposts to show
                globalFeedPosts = [];
            }
        }
    }
    else if (type == "own") {
        // If successful response
        if (data.success) {
            // If there are feedposts to show
            if (data.data) {
                ownFeedPosts = data.data;
            }
            else {
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
    }
    else if (type == "own") {
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
        }
        else if (type == "own") {
            document.querySelector(".own-feedposts-container").appendChild(div);
        }
        // //////////////////// Update the feedpost content ////////////////////////
        // Add like button animation
        let icon = div.querySelector(".like-btn");
        if (icon) {
            icon.addEventListener("click", function () {
                icon.classList.toggle("active");
            });
        }
        // Update the feedpost content
        // Update profile image
        div.querySelector(".profile-img").src =
            `../../static/img/profileLetters/${currFeedPost.username[0].toUpperCase()}.png`;
        // Update username
        div.querySelector(".username").textContent = currFeedPost.username;
        // Update timestamp
        div.querySelector(".timestamp").textContent = String(currFeedPost.timestamp);
        // Update order quantity
        if (currFeedPost.transaction_type === "buy") {
            div.querySelector(".order-quantity").textContent =
                "+" + currFeedPost.quantity.toFixed(4);
            div.querySelector(".order-quantity").style.color =
                "#17c671";
        }
        else {
            div.querySelector(".order-quantity").textContent =
                "-" + currFeedPost.quantity.toFixed(4);
            div.querySelector(".order-quantity").style.color =
                "#EB5757";
        }
        // Update coin name
        div.querySelector(".coin-id").textContent = toTitleCase(currFeedPost.coin_id);
        // Update transaction type (buy or sell)
        if (currFeedPost.transaction_type === "buy") {
            div.querySelector(".transaction-type").textContent = "Buy";
        }
        else if (currFeedPost.transaction_type === "sell") {
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
            div.querySelector(".feedpost-comment p").style.color =
                "#000000";
        }
        else {
            div.querySelector(".feedpost-comment p").textContent =
                "This trade has no description";
        }
        // Update like button state
        if (currFeedPost.curr_user_liked) {
            div.querySelector(".like-btn").classList.add("active");
        }
        // Update likes count
        div.querySelector(".likes-count").textContent = String(currFeedPost.likes);
        // //////////////////// Add like button event listeners ////////////////////
        div
            .querySelector(".like-btn")
            .addEventListener("click", async function () {
            if (this.classList.contains("active")) {
                // If user has already liked the post
                const response = (await updateLikeCounter(true, currFeedPost.id))[0];
                if (response.success) {
                    div.querySelector(".likes-count").textContent = String(response.currLikes);
                }
                else {
                    showMessagePopup("Like count could not be updated", false);
                }
            }
            else {
                // If user has not liked the post
                const response = (await updateLikeCounter(false, currFeedPost.id))[0];
                if (response.success) {
                    div.querySelector(".likes-count").textContent = String(response.currLikes);
                }
                else {
                    showMessagePopup("Like count could not be updated", false);
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
            }
            else if (currFeed == "own") {
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
// ******************************************************************
// ******************** TRENDING COINS FUNCTIONS ********************
// ******************************************************************
/**
 * Fetches trending coin data (for 15 coins) from the CoinGecko API.
 *
 * This function makes an asynchronous request to the CoinGecko API to retrieve
 * data about trending coins. It processes the response to return an array of
 * coin objects, each representing a trending cryptocurrency.
 *
 * @async
 * @function getTrendingCoinsData
 * @returns {Promise<Object[]>} A promise that resolves to an array of coin items,
 *                              each representing a trending cryptocurrency.
 * @throws {Error} Throws an error if the API call fails or if the response is invalid.
 */
async function getTrendingCoinsData() {
    const fetchOptions = {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    };
    try {
        const response = await fetch("/get_trending_coins_data", fetchOptions);
        const temp = await response.json();
        const data = temp.coins;
        const res = data.map((coin) => coin.item);
        return res;
    }
    catch (error) {
        console.error(error);
    }
}
/**
 * Renders trending coin cards to the DOM.
 *
 * This function takes an array of trending coin data and generates HTML elements
 * to display each coin's information, including images, name, symbol, price change,
 * and price. The function also adds a click event listener to each card, which
 * results in the "New Trade" sidebar being opened and showing information about the
 * coin that was clicked.
 *
 * @async
 * @function renderTrendingCoins
 * @param {Object[]} coinsData - Array of coin data objects, each containing details
 *                               about a trending cryptocurrency.
 * @returns {Promise<void>} A promise that resolves when all the coin cards are rendered.
 */
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
      <p class="coin-name" title=""></p>
      <p class="coin-symbol" title=""></p>
    </div>

    <div class="trending-coins-card__main">
      <p class="coin-price-change"></p>
      <img
        class="img--third"
        src=""
        draggable="false"
        loading="lazy"
      />
    </div>

    <div class="trending-coins-card__footer">
      <p class="coin-price"></p>
    </div>
  `;
    for (const coin of coinsData) {
        // Create a div (card) for each coin
        const newCard = document.createElement("div");
        newCard.classList.add("trending-coins-card");
        newCard.innerHTML = markup;
        // Update card content
        // Update coin images
        newCard.querySelector(".trending-coins-card__header .img--first").src = coin.large;
        newCard.querySelector(".trending-coins-card__main .img--third").src = coin.large;
        // Update coin name
        newCard.querySelector(".trending-coins-card__header .coin-name").textContent = coin.name;
        newCard
            .querySelector(".trending-coins-card__header .coin-name")
            .setAttribute("title", coin.name + ` (${coin.symbol})`);
        // Update coin symbol
        newCard.querySelector(".trending-coins-card__header .coin-symbol").textContent = `(${coin.symbol})`;
        newCard
            .querySelector(".trending-coins-card__header .coin-symbol")
            .setAttribute("title", coin.name + ` (${coin.symbol})`);
        // Update coin price change and colour
        newCard.querySelector(".trending-coins-card__main .coin-price-change").textContent = coin.data.price_change_percentage_24h.usd.toFixed(2) + "%";
        if (coin.data.price_change_percentage_24h.usd >= 0) {
            newCard.querySelector(".trending-coins-card__main .coin-price-change").style.color = "#17c671";
        }
        else {
            newCard.querySelector(".trending-coins-card__main .coin-price-change").style.color = "#EB5757";
        }
        // Update coin price
        newCard.querySelector(".trending-coins-card__footer .coin-price").textContent = "$" + formatFloatToUSD(coin.data.price, 4);
        document.querySelector(".trending-coins-cards").appendChild(newCard);
        // Add event listener to each card
        newCard.addEventListener("click", async function () {
            await showNewTradeSidebarForSpecificCoin(coin.id);
        });
    }
}
/**
 * Fetches data about the top 15 trending coins from the CoinGecko API, and then
 * renders a card for each coin. The card displays information about each coin.
 *
 * This function first retrieves trending cryptocurrency data from the CoinGecko API
 * by calling `getTrendingCoinsData()`, then passes the data to `renderTrendingCoins()`
 * to generate and display the coin cards on the webpage.
 *
 * @async
 * @function getAndRenderTrendingCoins
 * @returns {Promise<void>} A promise that resolves when the coin data is fetched
 *                          and rendered to the DOM.
 */
async function getAndRenderTrendingCoins() {
    const trendingCoinsData = await getTrendingCoinsData();
    renderTrendingCoins(trendingCoinsData);
}
// *******************************************************************
// ******************** WALLET OVERVIEW FUNCTIONS ********************
// *******************************************************************
/**
 * Fetches the wallet assets dictionary from the Flask server.
 *
 * Makes a GET request to the '/get_wallet_assets' endpoint, expecting a response
 * containing the wallet's assets and balance in JSON format.
 *
 * @async
 * @function getWalletAssets
 * @returns {Promise<Object>} - A promise that resolves to an object containing the
 *                              wallet assets and balance.
 * @throws {Error} - If the fetch request fails or if the response status is not OK
 *                   (HTTP status code other than 200).
 */
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
        return data;
    }
}
/**
 * Formats and combines coin information with coin quantities for display purposes.
 *
 * This function takes an array of coin information objects and an object containing
 * the quantities of each coin, then returns a new object where each coin's ID serves
 * as the key. The object contains the coin's name, image, and the corresponding
 * quantity owned by the user.
 *
 * @function formatWalletAssetsData
 * @param {Array<Object>} coin_info - An array of objects representing coin data. This
 *                                    is data that has been returned from the CoinGecko
 *                                    API.
 * @param {Object} coin_quantities - An object where the keys are coin IDs and the
 *                                   values are the quantities of those coins owned by
 *                                   the user.
 * @returns {Object} - An object where the keys are the coin IDs and the values are
 *                     objects containing:
 *                     - {string} name: The name of the coin.
 *                     - {string} img: The URL of the coin's image.
 *                     - {number} quantity: The quantity of the coin.
 */
function formatWalletAssetsData(coin_info, coin_quantities) {
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
/**
 * Renders wallet balance and quantity of each coin the user owns to the "Portfolio
 * Overview" section
 *
 * This function updates the user's wallet balance in USD and dynamically creates table
 * rows for each coin that the user owns, displaying the coin's image, name, and
 * quantity in a table.
 *
 * @async
 * @function renderWalletAssets
 * @param {Object} assets - An object containing wallet assets, where the keys are coin
 *                          IDs and the values are:
 *                          - {string} name: The name of the coin.
 *                          - {string} img: A URL to the image of the coin.
 *                          - {number} quantity: The quantity of the coin.
 * @param {number} balance - The user's total wallet balance in USD.
 */
function renderWalletAssets(assets, balance) {
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
        const { img, name, quantity } = assets[coin];
        const newTableRow = document.createElement("tr");
        newTableRow.innerHTML = markup;
        // Update coin image
        newTableRow.querySelector(".holdings-data img").src =
            img;
        // Update coin name
        newTableRow.querySelector(".holdings-data p").textContent = name;
        // Update coin quantity
        newTableRow.querySelector(".amount-data").textContent = formatFloatToUSD(quantity, 4);
        document
            .querySelector(".portfolio-overview-card__table")
            .appendChild(newTableRow);
    }
}
/**
 * Updates the "Portfolio Overview" card with the user's wallet balance and the coin
 * each users owns (as well as its corresponding quantity)
 *
 * This function fetches the wallet assets and balance, retrieves additional coin data
 * from an API, combines the two data sets into a single dataset, and then renders the
 * wallet assets in the "Portfolio Overview" card using that dataset.
 *
 * @async
 * @function getAndRenderWalletAssetsData
 * @returns {Promise<void>} - A promise that resolves when the portfolio overview card
 *                            has been updated.
 */
async function getAndRenderWalletAssetsData() {
    const data = await getWalletAssets();
    const balance = data["balance"];
    const assets = data["assets"];
    const ownedCoinsList = Object.keys(assets);
    const ownedCoinsData = await getCoinDataFromAPI(ownedCoinsList);
    const ownedCoinsNecessaryData = formatWalletAssetsData(ownedCoinsData, assets);
    renderWalletAssets(ownedCoinsNecessaryData, balance);
}
// ***************************************************************
// ******************** OPEN TRADES FUNCTIONS ********************
// ***************************************************************
/**
 * Fetches information about all open/active trades that the current user has.
 *
 * This asynchronous function sends a GET request to the `/get_open_trades` endpoint
 * and retrieves data related to the user's open trades. It expects a JSON response
 * and will throw an error if the request is not successful.
 *
 * @async
 * @function getOpenTradesData
 * @throws {Error} - If the HTTP request fails or the response is not successful.
 * @returns {Promise<Object>}-  A promise that resolves with the open trades data.
 *                            The exact structure of the returned data is TBD,
 *                            but it may include `data.assets` and `data.balance`.
 */
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
    if (data.success)
        return data.data;
    return;
}
/**
 * Splits the open trades data into separate lists based on order and transaction types.
 *
 * This function processes an array of trade data and organizes it into separate arrays
 * for limit buy, limit sell, stop buy, and stop sell orders. It returns an object
 * containing these categorized trades.
 *
 * @function splitOpenTradesData
 * @param {Array<Object>} data - An array of trade objects to be categorized.
 *                               Each object should contain `order_type` and `transaction_type`.
 * @returns {Object} An object containing four arrays:
 *                   - `limitBuy`: Trades with order type 'limit' and transaction type 'buy'
 *                   - `limitSell`: Trades with order type 'limit' and transaction type 'sell'
 *                   - `stopBuy`: Trades with order type 'stop' and transaction type 'buy'
 *                   - `stopSell`: Trades with order type 'stop' and transaction type 'sell'
 */
function formatOpenTradesData(data) {
    const res = {
        limitBuy: [],
        limitSell: [],
        stopBuy: [],
        stopSell: [],
    };
    for (const trade of data) {
        if (trade.order_type === "limit" && trade.transaction_type === "buy") {
            res.limitBuy.push(trade);
        }
        else if (trade.order_type === "limit" &&
            trade.transaction_type === "sell") {
            res.limitSell.push(trade);
        }
        else if (trade.order_type === "stop" &&
            trade.transaction_type === "buy") {
            res.stopBuy.push(trade);
        }
        else if (trade.order_type === "stop" &&
            trade.transaction_type === "sell") {
            res.stopSell.push(trade);
        }
    }
    return res;
}
/**
 * Returns a list of unique coin IDs from the provided trades data.
 *
 * This function iterates over the categorized trades and collects unique coin IDs
 * from all trade types. The result is returned as an array of unique coin IDs.
 *
 * @function getUniqueCoins
 * @param {Object} trades - An object containing categorized trades,
 *                          where each key is a trade type and each value is an array of trades.
 *                          Each trade object should contain a `coin_id` property.
 * @returns {Array<string>} An array of unique coin IDs found in the trades data.
 */
function getUniqueCoins(trades) {
    const uniqueCoins = new Set();
    for (const tradeType in trades) {
        for (const trade of trades[tradeType]) {
            uniqueCoins.add(trade.coin_id);
        }
    }
    return Array.from(uniqueCoins);
}
/**
 * Generates the HTML markup for each open trade info section in the "Open Positions"
 * section.
 *
 * This function returns a string of HTML that represents the structure of the open trades,
 * including details like the order price, current price, spread, and a cancel button.
 * It includes placeholder values for icons, prices, and coin amounts, which should be dynamically replaced.
 *
 * @function getOpenTradesMarkup
 * @returns {string} A string containing the HTML markup for open trades display.
 */
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
/**
 * Renders the open trades on the page based on the provided trade data and coin data.
 *
 * This function iterates over the four transactionType categories. If there are no
 * open trades for that transactionType category, a message is rendered on the DOM to
 * reflect this. Else, information about each trade of that category is rendered onto
 * the DOM. An event listener is also added next to each trade, which allows the user
 * to cancel an open trade by calling the `requestOpenTradeCancellation` function.
 *
 * @function renderOpenTrades
 * @param {Object} trades - An object containing categorized trades, where each key is a trade
 *                          type and each value is an array of trades.
 *                          Each trade object should contain `coin_id`, `quantity`, `price_per_unit`,
 *                          and `id`.
 * @param {Object} coinData - An object containing data for each coin, keyed by `coin_id`,
 *                            including `img` (the URL of the coin's image) and `current_price`.
 */
function renderOpenTrades(trades, coinData) {
    const markup = getOpenTradesMarkup();
    for (const orderType in trades) {
        if (trades[orderType].length == 0) {
            const noTradesDiv = document.createElement("div");
            noTradesDiv.classList.add("no-open-trades-to-show");
            noTradesDiv.textContent = "You currently have no trades of this type";
            // Append to correct div
            if (orderType === "limitBuy") {
                document
                    .querySelector(".limit-buy-orders-container")
                    .appendChild(noTradesDiv);
            }
            else if (orderType === "limitSell") {
                document
                    .querySelector(".limit-sell-orders-container")
                    .appendChild(noTradesDiv);
            }
            else if (orderType === "stopBuy") {
                document
                    .querySelector(".stop-buy-orders-container")
                    .appendChild(noTradesDiv);
            }
            else if (orderType === "stopSell") {
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
            const coinInfo = coinData[trade.coin_id];
            // Update coin image
            tradeInfoDiv.querySelector(".order-price-info img:first-of-type").src = coinInfo.img;
            // Update coin quantity
            tradeInfoDiv.querySelector(".order-price-info p:first-of-type").textContent = formatFloatToUSD(trade.quantity, 4);
            // Update coin desired price
            tradeInfoDiv.querySelector(".order-price-info p:last-of-type").textContent = formatFloatToUSD(trade.price_per_unit, 2);
            // Update coin current price
            tradeInfoDiv.querySelector(".current-price-info p:first-of-type").textContent =
                "Current Price: $" +
                    formatFloatToUSD(coinInfo.current_price, 2);
            // Update spread
            tradeInfoDiv.querySelector(".current-price-info p:last-of-type").textContent =
                "Spread: $" +
                    formatFloatToUSD(Math.abs(coinInfo.current_price - trade.price_per_unit), 2);
            // Add cancel trade event listener
            tradeInfoDiv
                .querySelector(".open-order-container .second")
                .addEventListener("click", async function () {
                const success = await requestOpenTradeCancellation(trade.id);
                if (success) {
                    tradeInfoDiv.querySelector(".second").innerHTML = "Cancelled";
                }
                else {
                    showMessagePopup("Trade could not be cancelled", false);
                }
            });
            // Append to correct div
            if (orderType === "limitBuy") {
                document
                    .querySelector(".limit-buy-orders-container")
                    .appendChild(tradeInfoDiv);
            }
            else if (orderType === "limitSell") {
                document
                    .querySelector(".limit-sell-orders-container")
                    .appendChild(tradeInfoDiv);
            }
            else if (orderType === "stopBuy") {
                document
                    .querySelector(".stop-buy-orders-container")
                    .appendChild(tradeInfoDiv);
            }
            else if (orderType === "stopSell") {
                document
                    .querySelector(".stop-sell-orders-container")
                    .appendChild(tradeInfoDiv);
            }
        }
    }
}
/**
 * Sends a request to the Flask server to cancel a given open transaction.
 *
 * This asynchronous function sends a POST request to the `/cancel_open_trade` endpoint
 * with the transaction ID and the current coin price. It handles the server response
 * and returns a boolean which reflects whether the cancellation was successful or not.
 *
 * @async
 * @function requestOpenTradeCancellation
 * @param {number} transaction_id - The ID of the transaction to be cancelled.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the cancellation was successful,
 *                             or `false` if there was an error.
 */
async function requestOpenTradeCancellation(transaction_id) {
    const fetchOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            transaction_id: transaction_id,
        }),
    };
    const response = await fetch("/cancel_open_trade", fetchOptions);
    const data = await response.json();
    if (data.success)
        return true;
    else if (data.error)
        return false;
    return;
}
/**
 * Fetches, processes, and renders data about all open trades the current user has.
 *
 * This asynchronous function retrieves open trades data, formats it, and fetches the
 * relevant coin data for the trades from an external API. After preparing the
 * necessary data, it renders the open trades on the page using the `renderOpenTrades`
 * function.
 *
 * @async
 * @function getAndRenderOpenTradesData
 * @returns {Promise<void>} A promise that resolves when the open trades data is fetched, processed,
 *                          and rendered.
 */
async function getAndRenderOpenTradesData() {
    const openTradesData = await getOpenTradesData();
    if (!openTradesData)
        return;
    const formattedTrades = formatOpenTradesData(openTradesData);
    const uniqueCoins = getUniqueCoins(formattedTrades);
    const coinData = await getCoinDataFromAPI(uniqueCoins);
    const res = {};
    for (const coin of coinData) {
        res[coin.id] = {
            name: coin.name,
            img: coin.image,
            current_price: coin.current_price,
        };
    }
    renderOpenTrades(formattedTrades, res);
}
// ***************************************************************
// ******************** GENERAL UI FUNCTIONS *********************
// ***************************************************************
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
    const globalFeedContainer = document.querySelector(".global-feedposts-container");
    const ownFeedContainer = document.querySelector(".own-feedposts-container");
    // Global feed button is selected by default
    globalFeedBtn.style.color = "#000000";
    globalFeedBtn.addEventListener("click", function () {
        // Hide both feedposts sections
        globalFeedContainer.style.display = "flex";
        ownFeedContainer.style.display = "none";
        currFeed = "global";
        globalFeedBtn.style.color = "#000000";
        ownFeedBtn.style.color = "#9696bb";
    });
    ownFeedBtn.addEventListener("click", function () {
        ownFeedContainer.style.display = "flex";
        globalFeedContainer.style.display = "none";
        currFeed = "own";
        ownFeedBtn.style.color = "#000000";
        globalFeedBtn.style.color = "#9696bb";
    });
}
/**
 * Adds draggable and momentum-based scrolling functionality to the trending coins
 * container.
 *
 * This function enables mouse and touch drag scrolling on a slider element with class
 * `trending-coins-cards`. It calculates scrolling velocity and applies inertia-based
 * momentum after dragging. The scrolling speed gradually decreases due to a friction
 * factor. Mobile touch events are also handled.
 *
 * @function addTrendingCoinsDraggableEventListener
 */
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
    if (!slider)
        return;
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
        if (!isDown)
            return;
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
        if (!isDown)
            return;
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
            }
            else {
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
/**
 * Adds event listeners to toggle between the portfolio overview and open positions
 * views.
 *
 * This function handles click events for two buttons: one for displaying the portfolio
 * overview and another for displaying the open positions. It toggles the visibility of
 * the respective cards, showing either the portfolio overview or open positions based
 * on the button clicked. Also makes it so that initially, only the portfolio overview
 * card is visible.
 *
 * @function addOverviewOpenButtonsEventListeners
 */
function addOverviewOpenButtonsEventListeners() {
    const overviewBtn = document.querySelector(".positions-header__overview-label");
    const openPositionsBtn = document.querySelector(".positions-header__open-positions-label");
    const overviewCard = document.querySelector(".portfolio-overview-card");
    const openPositionsCard = document.querySelector(".open-positions-card");
    // Overview button is selected by default
    overviewBtn.style.color = "#000000";
    // Open Positions card should not initially be visible
    openPositionsCard.style.display = "none";
    overviewBtn.addEventListener("click", function () {
        overviewCard.style.display = "flex";
        openPositionsCard.style.display = "none";
        overviewBtn.style.color = "#000000";
        openPositionsBtn.style.color = "#9696bb";
    });
    openPositionsBtn.addEventListener("click", function () {
        overviewCard.style.display = "none";
        openPositionsCard.style.display = "block";
        overviewBtn.style.color = "#9696bb";
        openPositionsBtn.style.color = "#000000";
    });
}
/**
 * Fetches coin data from the CoinGecko API for a list of given coin ids.
 *
 * This asynchronous function retrieves market data for a list of coin IDs from the
 * CoinGecko API. It currently fetches data for all provided coin IDs at once, but is
 * intended to handle up to 250 coins at a time. In case of an error, it logs the error
 * and returns an empty array.
 *
 * @async
 * @function getCoinDataFromAPI
 * @param {Array<string>} coin_ids - An array of coin IDs to fetch data for.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of coin data objects,
 *                                   or an empty array if an error occurs.
 */
async function getCoinDataFromAPI(coin_ids) {
    const api_coin_ids = coin_ids.join(",");
    const fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coin_ids: api_coin_ids }),
    };
    try {
        const response = await fetch("/get_multiple_coin_data", fetchOptions);
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("Error:", error);
        return []; // Return an empty array in case of error
    }
}
// ******************************************************************
/**
 * Sets up an event listener to show the new trade sidebar for a specific coin when the
 * page loads.
 *
 * This function checks if there is a hash in the URL upon page load. If a hash is
 * present, it waits for dynamically generated content to load, then displays the new
 * trade sidebar for the specified coin. The function currently defaults to displaying
 * the sidebar for "bitcoin" but can be modified to use the hash as an identifier.
 *
 * @function showNewTradeSidebarOnLoad
 * @returns {void} No return value.
 */
function showNewTradeSidebarOnLoad() {
    document.addEventListener("DOMContentLoaded", function () {
        // Check if there's a hash in the URL
        if (window.location.hash) {
            // Wait for the dynamically generated content to load
            setTimeout(function () {
                showNewTradeSidebarForSpecificCoin("bitcoin");
            }, 500); // Adjust the delay to match your content loading time
        }
    });
}
// ********************************************************
// ******************** MAIN FUNCTION *********************
// ********************************************************
async function main() {
    // Show new trade sidebar on load (if necessary )
    showNewTradeSidebarOnLoad();
    // Fetch and render global feedposts and setup the IntersectionObserver so that more
    // feedposts are automatically loaded when the user scrolls down the page
    await fetchFeedPosts("global", 1);
    renderFeedPosts("global");
    setupObserver();
    // Fetch and render wallet assets data and trending coins
    await getAndRenderWalletAssetsData();
    await getAndRenderTrendingCoins();
    // Fetch and render open trades data
    await getAndRenderOpenTradesData();
    // Add event listeners to the trending coins container for draggable scrolling
    addTrendingCoinsDraggableEventListener();
    // Add event listeners to the feed menu buttons and the overview/open positions
    // buttons
    addFeedMenuButtonEventListeners();
    addOverviewOpenButtonsEventListeners();
    // Add event listener to enable message popup close button
    addMessagePopupCloseEventListener();
}
main();
