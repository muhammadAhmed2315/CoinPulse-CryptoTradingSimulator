export const COINGECKO_API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    "x-cg-demo-api-key": COINGECKO_API_KEY,
  },
};

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
