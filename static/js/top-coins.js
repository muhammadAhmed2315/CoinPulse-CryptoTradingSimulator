import { COINGECKO_API_OPTIONS } from "../js/helpers.js";

let current_page = 1;
let current_sort = "market_cap_desc";
let coinData = {
  market_cap_asc: null,
  market_cap_desc: null,
  volume_asc: null,
  volume_desc: null,
};

/**
 * Fetches cryptocurrency data from the CoinGecko API and returns a processed array of
 * coins.
 *
 * This asynchronous function retrieves market data for cryptocurrencies from the
 * CoinGecko API, sorted according to the specified criterion.
 *
 * @param {string} [sortCoinsBy="market_cap_desc"] - The sorting criterion for the API
 *                                                   request. Has the following sorting
 *                                                   options:
 * - `market_cap_asc`: Sort by market capitalization in ascending order.
 * - `market_cap_desc`: Sort by market capitalization in descending order.
 * - `volume_asc`: Sort by volume in ascending order.
 * - `volume_desc`: Sort by volume in descending order.
 *
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of objects,
 *                                     each representing a cryptocurrency with the
 *                                     following properties:
 * - `image`: The URL of the coin's image.
 * - `name`: The name of the cryptocurrency.
 * - `symbol`: The symbol of the cryptocurrency.
 * - `current_price`: The current price of the cryptocurrency in USD.
 * - `market_cap`: The market capitalization of the cryptocurrency in USD.
 * - `price_change_24h`: The 24-hour price change as a percentage.
 * - `total_volume`: The trading volume of the cryptocurrency.
 *
 * In case of an error during the API request, the function logs the error to the
 * console and returns an empty array.
 */
async function fetchCoinsData(sortCoinsBy = "market_cap_desc") {
  const url = new URL("https://api.coingecko.com/api/v3/coins/markets");

  const params = {
    vs_currency: "usd",
    order: sortCoinsBy,
    per_page: 100,
    page: 1,
    price_change_percentage: "24h",
    precision: 2,
    sparkline: "true",
  };
  Object.keys(params).forEach((key) =>
    url.searchParams.append(key, params[key])
  );

  try {
    const response = await fetch(url, COINGECKO_API_OPTIONS);
    const data = await response.json();
    const results = data.map((coin) => {
      let {
        image,
        name,
        symbol,
        current_price,
        market_cap,
        price_change_24h,
        total_volume,
        sparkline_in_7d,
      } = coin;

      price_change_24h =
        (price_change_24h / (current_price - price_change_24h)) * 100;

      sparkline_in_7d = sparkline_in_7d["price"];

      return {
        image,
        name,
        symbol,
        current_price,
        market_cap,
        price_change_24h,
        total_volume,
        sparkline_in_7d,
      };
    });

    return results;
  } catch (error) {
    console.error("Error:", error);
    return []; // Return an empty array in case of error
  }
}

/**
 * Creates and appends table rows for displaying cryptocurrency data.
 *
 * This function generates a specified number of table rows, each containing
 * elements to display various details about a cryptocurrency (e.g., image,
 * name, price, market cap, price change, and volume). These rows are then
 * appended to an existing table in the DOM.
 *
 * @param {number} [numRows=10] - The number of table rows to create.
 *                                 Defaults to 10 if not specified.
 */
function createCoinTableRows(numRows = 10) {
  const markup = `
      <img  class="coin-image" src="" />
      <p class="coin-name"></p>
      <p class="coin-price"></p>
      <p class="coin-market-cap"></p>
      <p class="coin-price-change"></p>
      <p class="coin-volume"></p>
      <canvas class="sparkline-canvas" width="176px" height="50px"></canvas>
      `;

  const coinsTable = document.querySelector(".table");
  for (let i = 0; i < numRows; i++) {
    const coinTableDataRow = document.createElement("div");
    coinTableDataRow.classList.add("table-row");
    coinTableDataRow.innerHTML = markup;
    coinsTable.appendChild(coinTableDataRow);
  }
}

/**
 * Displays a paginated list of cryptocurrency data in a table.
 *
 * This function updates the table rows with cryptocurrency data based on the
 * current sorting criteria and the specified page number. It fetches a subset
 * of the data from the `coinData` dictionary and updates the table rows
 * accordingly.
 *
 * @param {number} pageNum - The page number to display (1-indexed)
 */
