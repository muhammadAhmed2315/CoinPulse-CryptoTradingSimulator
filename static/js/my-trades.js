import {
  getAllCoinNamesDict,
  formatFloatToUSD,
  formatUNIXTimestamp,
} from "../js/helpers.js";

let transactionsData = [];
let coinNamesDict = {};
let currentPage = 1;
let maxPages = 0;
let currentSort = "timestamp_desc";
let assetsValueHistory = [];
let balanceHistory = [];
let totalValueHistory = [];

// ************************************************************************
// ******************** VALUE HISTORY CHARTS FUNCTIONS ********************
// ************************************************************************
/**
 * Fetches wallet value history from the server and updates the following global
 * variables:  assetsValueHistory, balanceHistory, and totalValueHistory.
 *
 * This function sends a POST request to the "/get_wallet_history" endpoint
 * to retrieve the wallet's history, including assets value, balance, timestamps,
 * and total value history. If the server responds with an error or the request fails,
 * an error is thrown and logged to the console.
 *
 * @async
 * @function getWalletHistory
 * @throws {Error} If the server response is not OK or if the server returns an error in the response.
 * @returns {Promise<void>} No return value. Updates global variables with the fetched data.
 */
async function getWalletHistory() {
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await fetch("/get_wallet_history", fetchOptions);
    if (!response.ok) {
      throw new Error("Server responded with an error: " + response.status);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error("Server responded with an error: " + data.error);
    }

    // Update global variables with fetched data
    for (let i = 0; i < data.data.timestamps.length; i++) {
      assetsValueHistory.push([
        data.data.timestamps[i],
        data.data.assets_value_history[i],
      ]);
      balanceHistory.push([
        data.data.timestamps[i],
        data.data.balance_history[i],
      ]);
      totalValueHistory.push([
        data.data.timestamps[i],
        data.data.total_value_history[i],
      ]);
    }
  } catch (error) {
    console.error("Failed to fetch wallet history: ", error);
  }
}

/**
 * Renders a line chart displaying wallet history data (based off of the following
 * global variables: assetsValueHistory, balanceHistory, and totalValueHistory
 *
 * The chart visualizes three datasets: balance history, assets value history, and
 * total value history.
 * Each dataset is represented as a line on the chart, with specific colors assigned to
 * each for distinction. The chart is configured to format y-axis tick labels as
 * currency values. It uses a canvas element identified by the class
 * 'wallet-history-chart' for rendering.
 *
 * @function drawChart
 * @returns {void} Draws the chart on the canvas but does not return any value.
 */
function drawChart(chartType = "totalValueHistory") {
  let data = [];
  let titleText = "";
  let seriesName = "";
  let chartGradientColourStart = "";
  let chartGradientColourEnd = "";
  let lineColor = "";

  // Set the data, title, and series name based on the chart type
  if (chartType === "assets") {
    data = assetsValueHistory;
    titleText = "Assets Value Over Time";
    seriesName = "Assets Value";
  } else if (chartType === "balance") {
    data = balanceHistory;
    titleText = "Balance Over Time";
    seriesName = "Balance";
  } else if (chartType === "total") {
    data = totalValueHistory;
    titleText = "Total Wallet Value Over Time";
    seriesName = "Total Wallet Value";
  }

  // Highcharts expects timestamps in milliseconds, and since the timestamps are
  // currently in seconds, multiply each timestamp by 1000
  data = data.map(([date, value]) => [date * 1000, value]);

  // Set the chart gradient colours and line color based on the data
  if (data[0][1] > data.at(-1)[1]) {
    chartGradientColourStart = "#EB5757aa";
    chartGradientColourEnd = "#EB575700";
    lineColor = "#EB5757";
  } else {
    chartGradientColourStart = "#17C671aa";
    chartGradientColourEnd = "#17C67100";
    lineColor = "#17C671";
  }

  Highcharts.stockChart("wallet-history-chart", {
    // Sets the border radius of the chart container
    chart: {
      borderRadius: 8,
    },

    rangeSelector: {
      selected: 1,
    },

    title: {
      text: titleText,
    },

    yAxis: {
      labels: {
        formatter: function () {
          return "$" + Highcharts.numberFormat(this.value, 2);
        },
      },
    },

    series: [
      {
        name: seriesName,
        data: data,
        tooltip: { valueDecimals: 2 },
        type: "area", // Specify the series type as area
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, chartGradientColourStart], // Start color (top)
            [1, chartGradientColourEnd], // End color (bottom)
          ],
        },
        lineColor: lineColor, // Line color
        lineWidth: 2,
        states: {
          hover: {
            lineWidth: 2,
          },
        },
        threshold: null,
      },
    ],

    navigator: {
      series: {
        color: lineColor, // This changes the line color in the navigator
        lineWidth: 2,
      },
    },
  });
}

