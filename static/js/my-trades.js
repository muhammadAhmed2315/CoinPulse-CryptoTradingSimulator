import { COINGECKO_API_OPTIONS, getAllCoinNamesDict } from "../js/helpers.js";

let transactionsData = [];
let coinNamesDict = {};
let currentPage = 1;
let maxPages = 0;
let currentSort = "timestamp_desc";
let assetsValueHistory = [];
let balanceHistory = [];
let totalValueHistory = [];
let historyTimestamps = [];

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
        <p class="transaction-id">RANDOM</p>
        <p class="transaction-type">RANDOM</p>
        <p class="transaction-coin-name">RANDOM</p>
        <p class="transaction-quantity">RANDOM</p>
        <p class="transaction-price">RANDOM</p>
        <p class="transaction-time">RANDOM</p>
        <p class="transaction-total-value">RANDOM</p>
        <p class="transaction-comment">RANDOM</p>
    `;

  const transactionsTable = document.querySelector(".my-trades-table");
  for (let i = 0; i < numRows; i++) {
    const tableDataRow = document.createElement("div");
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
  const transactionsTable = document.querySelector(".my-trades-table");
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

// TODO
function displayTransactionData() {
  const tableRows = document.querySelectorAll(".my-trades-table__row");

  for (const [i, row] of Array.from(tableRows).entries()) {
    // Format the data first
    // TODO

    // Show the data
    row.querySelector(".transaction-id").textContent = transactionsData[i].id;
    row.querySelector(".transaction-type").textContent =
      transactionsData[i].type;
    row.querySelector(".transaction-coin-name").textContent =
      transactionsData[i].coin_id;
    row.querySelector(".transaction-quantity").textContent =
      transactionsData[i].quantity;
    row.querySelector(".transaction-price").textContent =
      transactionsData[i].price_per_unit;
    row.querySelector(".transaction-time").textContent =
      transactionsData[i].timestamp;
    row.querySelector(".transaction-total-value").textContent =
      transactionsData[i].total_value;
    row.querySelector(".transaction-comment").textContent =
      transactionsData[i].comment;
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

  nextButton.addEventListener("click", async function () {
    if (currentPage < maxPages) {
      currentPage += 1;
      transactionsData = (await getTransactionData(currentPage))[0];
      deleteTableRows();
      createTableRows(transactionsData.length);
      displayTransactionData();

      nextButton.classList.toggle("hidden", currentPage == maxPages);
      previousButton.classList.toggle("hidden", currentPage == 1);
    }
  });

  previousButton.addEventListener("click", async function () {
    if (currentPage > 1) {
      currentPage -= 1;
      transactionsData = (await getTransactionData(currentPage))[0];
      deleteTableRows();
      createTableRows(transactionsData.length);
      displayTransactionData();

      previousButton.classList.toggle("hidden", currentPage == 1);
      nextButton.classList.toggle("hidden", currentPage == 10);
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
 * - Updates the column heading so that the user can see how the table data is curently
 *   being sorted
 */
function addSortingEventListeners() {
  // Dictionary mapping each sort type to its DOM element and the default text that
  // should be displayed at that heading
  const sortDOMElementDict = {
    type_asc: [
      document.querySelector(".my-trades-table__header-order-type"),
      "Order Type",
    ],
    type_desc: [
      document.querySelector(".my-trades-table__header-order-type"),
      "Order Type",
    ],
    coin_asc: [document.querySelector(".my-trades-table__header-coin"), "Coin"],
    coin_desc: [
      document.querySelector(".my-trades-table__header-coin"),
      "Coin",
    ],
    quantity_asc: [
      document.querySelector(".my-trades-table__header-quantity"),
      "Quantity",
    ],
    quantity_desc: [
      document.querySelector(".my-trades-table__header-quantity"),
      "Quantity",
    ],
    price_asc: [
      document.querySelector(".my-trades-table__header-price"),
      "Price",
    ],
    price_desc: [
      document.querySelector(".my-trades-table__header-price"),
      "Price",
    ],
    total_value_asc: [
      document.querySelector(".my-trades-table__header-total-value"),
      "Total Value",
    ],
    total_value_desc: [
      document.querySelector(".my-trades-table__header-total-value"),
      "Total Value",
    ],
    timestamp_asc: [
      document.querySelector(".my-trades-table__header-time"),
      "Time",
    ],
    timestamp_desc: [
      document.querySelector(".my-trades-table__header-time"),
      "Time",
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
    transactionsData = (await getTransactionData(currentPage, currentSort))[0];
    deleteTableRows();
    createTableRows(transactionsData.length);
    displayTransactionData();
  }

  // Array containing the information needed to set up an event listener for each table
  // column header
  const headingInfo = [
    { cssClass: "order-type", sortName: "type", textLabel: "Order Type" },
    { cssClass: "coin", sortName: "coin", textLabel: "Coin" },
    { cssClass: "quantity", sortName: "quantity", textLabel: "Quantity" },
    { cssClass: "price", sortName: "price", textLabel: "Price" },
    { cssClass: "time", sortName: "timestamp", textLabel: "Time" },
    {
      cssClass: "total-value",
      sortName: "total_value",
      textLabel: "Total Value",
    },
  ];

  // Adds a click event listener to each header for sorting functionality
  for (const heading of headingInfo) {
    document
      .querySelector(`.my-trades-table__header-${heading.cssClass}`)
      .addEventListener("click", async function () {
        resetAllTableHeadings();

        if (currentSort === `${heading.sortName}_asc`) {
          // Switch to descending
          currentSort = `${heading.sortName}_desc`;
          this.textContent = `${heading.textLabel} ↓`;

          await updateTableData();
        } else {
          // Switch to ascending
          currentSort = `${heading.sortName}_asc`;
          this.textContent = `${heading.textLabel} ↑`;

          await updateTableData();
        }
      });
  }
}

/**
 * Asynchronously fetches wallet history from the server and updates the following
 * global variables: assetsValueHistory, balanceHistory, historyTimestamps, and
 * totalValueHistory
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

    assetsValueHistory = data.assets_value_history;
    balanceHistory = data.balance_history;
    historyTimestamps = data.timestamps;
    totalValueHistory = data.total_value_history;
  } catch (error) {
    console.error("Failed to fetch wallet history: ", error);
  }
}

/**
 * Renders a line chart displaying wallet history data (based off of the following
 * global variables: assetsValueHistory, balanceHistory, historyTimestamps, and
 * totalValueHistory
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
function drawChart() {
  // Setup the chart
  const labels = historyTimestamps;
  const data = {
    labels: labels,
    datasets: [
      {
        label: "Balance History",
        backgroundColor: "rgb(255, 99, 132)", // Dot colour
        borderColor: "rgb(255, 99, 132)", // Line colour
        data: balanceHistory,
      },
      {
        label: "Assets Value History",
        backgroundColor: "rgb(0, 255, 0)",
        borderColor: "rgb(0, 255, 0)",
        data: assetsValueHistory,
      },
      {
        label: "Total Value History",
        backgroundColor: "rgb(0, 0, 255)",
        borderColor: "rgb(0, 0, 255)",
        data: totalValueHistory,
      },
    ],
  };

  // CONFIG Block
  const config = {
    type: "line",
    data,
    options: {
      scales: {
        y: {
          ticks: {
            // Function to format tick labels
            callback: function (value, index, values) {
              return "$" + value.toLocaleString();
            },
          },
        },
      },
    },
  };

  // Render the chart
  const myChart = new Chart(
    document.querySelector(".wallet-history-chart"),
    config
  );
}

/**
 * Initialises the page by fetching the initial transaction data, setting up pagination,
 * and adding event listeners to each column heading to enable sorting.
 *
 * @async
 * @function main
 */
async function main() {
  await cacheCoinNamesInSession();
  const temp = await getTransactionData(1);
  transactionsData = temp[0];
  maxPages = temp[1];

  createTableRows(transactionsData.length);
  displayTransactionData();

  addPaginationButtonEventListeners();
  addSortingEventListeners();

  await getWalletHistory();
  drawChart();
}

main();
