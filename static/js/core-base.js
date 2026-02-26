"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPortfolioBalance = fetchPortfolioBalance;
exports.getAndRenderPortfolioTotalValue = getAndRenderPortfolioTotalValue;
var helpers_js_1 = require("../js/helpers.js");
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
function fetchPortfolioBalance() {
    return __awaiter(this, void 0, void 0, function () {
        var fetchOptions, response, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fetchOptions = {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    };
                    return [4 /*yield*/, fetch("/get_wallet_usd_balance", fetchOptions)];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        // Handle HTTP errors
                        throw new Error("HTTP error! Status: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    if ("success" in data) {
                        return [2 /*return*/, data.data];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Fetches the current total value of the user's wallet.
 *
 * This function makes an HTTP GET request to the server endpoint
 * `/get_wallet_total_current_value` to retrieve the total current value of the
 * user's wallet, which includes the combined value of all assets and cash in USD. It
 * handles the HTTP response, checks for errors, and parses the JSON data. If the
 * data retrieval is successful, it returns the total value, otherwise, it throws an
 * error with the HTTP status.
 *
 * @returns {Promise<number>} A promise that resolves with the current total value of
 *                            the wallet if the fetch operation is successful.
 * @throws {Error} Throws an error with the status code if the HTTP request fails.
 */
function fetchPortfolioTotalValue() {
    return __awaiter(this, void 0, void 0, function () {
        var fetchOptions, response, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fetchOptions = {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    };
                    return [4 /*yield*/, fetch("/get_wallet_total_current_value", fetchOptions)];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        // Handle HTTP errors
                        throw new Error("HTTP error! Status: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    if ("success" in data) {
                        return [2 /*return*/, data.data];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Updates the DOM element displaying the total value of the portfolio.
 *
 * @param {number} currentPortfolioTotalValue - The current total value of the
 *                                              portfolio to be displayed.
 */
function updatePortfolioTotalValueElement(currentPortfolioTotalValue) {
    var portfolioTotalValueElement = document.querySelector(".portfolio-container__total-value");
    portfolioTotalValueElement.textContent =
        "$" + (0, helpers_js_1.formatFloatToUSD)(currentPortfolioTotalValue, 2);
}
/**
 * Retrieves and displays the current total value of the user's portfolio.
 *
 * This function asynchronously fetches the current total value of the portfolio by
 * calling `fetchPortfolioTotalValue` and then updates the corresponding DOM element
 * with this value by calling `updatePortfolioTotalValueElement`.
 */
function getAndRenderPortfolioTotalValue() {
    return __awaiter(this, void 0, void 0, function () {
        var currentPortfolioTotalValue;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchPortfolioTotalValue()];
                case 1:
                    currentPortfolioTotalValue = _a.sent();
                    if (currentPortfolioTotalValue)
                        updatePortfolioTotalValueElement(currentPortfolioTotalValue);
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Renders the user's profile image based on the first letter of their username.
 */
function renderProfileImage() {
    var username = document
        .querySelector(".profile-username")
        .textContent.slice(0, 1)
        .toUpperCase();
    document.querySelector(".profile-img").src =
        "../../static/img/profileLetters/".concat(username, ".png");
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Renders profile image at the right hand side of the navbar
                    renderProfileImage();
                    // Fetches and renders the total value of the user's portfolio (cash + assets) at the
                    // left of the navbar
                    return [4 /*yield*/, getAndRenderPortfolioTotalValue()];
                case 1:
                    // Fetches and renders the total value of the user's portfolio (cash + assets) at the
                    // left of the navbar
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main();
