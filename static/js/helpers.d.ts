/**
 * Converts each word in a string to title case, where the first letter is capitalized
 * and the rest are lower case.
 *
 * @function toTitleCase
 * @param {string} str - The string to be converted to title case.
 * @returns {string} The converted title case string.
 */
export declare function toTitleCase(str: string): string;
/**
 * Formats a floating-point number into a US currency string, with a specified number
 * of decimal places.
 *
 * @function formatFloatToUSD
 * @param {number} float - The number to format.
 * @param {number} decimals - The number of decimal places to use.
 * @returns {string} The formatted string in US dollar currency.
 */
export declare function formatFloatToUSD(float: number, decimals: number): string;
/**
 * Converts a UNIX timestamp into a localized date and time string.
 *
 * @function formatUNIXTimestamp
 * @param {number} timestamp - The UNIX timestamp to convert.
 * @returns {string} A localized date and time string.
 */
export declare function formatUNIXTimestamp(timestamp: number): string;
/**
 * Adds functionality to smoothly scroll to a specific section of the page.
 *
 * @function scrollToSection
 * @param {Event} event - The event object from a click or similar event.
 * @param {string} sectionId - The CSS selector ID of the section to scroll to.
 * @param {number} offset - The offset from the top of the section to accommodate fixed
 *                          headers or other elements.
 */
export declare function scrollToSection(event: Event, sectionId: string, offset: number): void;
/**
 * Asynchronously retrieves all coin names from the CoinGecko API and organizes them
 * into a dictionary. Each key in the resulting dictionary is a unique coin name,
 * associated with an array containing the coin's symbol and its API-specific ID.
 *
 * @function getAllCoinNamesDict
 * @returns {Promise<Object>} A promise that resolves to an object where keys are coin
 * names and values are arrays of [symbol, API-specific ID]. If an error occurs during
 * fetch, logs the error to the console.
 */
export declare function getAllCoinNamesDict(): Promise<{} | undefined>;
/**
 * Displays a message popup with customizable text and background color based on
 * success or failure.
 *
 * @function showMessagePopup
 * @param {string} text - The message text to display.
 * @param {boolean} success - A boolean that determines the background color of the popup; green if true, red if false.
 */
export declare function showMessagePopup(text: string, success: boolean): void;
/**
 * Hides the message popup.
 *
 * @function hideMessagePopup
 */
export declare function hideMessagePopup(): void;
/**
 * Adds an event listener to the close button of the message popup to hide the popup
 * when the message popup close button is clicked.
 *
 * @function addMessagePopupCloseEventListener
 */
export declare function addMessagePopupCloseEventListener(): void;
//# sourceMappingURL=helpers.d.ts.map