import { showMessagePopup, getAllCoinNamesDict, formatFloatToUSD, } from "../js/helpers.js";
import { fetchPortfolioBalance } from "../js/core-base.js";
import { getAndRenderPortfolioTotalValue } from "../js/core-base.js";
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
let visibility = true;
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
        const data = await getAllCoinNamesDict();
        if (!data)
            return;
        coinNamesDict = data;
        sessionStorage.setItem("coinNamesDict", JSON.stringify(coinNamesDict));
    }
    else {
        const cachedNames = sessionStorage.getItem("coinNamesDict");
        if (!cachedNames)
            return;
        coinNamesDict = JSON.parse(cachedNames);
    }
}
// ////////// NEW TRADE SIDEBAR SEARCH BOX //////////
/**
 * Adds event listeners to handle search bar functionality
 *
 * This function stets up three event listeners:
 * 1. An input event listener for dynamically filtering and displaying the search
 *    results below the search bar based on the input
 * 2. A click event listener for selecting a result from the dynamically generated list
 *    of coin names
 * 3. A document-wide click event listener to remove the search results when the user
 *    clicks outside the search box.
 *
 * @function addNewTradeSidebarSearchEventListeners
 * @returns {void}
 */
function addNewTradeSidebarSearchEventListeners() {
    // Event listener for when the user types something in the search bar
    document
        .querySelector(".nts-search-box input")
        .addEventListener("input", function () {
        const input = this.value.trim();
        const resultsContainer = document.querySelector(".nts-search-box__results");
        if (!input) {
            resultsContainer.style.display = "none";
            return;
        }
        const data = Object.keys(coinNamesDict);
        // Filter data based on input
        const filteredData = data.filter((item) => item.toLowerCase().includes(input.toLowerCase()));
        // Display results
        if (filteredData.length > 0) {
            resultsContainer.innerHTML = filteredData
                .map((item) => `<div class="result-item">${item}</div>`)
                .join("");
            resultsContainer.style.display = "block";
        }
        else {
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
        const targetElement = e.target;
        // Check if the clicked element is a result item
        if (targetElement.classList.contains("result-item")) {
            const selectedCoinName = targetElement.textContent;
            if (selectedCoinName && selectedCoinName !== "No results found") {
                document.querySelector(".nts-search-box__results").innerHTML = "";
                document.querySelector(".nts-search-box__input").value = selectedCoinName;
                const coinEntry = coinNamesDict[selectedCoinName];
                if (!coinEntry)
                    return;
                currentCoin.id = coinEntry[1];
                await getCurrentCoinInfo();
                await getCurrentCoinBalance();
                updateNewTradeCoinInfo();
            }
        }
        else {
            document.querySelector(".nts-search-box__input").value = "";
        }
    });
    // Event listener for removing all of the results when the user clicks elsewhere
    // on the screen
    document.addEventListener("click", function (e) {
        if (!e.target.classList.contains("nts-search-box") &&
            !e.target.classList.contains("nts-search-box__input")) {
            document.querySelector(".nts-search-box__results").innerHTML = "";
        }
    });
}
/**
 * Fetches information about the current coin from the CoinGecko API and updates the
 * "currentCoin" global variable.
 *
 * - Makes an API call to CoinGecko to get the current price, coin's image, ticker,
 *   etc. of the current coin
 * - Updates the "currentCoin" global variable with this newly fetched info
 *
 * @async
 * @function getCurrentCoinInfo
 * @returns {void}
 */
async function getCurrentCoinInfo() {
    // Make Flask endpoint call to get percentage_price_change and current price for the
    // current coin
    const fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coin_id: currentCoin.id }),
    };
    try {
        const response = await fetch("/get_single_coin_data", fetchOptions);
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
        return;
    }
    catch (error) {
        console.error("Error:", error);
        return []; // Return an empty array in case of error
    }
}
/**
 * Asynchronously retrieves the balance of a specific coin from the current user's
 * wallet.
 *
 * This function sends a POST request to the "/get_coin_balance" endpoint with the
 * coin's ID included in the request body. It updates the `currentCoin.balance` property
 * with the fetched data.
 *
 * @async
 * @function getCurrentCoinBalance
 * @returns {Promise<void>} A promise that resolves with no value if the operation is successful,
 *                          or returns an empty array if an error occurs during the fetch operation.
 */
