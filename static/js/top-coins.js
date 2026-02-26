import { formatFloatToUSD } from "./helpers.js";
let current_page = 1;
let current_sort = "market_cap_desc";
let coinData = {
    market_cap_asc: null,
    market_cap_desc: null,
    volume_asc: null,
    volume_desc: null,
};
/**
 * Asynchronously fetches data about the top 100 coins (sorted by a specified
 * parameter). The function sends a POST request with the sorting parameter and returns
 * structured data about each coin, including image, name, symbol, prices, market cap,
 * etc.
 *
 * @async
 * @function fetchCoinsData
 * @param {string} [sortCoinsBy="market_cap_desc"] - The criterion by which the coins
 * data should be sorted ("market_cap_asc" || "market_cap_desc" || "volume_asc" || "volume_desc").
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of objects,
 *          each containing details of a cryptocurrency. If an error occurs, returns an empty array.
 */
async function fetchCoinsData(sortCoinsBy = "market_cap_desc") {
    const fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_coins_by: sortCoinsBy }),
    };
    try {
        const response = await fetch("/get_top_coins_data", fetchOptions);
        const data = await response.json();
        // Extract necessary data from each coin object
        const results = data.map((coin) => {
            let { image, name, symbol, current_price, market_cap, price_change_percentage_1h_in_currency: price_change_1h, price_change_percentage_24h_in_currency: price_change_24h, price_change_percentage_7d_in_currency: price_change_7d, total_volume, sparkline_in_7d, } = coin;
            return {
                image,
                name,
                symbol,
                current_price,
                market_cap,
                price_change_1h,
                price_change_24h,
                price_change_7d,
                total_volume,
                sparkline_in_7d: sparkline_in_7d.price,
            };
        });
        return results;
    }
    catch (error) {
        console.error("Error:", error);
        return [];
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
 * @function createCoinTableRows
 * @param {number} [numRows=10] - The number of table rows to create.
 *                                 Defaults to 10 if not specified.
 */
function createCoinTableRows(numRows = 10) {
    const markup = `
    <td>
      <div class="coin-image-container">
        <img class="coin-image" src="" alt="Coin Image" loading="lazy" />
      </div>
    </td>
    <td class="coin-name"></td>
    <td class="coin-price"></td>
    <td class="coin-market-cap"></td>
    <td class="coin-price-change-1h"></td>
    <td class="coin-price-change-24h"></td>
    <td class="coin-price-change-7d"></td>
    <td class="coin-volume"></td>
    <td class="coin-graph">
      <canvas class="sparkline-canvas"></canvas>
    </td>
  `;
    const tableBody = document.querySelector(".table tbody");
    if (!tableBody)
        return;
    for (let i = 0; i < numRows; i++) {
        const coinTableDataRow = document.createElement("tr");
        coinTableDataRow.classList.add("table-row");
        coinTableDataRow.innerHTML = markup;
        tableBody.appendChild(coinTableDataRow);
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
 * @function displayCoins
 * @param {number} pageNum - The page number to display (1-indexed)
 */
function displayCoins(pageNum) {
    const tableRows = document.querySelectorAll(".table-row");
    const sortedData = coinData[current_sort];
    if (!sortedData)
        return;
    const dataToShow = sortedData.slice((pageNum - 1) * 10, pageNum * 10);
    for (const [i, row] of Array.from(tableRows).entries()) {
        const coin = dataToShow[i];
        if (!coin)
            continue;
        // Update image
        row.querySelector(".coin-image")?.setAttribute("src", coin.image);
        row.querySelector(".coin-image")?.setAttribute("alt", coin.name + " Logo");
        // Update coin name + symbol
        row.querySelector(".coin-name").textContent =
            `${coin.name} (${coin.symbol})`;
        // Update coin (current) price
        const currPrice = coin.current_price;
        row.querySelector(".coin-price").textContent = currPrice
            ? `$${formatFloatToUSD(currPrice, 2)}`
            : "N/A";
        // Update coin market cap
        const marketCap = coin.market_cap;
        row.querySelector(".coin-market-cap").textContent = marketCap
            ? `$${formatFloatToUSD(marketCap, 2)}`
            : "N/A";
        // Update coin 1h price change
        const priceChange1h = coin.price_change_1h;
        const priceChange1hElem = row.querySelector(".coin-price-change-1h");
        if (priceChange1hElem) {
            if (priceChange1h) {
                priceChange1hElem.textContent = priceChange1h >= 0 ? "+" : "";
                priceChange1hElem.textContent += `${priceChange1h.toFixed(4)}%`;
                priceChange1hElem.style.color =
                    priceChange1h >= 0 ? "#17C671" : "#EB5757";
            }
            else {
                priceChange1hElem.textContent = "N/A";
            }
        }
        // Update coin 24h price change
        const priceChange24h = coin.price_change_24h;
        const priceChange24hElem = row.querySelector(".coin-price-change-24h");
        if (priceChange24hElem) {
            if (priceChange24h) {
                priceChange24hElem.textContent = priceChange24h >= 0 ? "+" : "";
                priceChange24hElem.textContent += `${priceChange24h.toFixed(4)}%`;
                priceChange24hElem.style.color =
                    priceChange24h >= 0 ? "#17C671" : "#EB5757";
            }
            else {
                priceChange24hElem.textContent = "N/A";
            }
        }
        // Update coin 7d price change
        const priceChange7d = coin.price_change_7d;
        const priceChange7dElem = row.querySelector(".coin-price-change-7d");
        if (priceChange7dElem) {
            if (priceChange7d) {
                priceChange7dElem.textContent = priceChange7d >= 0 ? "+" : "";
                priceChange7dElem.textContent += `${priceChange7d.toFixed(4)}%`;
                priceChange7dElem.style.color =
                    priceChange7d >= 0 ? "#17C671" : "#EB5757";
            }
            else {
                priceChange7dElem.textContent = "N/A";
            }
        }
        // Update coin total volume
        const totalVolume = coin.total_volume;
        row.querySelector(".coin-volume").textContent = totalVolume
            ? `$${formatFloatToUSD(totalVolume, 2)}`
            : "N/A";
        // Update coin price graph (7 days)
        const sparklineData = coin.sparkline_in_7d;
        if (sparklineData.length > 0) {
            row.querySelector(".coin-graph").innerHTML =
                '<canvas class="sparkline-canvas"></canvas>';
            drawSparkline(sparklineData, row.querySelector(".sparkline-canvas"));
        }
        else {
            row.querySelector(".coin-graph").innerHTML = "<p>N/A</p>";
            row.querySelector(".coin-graph p").classList.add("coin-image-na-label");
        }
    }
}
/**
 * Draws a sparkline graph on a specified canvas element based on provided data points.
 * The function first clears any previous drawings, checks if data is available,
 * sets the stroke color based on the trend of data (green for upward, red for downward),
 * and then plots each point on the canvas by mapping data values to canvas coordinates.
 *
 * @function drawSparkline
 * @param {Array<number>} data - The array of numerical values to plot as a sparkline.
 * @param {HTMLCanvasElement} canvas - The canvas element on which the sparkline will be drawn.
 */
function drawSparkline(data, canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx)
        return;
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!data || data.length === 0) {
        ctx.fillText("N/A", canvas.width / 2, canvas.height / 2);
        return;
    }
    // Set up the drawing style
    if (data.length === 0)
        return;
    if (data[0] > data[data.length - 1]) {
        ctx.strokeStyle = "#EB5757"; // Line color
    }
    else {
        ctx.strokeStyle = "#17C671"; // Line color
    }
    ctx.lineWidth = 3;
    // Determine the scale of the graph
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal || 1; // Prevent division by zero (in case all data points are the same)
    // Function to map data points to canvas coordinates
    const scaleX = canvas.width / (data.length - 1 || 1); // Prevent division by zero (in case of empty data)
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
 *
 * @function addPaginationButtonEventListeners
 */
function addPaginationButtonEventListeners() {
    const tableButtonNext = document.querySelector(".pagination-button--next");
    const tableButtonPrevious = document.querySelector(".pagination-button--previous");
    if (!tableButtonNext || !tableButtonPrevious)
        return;
    // Next pagination button event listener
    tableButtonNext.addEventListener("click", function () {
        if (current_page < 10) {
            current_page += 1;
            displayCoins(current_page);
            tableButtonNext.classList.toggle("hidden", current_page == 10);
            tableButtonPrevious.classList.toggle("hidden", current_page == 1);
        }
    });
    // Previous pagination button event listener
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
 *
 * @function addSortDropdownEventListeners
 */
function addSortDropdownEventListeners() {
    const sortDropdown = document.querySelector(".sort-dropdown-menu");
    if (!sortDropdown)
        return;
    sortDropdown.addEventListener("change", async function (event) {
        const selectedValue = event.target?.value ?? null;
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
 *
 * @function resetPaginationButtons
 */
function resetPaginationButtons() {
    const prevBtn = document.querySelector(".pagination-button--previous");
    const nextBtn = document.querySelector(".pagination-button--next");
    if (prevBtn && nextBtn) {
        nextBtn.classList.remove("hidden");
        prevBtn.classList.add("hidden");
    }
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
