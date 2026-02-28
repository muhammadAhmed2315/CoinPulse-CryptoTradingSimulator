/**
 * Fetches the current USD balance from the user's wallet.
 *
 * This function makes an HTTP GET request to the server endpoint
 * `/get_wallet_usd_balance` to retrieve the latest wallet balance in USD. It handles
 * the HTTP response, checks for errors, and parses the JSON data. If the data
 * retrieval is successful, it returns the balance, otherwise, it throws an error
 * with the HTTP status.
 *
 * @returns {Promise<number>} A promise that resolves with the current USD balance if
 *                            the fetch operation is successful.
 * @throws {Error} Throws an error with the status code if the HTTP request fails.
 */
export declare function fetchPortfolioBalance(): Promise<number | undefined>;
/**
 * Retrieves and displays the current total value of the user's portfolio.
 *
 * This function asynchronously fetches the current total value of the portfolio by
 * calling `fetchPortfolioTotalValue` and then updates the corresponding DOM element
 * with this value by calling `updatePortfolioTotalValueElement`.
 */
export declare function getAndRenderPortfolioTotalValue(): Promise<void>;
//# sourceMappingURL=core-base.d.ts.map