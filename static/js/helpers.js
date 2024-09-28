export const COINGECKO_API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    "x-cg-demo-api-key": COINGECKO_API_KEY,
  },
};

export function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

export function formatFloatToUSD(float, decimals) {
  return float.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatUNIXTimestamp(timestamp) {
  const date = new Date(timestamp * 1000); // Convert to milliseconds

  // Convert to a string in the user's local timezone and return
  return date.toLocaleString();
}

export function scrollToSection(event, sectionId, offset) {
  event.preventDefault(); // Prevent the default jump to anchor behavior

  const target = document.querySelector(sectionId);
  const elementPosition = target.getBoundingClientRect().top + window.scrollY;
  const offsetPosition = elementPosition - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth", // Optional smooth scrolling
  });
}

// //////////////////// GET DICT OF ALL COIN NAMES + SYMBOLS + IDS ////////////////////
export async function getAllCoinNamesDict() {
  const fetchOptions = {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  };

  try {
    const response = await fetch("/get_all_coin_names", fetchOptions);
    const data = await response.json();

    const result = {};

    for (const coin of data) {
      // IMPORTANT: ID = API SPECIFIC ID, TICKERS = NOT UNIQUE, NAMES = UNIQUE
      result[coin.name] = [coin.symbol, coin.id];
    }

    return result;
  } catch (error) {
    console.error(error);
  }
}

// //////////////////// MESSAGE POPUP FUNCTIONS ////////////////////
export function showMessagePopup(text, success) {
  document.querySelector(".message-popup-text").textContent = text;
  document.querySelector(".message-popup").style.display = "block";
  document.querySelector(".message-popup").style.backgroundColor = success
    ? "#17C671"
    : "#EB5757";
}

export function hideMessagePopup() {
  document.querySelector(".message-popup").style.display = "none";
}

export function addMessagePopupCloseEventListener() {
  document
    .querySelector(".message-popup-close-btn")
    .addEventListener("click", hideMessagePopup);
}