async function getCurrentCoinBalance() {
    const fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coin_id: currentCoin.id }),
    };
    try {
        const response = await fetch("/get_coin_balance", fetchOptions);
        const data = await response.json();
        currentCoin.balance = data;
        return;
    }
    catch (error) {
        console.error("Error:", error);
        return []; // Return an empty array in case of error
    }
}
/**
 * Updates the UI elements on the new trade section with the information of the
 * currently selected coin.
 *
 * - This function updates the coin's image, name, ticker, and price change percentage.
 * - It also updates the color of the price change text based on whether the price has
 *   increased or decreased.
 * - Furthermore, it updates the coin symbol images and values for market, limit, and
 *   stop orders, including the input values for prices and totals based on the current
 *   coin's price.
 *
 * @function updateNewTradeCoinInfo
 * @returns {void}
 */
function updateNewTradeCoinInfo() {
    // Update coin image, name, and ticker
    document
        .querySelector(".coin-image")
        .setAttribute("src", currentCoin.image);
    document.querySelector(".coin-name").textContent = currentCoin.name;
    document.querySelector(".coin-ticker").textContent = currentCoin.ticker;
    // Update coin price and price change
    document.querySelector(".coin-price-change").textContent =
        currentCoin.price_change_24h >= 0 ? "+" : "";
    document.querySelector(".coin-price-change").textContent +=
        currentCoin.price_change_24h.toFixed(2) + "%";
    document.querySelector(".coin-price").textContent =
        "$" + currentCoin.current_price.toLocaleString();
    // Update text colour of coin price change (depending on an increase or decrease of
    // price)
    if (currentCoin.price_change_24h >= 0) {
        document.querySelector(".coin-price-change").style.color = "#17C671";
    }
    else {
        document.querySelector(".coin-price-change").style.color = "#EB5757";
    }
    // Update coin balance image and balance value
    document.querySelector(".nts-trade-info__coin-balance div .coin-image").src = currentCoin.image;
    document.querySelector(".nts-trade-info__coin-balance .coin-balance").textContent = currentCoin.balance.toFixed(4);
    // Update coin symbol images for the market, limit, and stop orders input fields
    document
        .querySelector(".market-order--amount img")
        .setAttribute("src", currentCoin.image);
    document
        .querySelector(".limit-order--amount img")
        .setAttribute("src", currentCoin.image);
    document
        .querySelector(".stop-order--amount img")
        .setAttribute("src", currentCoin.image);
    // Update limit order input field value
    document.querySelector(".limit-order--price input").value = String(currentCoin.current_price);
    // Update stop order input field value
    document.querySelector(".stop-order--price input").value = String(currentCoin.current_price);
    // Update market order input field value
    document.querySelector(".market-order--amount input").value = String(currentCoin.current_price *
        Number(document.querySelector(".market-order--total input").value));
    // Update total value for limit order
    document.querySelector(".limit-order--total input").value = String(Number(document.querySelector(".limit-order--amount input")
        .value) *
        Number(document.querySelector(".limit-order--price input").value));
    // // Update total value for stop order
    document.querySelector(".stop-order--total input").value = String(Number(document.querySelector(".stop-order--amount input")
        .value) *
        Number(document.querySelector(".stop-order--price input")
            .value));
}
// ////////// PLACE BUY ORDER BUTTON EVENT LISTENER BOX //////////
/**
 * Adds an event listener to the "Place Buy Order" button, handles the placing a new
 * trade process.
 *
 * - Gets relevant order details that the user input about the trade (e.g., transaction
 *   type, order type, coin ID, comment, quantity, price, etc.)
 * - Validates the order details to make sure they are correct
 * - Sends the data to the "/process_transaction" Flask endpoint
 * - If the endpoint returns a successful response ("success" attribute in response
 *   object), a succcessful popup message is shown to the user
 * - Else ("error" attribute in response object) an error popup message is shown to
 *   the user, stating the reason for the error
 *
 * @function addPlaceBuyOrderButtonEventListener
 * @returns {void}
 */