function displayCoins(pageNum) {
  const tableRows = document.querySelectorAll(".table-row");
  const dataToShow = coinData[current_sort].slice(
    (pageNum - 1) * 10,
    pageNum * 10
  );

  for (const [i, row] of Array.from(tableRows).entries()) {
    row.querySelector(".coin-image").setAttribute("src", dataToShow[i].image);
    row
      .querySelector(".coin-image")
      .setAttribute("alt", dataToShow[i].name + " Logo");

    row.querySelector(
      ".coin-name"
    ).textContent = `${dataToShow[i].name} (${dataToShow[i].symbol})`;

    row.querySelector(".coin-price").textContent = `${dataToShow[
      i
    ].current_price.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    })}`;

    row.querySelector(".coin-market-cap").textContent = `${dataToShow[
      i
    ].market_cap.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    })}`;

    row.querySelector(".coin-price-change").textContent =
      dataToShow[i].price_change_24h >= 0 ? "+" : "";
    row.querySelector(".coin-price-change").textContent += `${dataToShow[
      i
    ].price_change_24h.toFixed(2)}%`;
    row.querySelector(".coin-price-change").style.color =
      dataToShow[i].price_change_24h >= 0 ? "#EB5757" : "#17C671";

    row.querySelector(".coin-volume").textContent = `${dataToShow[
      i
    ].total_volume.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

    drawSparkline(
      dataToShow[i].sparkline_in_7d,
      row.querySelector(".sparkline-canvas")
    );
  }
}

function drawSparkline(data, canvas) {
  const ctx = canvas.getContext("2d");

  // Clear previous drawings
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set up the drawing style
  if (data[0] > data[data.length - 1]) {
    ctx.strokeStyle = "#EB5757"; // Line color
  } else {
    ctx.strokeStyle = "#17C671"; // Line color
  }

  ctx.lineWidth = 2;

  // Determine the scale of the graph
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal;

  // Function to map data points to canvas coordinates
  const scaleX = canvas.width / (data.length - 1);
  const scaleY = canvas.height / range;

  // Start at the first data point
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - (data[0] - minVal) * scaleY);

  // Draw line to each subsequent point
  data.forEach((val, i) => {
    ctx.lineTo(i * scaleX, canvas.height - (val - minVal) * scaleY);
  });

  // Stroke the path
  ctx.stroke();
}

/**
 * Adds event listeners to the pagination buttons for navigating through pages.
 *
 * This function attaches click event listeners to the "Next" and "Previous"
 * pagination buttons, allowing users to navigate through pages of content.
 * Renders the new coins, and handles button visibility as well depending on
 * which page is currently visible (i.e., next = hidden on last page, previous =
 * hidden on first page).
 */
function addPaginationButtonEventListeners() {
  const tableButtonNext = document.querySelector(".pagination-button--next");
  const tableButtonPrevious = document.querySelector(
    ".pagination-button--previous"
  );

  tableButtonNext.addEventListener("click", function () {
    if (current_page < 10) {
      current_page += 1;
      displayCoins(current_page);

      tableButtonNext.classList.toggle("hidden", current_page == 10);
      tableButtonPrevious.classList.toggle("hidden", current_page == 1);
    }
  });

  tableButtonPrevious.addEventListener("click", function () {
    if (current_page > 1) {
      current_page -= 1;
      displayCoins(current_page);

      tableButtonPrevious.classList.toggle("hidden", current_page == 1);
      tableButtonNext.classList.toggle("hidden", current_page == 10);
    }
  });
}

/**
 * Adds event listeners to the sort dropdown menu for handling sorting actions.
 *
 * This function attaches an event listener to a dropdown menu with the class
 * "sort-dropdown-menu". When the user selects a sorting option, it updates the
 * current sorting criteria, resets the pagination to the first page, and
 * refreshes the displayed content accordingly.
 *
 * Each case in the switch statement:
 * - Sets the `current_sort` variable to the selected sorting option.
 * - Resets the `current_page` variable to 1.
 * - Calls `resetPaginationButtons()` to reset pagination controls.
 * - Conditionally fetches the sorted coin data if not already cached in `coinData`.
 * - Calls `displayCoins(current_page)` to refresh the displayed content.
 */
function addSortDropdownEventListeners() {
  document
    .querySelector(".sort-dropdown-menu")
    .addEventListener("change", async function (event) {
      const selectedValue = event.target.value;

      switch (selectedValue) {
        case "market_cap_asc":
          current_sort = "market_cap_asc";
          current_page = 1;
          resetPaginationButtons();

          if (!coinData.market_cap_asc) {
            coinData.market_cap_asc = await fetchCoinsData("market_cap_asc");
          }

          displayCoins(current_page);
          break;
        case "market_cap_desc":
          current_sort = "market_cap_desc";
          current_page = 1;
          resetPaginationButtons();
          displayCoins(current_page);
          break;
        case "volume_asc":
          current_sort = "volume_asc";
          current_page = 1;
          resetPaginationButtons();

          if (!coinData.volume_asc) {
            coinData.volume_asc = await fetchCoinsData("volume_asc");
          }

          displayCoins(current_page);
          break;
        case "volume_desc":
          current_sort = "volume_desc";
          current_page = 1;
          resetPaginationButtons();

          if (!coinData.volume_desc) {
            coinData.volume_desc = await fetchCoinsData("volume_desc");
          }

          displayCoins(current_page);
          break;
      }
    });
}

/**
 * Resets the state of pagination buttons (previous = hidden, next = visible)
 *
 * This function ensures that the "Next" pagination button is visible and the
 * "Previous" pagination button is hidden. Used when the user switches the sort
 * being applied on the table data.
 */
function resetPaginationButtons() {
  document.querySelector(".pagination-button--next").classList.remove("hidden");
  document
    .querySelector(".pagination-button--previous")
    .classList.add("hidden");
}

async function main() {
  // Get top 100 coins data
  coinData.market_cap_desc = await fetchCoinsData();

  // Dynamically add rows to the table
  createCoinTableRows(10);

  // Render data for first page
  displayCoins(1);

  // Add event listeners for dropdown menu and pagination buttons
  addPaginationButtonEventListeners();
  addSortDropdownEventListeners();
}

main();