/**
 * Adds event listeners to chart buttons and handles chart rendering based on the
 * button clicked.
 *
 * The function adds click event listeners to three chart buttons: "Balance History",
 * "Assets Value History", and "Total Value History". When a button is clicked, it
 * resets the style of all buttons (so that they all appear as deselected), sets the
 * clicked button's background color, and calls the `drawChart` function to display
 * the corresponding chart.
 *
 * @function addChartButtonEventListeners
 */
function addChartButtonEventListeners() {
  // "Balance History" button event listener
  document
    .querySelector(".chart-btn--balance")
    .addEventListener("click", function () {
      resetChartButtons();
      this.style.backgroundColor = "#0069d9";
      drawChart("balance");
    });

  // "Assets Value History" button event listener
  document
    .querySelector(".chart-btn--assets")
    .addEventListener("click", function () {
      resetChartButtons();
      this.style.backgroundColor = "#0069d9";
      drawChart("assets");
    });

  // "Total Value History" button event listener
  document
    .querySelector(".chart-btn--total")
    .addEventListener("click", function () {
      resetChartButtons();
      this.style.backgroundColor = "#0069d9";
      drawChart("total");
    });
}

/**
 * Resets the background color of all chart buttons to the default color (so that they
 * all appear as deselected). This function is called before selecting the clicked
 * button.
 *
 * @function resetChartButtons
 */
function resetChartButtons() {
  document.querySelector(".chart-btn--balance").style.backgroundColor =
    "#17C671";
  document.querySelector(".chart-btn--assets").style.backgroundColor =
    "#17C671";
  document.querySelector(".chart-btn--total").style.backgroundColor = "#17C671";
}

// ******************************************************************************
// ******************** TRANSACTIONS HISTORY TABLE FUNCTIONS ********************
// ******************************************************************************
/**
 * Fetches all of a user's previous transactions from the Flask server based on the
 * specified page and sort order.
 *
 * @async
 * @function getTransactionData
 * @param {number} [page=1] - The page number of the data to fetch (1-indexed)
 * @param {string} [sort="timestamp_desc"] - The sort order for the data, e.g.,
 *                                           "timestamp_desc" for descending order by
 *                                            timestamp
 * @returns {Promise<Array>} A promise that resolves to an array where the first
 *                           element is the transaction data and the second element is
 *                           the maximum number of pages. The second return value is
 *                           used for the pagination buttons.
 */
async function getTransactionData(page = 1, sort = "timestamp_desc") {
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page: page, sort: sort }),
  };

  const response = await fetch("/get_trades_info", fetchOptions);
  const data = await response.json();

  return [data["data"], data["maxPages"]];
}

/**
 * Creates and appends the specified number of rows to the transactions table, each
 * containing placeholder data.
 *
 * @function createTableRows
 * @param {number} [numRows=25] - The number of rows to create and append to the table.
 */
function createTableRows(numRows = 25) {
  const markup = `
        <td class="transaction-id"></td>
        <td class="transaction-status"></td>
        <td class="transaction-order-type"></td>
        <td class="transaction-transaction-type"></td>
        <td class="transaction-coin-name"></td>
        <td class="transaction-quantity"></td>
        <td class="transaction-price"></td>
        <td class="transaction-price-at-execution"></td>
        <td class="transaction-time"></td>
        <td class="transaction-action"></td>
        <td class="transaction-comment"></td>
    `;

  const transactionsTable = document.querySelector(".my-trades-table tbody");
  for (let i = 0; i < numRows; i++) {
    const tableDataRow = document.createElement("tr");
    tableDataRow.classList.add("my-trades-table__row");
    tableDataRow.innerHTML = markup;
    transactionsTable.appendChild(tableDataRow);
  }
}

/**
 * Deletes all rows with the class "my-trades-table__row" (i.e., all data (non-header)
 * rows) from the transactions table.
 *
 * @function deleteTableRows
 */
function deleteTableRows() {
  const transactionsTable = document.querySelector(".my-trades-table tbody");
  const rows = transactionsTable.querySelectorAll(".my-trades-table__row");

  rows.forEach((row) => {
    transactionsTable.removeChild(row);
  });
}

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

/**
 * Dynamically displays transaction data in the "My Trades" table.
 * If no transactions exist, it adds a "No Transactions" label to the page.
 * For existing transactions, it populates table rows with detailed information and
 * also adds action buttons for cancellable transactions and updates the UI accordingly
 * when a transaction is cancelled.
 *
 * @function displayTransactionData
 */