function addPlaceBuyOrderButtonEventListener() {
    document
        .querySelector(".nts-place-order-btn-container")
        .addEventListener("click", function () {
        // Get input data
        const transactionType = currentTransactionType;
        const orderType = currentOrderType;
        const coin_id = currentCoin.id;
        const comment = document.querySelector(".nts-comment__input").value;
        let price_per_unit = currentCoin.current_price;
        let quantity = 0;
        // Get user input data based on order type
        if (orderType === "market") {
            quantity = parseFloat(document.querySelector(".market-order--amount input").value);
        }
        else if (orderType == "limit") {
            quantity = parseFloat(document.querySelector(".limit-order--amount input").value);
            price_per_unit = parseFloat(document.querySelector(".limit-order--price input").value);
        }
        else if (orderType == "stop") {
            quantity = parseFloat(document.querySelector(".stop-order--amount input").value);
            price_per_unit = parseFloat(document.querySelector(".stop-order--price input").value);
        }
        const dataToSend = {
            transactionData: {
                transactionType: transactionType,
                orderType: orderType,
                quantity: quantity,
                coin_id: coin_id,
                comment: comment,
                price_per_unit: price_per_unit,
                visibility: visibility,
            },
        };
        // Send to Flask route
        fetch("/process_transaction", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dataToSend),
        })
            .then((response) => response.json())
            .then(async (data) => {
            if ("success" in data) {
                showMessagePopup(data["success"], true);
                resetAllOrderTypeInputsAndCommentBox();
                // Update portfolio total value element and USD balance element
                await updatePortfolioBalanceElement();
                await getAndRenderPortfolioTotalValue();
            }
            else if ("error" in data) {
                showMessagePopup(data["error"], false);
            }
        })
            .catch((error) => console.error("Error:", error));
    });
}
/**
 * Resets all input fields associated with order types and the comment box on the
 * new trade form.
 *
 * This function clears the values of inputs for market orders, limit orders, stop
 * orders, and the notes/comment input. It targets specific classes to identify and
 * clear each input field.
 *
 * @function resetAllOrderTypeInputsAndCommentBox
 * @returns {void} No return value.
 */
function resetAllOrderTypeInputsAndCommentBox() {
    document.querySelector(".market-order--total input").value = "";
    document.querySelector(".market-order--amount input").value = "";
    document.querySelector(".limit-order--amount input").value = "";
    document.querySelector(".limit-order--price input").value = "";
    document.querySelector(".limit-order--total input").value = "";
    document.querySelector(".stop-order--total input").value = "";
    document.querySelector(".stop-order--total input").value = "";
    document.querySelector(".stop-order--total input").value = "";
    document.querySelector(".nts-comment__input").value =
        "";
}
// //////////////////// NEW TRADE SIDEBAR ////////////////////
/**
 * Adds event listeners to the new trade button and the close button in the new trade
 * sidebar.
 *
 * - Clicking the "New Trade" button shows the trade sidebar by calling
 *   showNewTradeSidebar()
 * - Clicking the close button in the sidebar hides the sidebar by calling
 *   hideNewTradeSidebar()
 *
 * @function addNewTradeSidebarEventListeners
 * @returns {void}
 */
function addNewTradeSidebarEventListeners() {
    // Show new trade sidebar on "New Trade" button click
    document
        .querySelector(".new-trade-btn")
        .addEventListener("click", showNewTradeSidebar);
    // Hide new trade sidebar on "Close" button click
    document
        .querySelector(".nts-header__close-btn")
        .addEventListener("click", hideNewTradeSidebar);
    // Hide new trade sidebar on overlay click (anywhere outside the sidebar)
    document
        .querySelector(".new-trade-sidebar-overlay")
        .addEventListener("click", function () {
        hideNewTradeSidebar();
    });
}
/**
 * Shows the new trade sidebar (by moving it back into view) and its overlay.
 *
 * @function showNewTradeSidebar
 * @returns {void}
 */
function showNewTradeSidebar() {
    document.querySelector(".new-trade-sidebar").style.right =
        "0px";
    document.querySelector(".new-trade-sidebar-overlay").style.display = "block";
}
/**
 * Hides the new trade sidebar (by moving it out of view) and its overlay.
 *
 * @function hideNewTradeSidebar
 * @returns {void}
 */
function hideNewTradeSidebar() {
    document.querySelector(".new-trade-sidebar").style.right =
        "-100%";
    document.querySelector(".new-trade-sidebar-overlay").style.display = "none";
}
/**
 * Adds event listeners to the "Buy" and "Sell" transaction buttons to handle user
 * interactions.
 *
 * - Updates the UI to reflect the clicked button being highlighted.
 * - Updates the `currentTransactionType` to either "buy" or "sell" based on the button
 *   clicked.
 *
 * @function addTransactionButtonEventListeners
 * @returns {void}
 */
function addTransactionButtonEventListeners() {
    const buyButton = document.querySelector(".nts-transaction-btns__btn--buy");
    const sellButton = document.querySelector(".nts-transaction-btns__btn--sell");
    // Buy button click event listener
    buyButton.addEventListener("click", function () {
        buyButton.classList.toggle("transaction-btn-active");
        sellButton.classList.toggle("transaction-btn-active");
        currentTransactionType = "buy";
        document.querySelector(".nts-place-order-btn").textContent =
            "PLACE BUY ORDER";
    });
    // Sell button click event listener
    sellButton.addEventListener("click", function () {
        buyButton.classList.toggle("transaction-btn-active");
        sellButton.classList.toggle("transaction-btn-active");
        currentTransactionType = "sell";
        document.querySelector(".nts-place-order-btn").textContent =
            "PLACE SELL ORDER";
    });
}
// ////////// ORDER TYPE BUTTON EVENT LISTENERS //////////
/**
 * Sets default state (Market order type button highlighted and Market order type input
 * container showing), and adds event listeners for what happens when each order type
 * button (Market, Limit, and Stop) are clicked.
 *
 * - By default, the "Market" order type is selected, with its corresponding button
 *   style activated and input container shown.
 * - When a button is clicked, the corresponding order type is activated, the other
 *   buttons are reset to their default state, and the associated input container is
 *   displayed, while the others are hidden.
 *
 * @function addOrderTypeButtonEventListeners
 * @returns {void}
 */