function displayTransactionData() {
  const tableRows = document.querySelectorAll(".my-trades-table__row");

  if (
    tableRows.length === 0 &&
    !document.querySelector(".no-transactions-label")
  ) {
    const noTransactionsLabel = document.createElement("p");
    noTransactionsLabel.classList.add("no-transactions-label");
    noTransactionsLabel.textContent =
      "It looks like you haven't placed any trades yet. Head to the Home page or click the New Trade button above to place your first trade.";
    document
      .querySelector(".my-trades-table")
      .insertAdjacentElement("afterend", noTransactionsLabel);
  } else {
    for (const [i, row] of Array.from(tableRows).entries()) {
      // Rendering status bubbles
      const statusDiv = document.createElement("div");
      statusDiv.classList.add("transaction-status-bubble");
      row.querySelector(".transaction-status").innerHTML = "";

      let statusBubbleBackgroundColor = "";
      if (transactionsData[i].status === "open") {
        statusBubbleBackgroundColor = "#17C671";
      } else if (transactionsData[i].status === "finished") {
        statusBubbleBackgroundColor = "#758AD4";
      } else if (transactionsData[i].status === "cancelled") {
        statusBubbleBackgroundColor = "#EB5757";
      }
      statusDiv.style.backgroundColor = statusBubbleBackgroundColor;
      row.querySelector(".transaction-status").appendChild(statusDiv);

      // Update transaction id
      row.querySelector(".transaction-id").textContent = transactionsData[i].id;
      row
        .querySelector(".transaction-id")
        .setAttribute("title", transactionsData[i].id);

      // Update order type
      row.querySelector(".transaction-order-type").textContent =
        transactionsData[i].orderType;
      row
        .querySelector(".transaction-order-type")
        .setAttribute("title", transactionsData[i].orderType);

      // Update transaction type (buy/sell)
      row.querySelector(".transaction-transaction-type").textContent =
        transactionsData[i].transactionType;
      row
        .querySelector(".transaction-transaction-type")
        .setAttribute("title", transactionsData[i].transactionType);

      // Update coin name
      row.querySelector(".transaction-coin-name").textContent =
        transactionsData[i].coin_id;
      row
        .querySelector(".transaction-coin-name")
        .setAttribute("title", transactionsData[i].coin_id);

      // Update transaction quantity
      row.querySelector(".transaction-quantity").textContent = formatFloatToUSD(
        transactionsData[i].quantity,
        2
      );
      row
        .querySelector(".transaction-quantity")
        .setAttribute(
          "title",
          formatFloatToUSD(transactionsData[i].quantity, 2)
        );

      // Update transaction price
      row.querySelector(".transaction-price").textContent =
        "$" + formatFloatToUSD(transactionsData[i].price_per_unit, 2);
      row
        .querySelector(".transaction-price")
        .setAttribute(
          "title",
          "$" + formatFloatToUSD(transactionsData[i].price_per_unit, 2)
        );

      // Update transaction price at execution
      const priceAtExecution =
        transactionsData[i].price_at_execution != -1
          ? "$" + formatFloatToUSD(transactionsData[i].price_at_execution, 2)
          : "N/A";

      row.querySelector(".transaction-price-at-execution").textContent =
        priceAtExecution;
      row
        .querySelector(".transaction-price-at-execution")
        .setAttribute("title", priceAtExecution);

      // Update transaction time
      row.querySelector(".transaction-time").textContent = formatUNIXTimestamp(
        transactionsData[i].timestamp
      );
      row
        .querySelector(".transaction-time")
        .setAttribute(
          "title",
          formatUNIXTimestamp(transactionsData[i].timestamp)
        );

      // Update action
      if (transactionsData[i].status === "open") {
        // Add cancel button
        row.querySelector(".transaction-action").innerHTML =
          "<img title='Cancel Trade' src='../../static/img/icons/close-circle.svg' />";

        // Reduce padding for that cell
        row.querySelector(".transaction-action").style.padding = "0";

        // Add event listener to cancel button
        row
          .querySelector(".transaction-action img")
          .addEventListener("click", async function () {
            const result = await requestOpenTradeCancellation(
              transactionsData[i].id
            );

            if (result) {
              // Change cross button to cancelled text
              row.querySelector(".transaction-action").innerHTML =
                "<p>Cancelled</p>";

              // Change colour of status bubble
              row.querySelector(
                ".transaction-status-bubble"
              ).style.backgroundColor = "#EB5757";
            }
          });
      } else {
        row.querySelector(".transaction-action").innerHTML = "<p>N/A</p>";
      }

      // Update comment
      row.querySelector(".transaction-comment").textContent =
        transactionsData[i].comment;
      row
        .querySelector(".transaction-comment")
        .setAttribute("title", transactionsData[i].comment);
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
 * @param {number} transaction_id - The ID of the transaction to be canceled.
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

  if (data.success) {
    return true;
  } else if (data.error) {
    return false;
  }
}

/**
 * Adds event listeners to the pagination buttons to handle navigation between pages.
 *
 * @function addPaginationButtonEventListeners
 *
 * The "Next" button will load the next page of transaction data if available, and the
 * "Previous" button will load the previous page.
 *
 * The event listeners handle:
 * - Fetching new transaction data for the selected page.
 * - Deleting the existing table rows and creating new ones based on the fetched data.
 * - Updating the visibility of the pagination buttons based on the current page.
 */
function addPaginationButtonEventListeners() {
  const nextButton = document.querySelector(".pagination-btn--next");
  const previousButton = document.querySelector(".pagination-btn--previous");

  // Hide both pagination buttons if maxPages == 1
  if (maxPages === 0) {
    nextButton.classList.add("hidden");
    previousButton.classList.add("hidden");
  }

  nextButton.addEventListener("click", async function () {
    if (currentPage < maxPages) {
      currentPage += 1;
      transactionsData = (await getTransactionData(currentPage))[0];
      deleteTableRows();
      createTableRows(transactionsData.length);
      displayTransactionData();

      nextButton.classList.toggle("hidden", currentPage === maxPages);
      previousButton.classList.toggle("hidden", currentPage === 1);
    }
  });

  previousButton.addEventListener("click", async function () {
    if (currentPage > 1) {
      currentPage -= 1;
      transactionsData = (await getTransactionData(currentPage))[0];
      deleteTableRows();
      createTableRows(transactionsData.length);
      displayTransactionData();

      previousButton.classList.toggle("hidden", currentPage === 1);
      nextButton.classList.toggle("hidden", currentPage === maxPages);
    }
  });
}

/**
 * Adds click event listeners to each sortable table header in the "My Trades" table.
 * This allows for sorting the table data in ascending or descending order based on the
 * selected column. The sorting state is reflected in the header by toggling the arrow
 * indicators.
 *
 * @function addSortingEventListeners
 *
 * This function:
 * - Resets the text content of the currently sorted by table heading when a new sort
 *   is applied
 * - Fetches data reflecting the new sort from the Flask server
 * - Updates the column heading so that the user can see how the table data is currently
 *   being sorted
 */
function addSortingEventListeners() {
  // Dictionary mapping each sort type to its DOM element and the default text that
  // should be displayed at that heading
  const sortDOMElementDict = {
    order_type_asc: [
      document.querySelector(".my-trades-table__header-order-type p"),
      "ORDER TYPE",
    ],
    order_type_desc: [
      document.querySelector(".my-trades-table__header-order-type p"),
      "ORDER TYPE",
    ],
    transaction_type_asc: [
      document.querySelector(".my-trades-table__header-transaction-type p"),
      "BUY/SELL",
    ],
    transaction_type_desc: [
      document.querySelector(".my-trades-table__header-transaction-type p"),
      "BUY/SELL",
    ],
    coin_asc: [
      document.querySelector(".my-trades-table__header-coin p"),
      "COIN",
    ],
    coin_desc: [
      document.querySelector(".my-trades-table__header-coin p"),
      "COIN",
    ],
    quantity_asc: [
      document.querySelector(".my-trades-table__header-quantity p"),
      "QUANTITY",
    ],
    quantity_desc: [
      document.querySelector(".my-trades-table__header-quantity p"),
      "QUANTITY",
    ],
    price_asc: [
      document.querySelector(".my-trades-table__header-price p"),
      "PRICE",
    ],
    price_desc: [
      document.querySelector(".my-trades-table__header-price p"),
      "PRICE",
    ],
    timestamp_asc: [
      document.querySelector(".my-trades-table__header-time p"),
      "TIME PLACED",
    ],
    timestamp_desc: [
      document.querySelector(".my-trades-table__header-time p"),
      "TIME PLACED",
    ],
    status_asc: [
      document.querySelector(".my-trades-table__header-status p"),
      "STATUS",
    ],
    status_desc: [
      document.querySelector(".my-trades-table__header-status p"),
      "STATUS",
    ],
    price_at_execution_asc: [
      document.querySelector(".my-trades-table__header-price-at-execution p"),
      "EXECUTION PRICE",
    ],
    price_at_execution_desc: [
      document.querySelector(".my-trades-table__header-price-at-execution p"),
      "EXECUTION PRICE",
    ],
  };

  /**
   * Resets the text content of the currently sorted table header to remove any arrow
   * indicators. This function is called before applying a new sort to clear the
   * previous sort indicator.
   */
  function resetAllTableHeadings() {
    sortDOMElementDict[currentSort][0].textContent =
      sortDOMElementDict[currentSort][1] + "\u00A0\u00A0";
  }

  /**
   * Fetches new table data based on the current sort order and updates the table.
   * This function handles pagination and data retrieval logic to display the updated
   * table rows.
   */
  async function updateTableData() {
    currentPage = 1;
    const temp = await getTransactionData(currentPage, currentSort);
    transactionsData = temp[0];
    maxPages = temp[1];
    deleteTableRows();
    createTableRows(transactionsData.length);
    displayTransactionData();

    // Update pagination button visibility based on new maxPages
    const nextButton = document.querySelector(".pagination-btn--next");
    const previousButton = document.querySelector(".pagination-btn--previous");
    nextButton.classList.toggle("hidden", currentPage === maxPages);
    previousButton.classList.toggle("hidden", currentPage === 1);
  }

  // Array containing the information needed to set up an event listener for each table
  // column header
  const headingInfo = [
    { cssClass: "order-type", sortName: "order_type", textLabel: "ORDER TYPE" },
    {
      cssClass: "transaction-type",
      sortName: "transaction_type",
      textLabel: "BUY/SELL",
    },
    { cssClass: "coin", sortName: "coin", textLabel: "COIN" },
    { cssClass: "quantity", sortName: "quantity", textLabel: "QUANTITY" },
    { cssClass: "price", sortName: "price", textLabel: "PRICE" },
    { cssClass: "time", sortName: "timestamp", textLabel: "TIME PLACED" },
    { cssClass: "status", sortName: "status", textLabel: "STATUS" },
    {
      cssClass: "price-at-execution",
      sortName: "price_at_execution",
      textLabel: "EXECUTION PRICE",
    },
  ];

  // Adds a click event listener to each header for sorting functionality
  for (const heading of headingInfo) {
    const headerP = document.querySelector(
      `.my-trades-table__header-${heading.cssClass} p`
    );
    headerP.addEventListener("click", async function () {
      resetAllTableHeadings();

      if (currentSort === `${heading.sortName}_asc`) {
        // Switch to descending
        currentSort = `${heading.sortName}_desc`;
        this.textContent = `${heading.textLabel} \u2193`; // Down arrow

        await updateTableData();
      } else {
        // Switch to ascending
        currentSort = `${heading.sortName}_asc`;
        this.textContent = `${heading.textLabel} \u2191`; // Up arrow

        await updateTableData();
      }
    });
  }
}

/**
 * Scrolls to a specific element on the page identified by the URL hash when the page
 * loads.
 *
 * The function waits for the entire content to load, including dynamically generated
 * content, before attempting to scroll. It then applies a smooth scroll to the element
 * offset by 100 pixels from the top to not obstruct any fixed headers or elements on
 * the page. The delay in the scroll execution can be adjusted to accommodate varying
 * content loading times.
 *
 * @function scrollToHashOnLoad
 */
function scrollToHashOnLoad() {
  document.addEventListener("DOMContentLoaded", function () {
    // Check if there's a hash in the URL
    if (window.location.hash) {
      // Wait for the dynamically generated content to load
      setTimeout(function () {
        // Scroll to the element with the specified ID
        var targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
          var elementPosition =
            targetElement.getBoundingClientRect().top + window.pageYOffset;
          var offsetPosition = elementPosition - 100;

          // Scroll to the position with offset
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 250); // Adjust the delay to match your content loading time
    }
  });
}

/**
 * Initialises the page by fetching the initial transaction data, setting up pagination,
 * and adding event listeners to each column heading to enable sorting.
 *
 * @async
 * @function main
 */
async function main() {
  scrollToHashOnLoad();

  // Draw the total value history chart
  await getWalletHistory();
  drawChart("total");
  addChartButtonEventListeners();

  // Add pagination and sorting event listeners
  addPaginationButtonEventListeners();
  addSortingEventListeners();

  // Get transaction data (from the database) and cache coin names
  await cacheCoinNamesInSession();
  const temp = await getTransactionData(1);
  transactionsData = temp[0];
  maxPages = temp[1];

  // Create table rows based on length of transactions data and display the data
  createTableRows(transactionsData.length);
  displayTransactionData();
}

main();