function addOrderTypeButtonEventListeners() {
    // Have "Market" selected by default
    document.querySelector(".order-type-btn--market img").style.filter = "none";
    document.querySelector(".order-type-btn--market p").style.color = "#000000";
    // Only show "Market" input box
    document.querySelector(".limit-order-container").style.display = "none";
    document.querySelector(".stop-order-container").style.display = "none";
    // Market order type button click event listener
    document
        .querySelector(".order-type-btn--market")
        .addEventListener("click", function () {
        currentOrderType = "market";
        resetAllOrderTypeButtons();
        hideAllOrderContainers();
        document.querySelector(".market-order-container").style.display = "flex";
        document.querySelector(".order-type-btn--market img").style.filter = "none";
        document.querySelector(".order-type-btn--market p").style.color = "#000000";
    });
    // Limit order type button click event listener
    document
        .querySelector(".order-type-btn--limit")
        .addEventListener("click", function () {
        currentOrderType = "limit";
        resetAllOrderTypeButtons();
        hideAllOrderContainers();
        document.querySelector(".limit-order-container").style.display = "flex";
        document.querySelector(".order-type-btn--limit img").style.filter = "none";
        document.querySelector(".order-type-btn--limit p").style.color = "#000000";
    });
    // Stop order type button click event listener
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
/**
 * Resets the styles of all order type buttons (Market, Limit, Stop) to their default
 * state (purple image and icons).
 *
 * This function is used such that when a new order type is selected, all of the
 * buttons for each order type are reset to their default state so that the correct
 * order type button can be highlighted.
 *
 * @function resetAllOrderTypeButtons
 * @returns {void}
 */
function resetAllOrderTypeButtons() {
    const marketBtnImg = document.querySelector(".order-type-btn--market img");
    const marketBtnPara = document.querySelector(".order-type-btn--market p");
    const limitBtnImg = document.querySelector(".order-type-btn--limit img");
    const limitBtnPara = document.querySelector(".order-type-btn--limit p");
    const stopBtnImg = document.querySelector(".order-type-btn--stop img");
    const stopBtnPara = document.querySelector(".order-type-btn--stop p");
    // Reset "Market" button
    ((marketBtnImg.style.filter =
        "brightness(0) saturate(100%) invert(68%) sepia(5%) saturate(1595%) hue-rotate(202deg) brightness(90%) contrast(85%)"),
        (marketBtnPara.style.color = "#9696bb"));
    // Reset "Limit" button
    limitBtnImg.style.filter =
        "brightness(0) saturate(100%) invert(68%) sepia(5%) saturate(1595%) hue-rotate(202deg) brightness(90%) contrast(85%)";
    limitBtnPara.style.color = "#9696bb";
    // Reset "Stop" button
    stopBtnImg.style.filter =
        "brightness(0) saturate(100%) invert(68%) sepia(5%) saturate(1595%) hue-rotate(202deg) brightness(90%) contrast(85%)";
    stopBtnPara.style.color = "#9696bb";
}
/**
 * Hides all order type input containers (market, limit, and stop).
 *
 * This function is used such that when a new order type is selected, all of the input
 * containers for each order type are hidden so that only the correct container can
 * then be shown.
 *
 * @function hideAllOrderContainers
 * @returns {void}
 */
function hideAllOrderContainers() {
    document.querySelector(".market-order-container").style.display = "none";
    document.querySelector(".limit-order-container").style.display = "none";
    document.querySelector(".stop-order-container").style.display = "none";
}
// ////////// ORDER TYPE INPUT QUANTITY BOX EVENT LISTENERS //////////
/**
 * Adds event listeners to all order type input fields: market, limit, and stop orders.
 *
 * @function addOrderTypeInputEventListeners
 * @returns {void}
 */
function addOrderTypeInputEventListeners() {
    addMarketOrderTypeInputEventListeners();
    addLimitOrderTypeInputEventListeners();
    addStopOrderTypeInputEventListeners();
}
/**
 * Adds an event listener to the "Market" order "Total" input field.
 * When the total input changes, it recalculates the amount of the asset based on the
 * current coin price.
 *
 * - If the total input is invalid (e.g. NaN, includes a comma, or is empty),
 *   the total input and amount output fields are cleared.
 * - If valid input is provided, it calculates the amount by dividing the total by the current coin price
 *   and updates the amount output field.
 *
 * @function addMarketOrderTypeInputEventListeners
 * @returns {void}
 */
function addMarketOrderTypeInputEventListeners() {
    const totalInput = document.querySelector(".market-order--total input");
    const amountOutput = document.querySelector(".market-order--amount input");
    totalInput.addEventListener("input", function () {
        const input = this.value.trim();
        if (isNaN(Number(input)) || input.includes(",") || input.trim() === "") {
            // If "Total" input is invalid, reset the "Total" input field and the "Amount"
            // output field
            totalInput.value = "";
            amountOutput.value = "";
        }
        else {
            // Else show the result of the calculation in the "Amount" output field
            let quantity = parseFloat(input) / currentCoin.current_price;
            amountOutput.value = String(quantity);
        }
    });
}
/**
 * Add event listeners for the "Limit" order type "Amount" and "Price" input fields.
 * When either input changes, it recalculates the output for the "Total" input field,
 * and erases all input if the user inputs a non-valid number (e.g., an input with a
 * letter, etc.).
 *
 * - If the amount or price input is invalid (e.g. NaN, includes a comma, or is empty),
 *   the respective input and total output fields are cleared.
 * - If valid input is provided, it calculates the total by multiplying the amount by the price and
 *   updates the total output field.
 *
 * @function addLimitOrderTypeInputEventListeners
 * @returns {void}
 */
function addLimitOrderTypeInputEventListeners() {
    const amountInput = document.querySelector(".limit-order--amount input");
    const priceInput = document.querySelector(".limit-order--price input");
    const totalOutput = document.querySelector(".limit-order--total input");
    amountInput.addEventListener("input", function () {
        const input = this.value.trim();
        if (isNaN(Number(input)) || input.includes(",") || input.trim() === "") {
            // Reset "Amount" input field and "Total" output field if "Amount" input is not
            // a valid number
            amountInput.value = "";
            totalOutput.value = "";
        }
        else {
            // Else calculate and show the result in the "Total" output field
            let quantity = parseFloat(input) * parseFloat(priceInput.value);
            totalOutput.value = String(quantity);
        }
    });
    priceInput.addEventListener("input", function () {
        const input = this.value.trim();
        if (isNaN(Number(input)) || input.includes(",") || input.trim() === "") {
            // Reset "Amount" input field and "Total" output field if "Price" input is not
            // a valid number
            priceInput.value = "";
            totalOutput.value = "";
        }
        else {
            // Else calculate and show the result in the "Total" output field
            let quantity = parseFloat(input) * parseFloat(priceInput.value);
            totalOutput.value = String(quantity);
        }
    });
}
/**
 * Add event listeners for the "Stop" order type "Amount" and "Price" input fields.
 * When either input changes, it recalculates the output for the "Total" input field,
 * and erases all input if the user inputs a non-valid number (e.g., an input with a
 * letter, etc.).
 *
 * - If the amount or price input is invalid (e.g. NaN, includes a comma, or is empty),
 *   the respective input and total output fields are cleared.
 * - If valid input is provided, it calculates the total by multiplying the amount by the price and
 *   updates the total output field.
 *
 * @function addStopOrderTypeInputEventListeners
 * @returns {void}
 */
function addStopOrderTypeInputEventListeners() {
    const amountInput = document.querySelector(".stop-order--amount input");
    const priceInput = document.querySelector(".stop-order--price input");
    const totalOutput = document.querySelector(".stop-order--total input");
    amountInput.addEventListener("input", function () {
        const input = this.value.trim();
        if (isNaN(Number(input)) || input.includes(",") || input.trim() === "") {
            // Reset "Amount" input field and "Total" output field if "Amount" input is not a
            // valid number
            amountInput.value = "";
            totalOutput.value = "";
        }
        else {
            // Else calculate and show the result in the "Total" output field
            let quantity = parseFloat(input) * parseFloat(priceInput.value);
            totalOutput.value = String(quantity);
        }
    });
    priceInput.addEventListener("input", function () {
        const input = this.value.trim();
        if (isNaN(Number(input)) || input.includes(",") || input.trim() === "") {
            // Reset "Price" input field and "Total" output field if "Price" input is not a
            // valid number
            priceInput.value = "";
            totalOutput.value = "";
        }
        else {
            // Else calculate and show the result in the "Total" output field
            let quantity = parseFloat(input) * parseFloat(priceInput.value);
            totalOutput.value = String(quantity);
        }
    });
}
/**
 * Adds an event listener to the share timeline toggle switch.
 *
 * - When the toggle is changed, it updates the global "visibility" variable to true
 *   if the switch is checked, and false if unchecked.
 *
 * @function addLimitOrderTypeInputEventListeners
 * @returns {void}
 */
function addShareOnTimelineToggleEventListener() {
    document
        .querySelector(".share-timeline-switch input")
        .addEventListener("change", function () {
        visibility = this.checked ? true : false;
    });
}
/**
 * Function that shows the new trade sidebar, fetching and updating the sidebar to
 * reflect information about a specific coin.
 *
 * @async
 * @function showNewTradeSidebarForSpecificCoin
 * @param {string} coinId - The unique identifier for the coin to display in the new
 *                          trade sidebar.
 * @returns {Promise<void>} A promise that resolves when all asynchronous operations
 *                          and UI updates are complete.
 */
export async function showNewTradeSidebarForSpecificCoin(coinId) {
    currentCoin = { id: coinId };
    await getCurrentCoinInfo();
    await getCurrentCoinBalance();
    updateNewTradeCoinInfo();
    showNewTradeSidebar();
}
/**
 * Asynchronously updates the portfolio USD balance element in the UI with the latest
 * balance data.
 *
 * @async
 * @function updatePortfolioBalanceElement
 * @returns {Promise<void>} A promise that resolves when the balance is successfully
 *                          fetched and displayed.
 */
async function updatePortfolioBalanceElement() {
    const balance = await fetchPortfolioBalance();
    if (balance)
        document.querySelector(".nts-trade-info__usd-balance .usd-balance").textContent = "$" + formatFloatToUSD(balance, 2);
}
async function main() {
    // Cache coin names in session storage
    await cacheCoinNamesInSession();
    // Add event listeners for the sidebar search box and for opening and closing the
    // new trade sidebar
    addNewTradeSidebarSearchEventListeners();
    addNewTradeSidebarEventListeners();
    // Update porfolio USD balance element
    await updatePortfolioBalanceElement();
    // Get and render current coin info
    await getCurrentCoinBalance();
    await getCurrentCoinInfo();
    updateNewTradeCoinInfo();
    // Add event listeners for the various buttons in the new trade sidebar
    addTransactionButtonEventListeners();
    addOrderTypeButtonEventListeners();
    addOrderTypeInputEventListeners();
    addPlaceBuyOrderButtonEventListener();
    addShareOnTimelineToggleEventListener();
}
main();
//# sourceMappingURL=new-trade.js.map