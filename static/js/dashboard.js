import {
  COINGECKO_API_OPTIONS,
  showMessagePopup,
  hideMessagePopup,
  toTitleCase,
  addMessagePopupCloseEventListener,
} from "../js/helpers.js";

let globalFeedPosts = [];
let ownFeedPosts = [];
let globalPageCount = 1;
let ownPageCount = 0;
let currFeed = "global";

function addLikeButtonAnimation() {
  let icon = document.querySelector(".like-btn");
  icon.onclick = function () {
    icon.classList.toggle("active");
  };
}

// type can be one of "global" or "own"
// page is 1-indexed
async function fetchFeedPosts(type, page) {
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: type, page: page }),
  };

  const response = await fetch("/get_feedposts", fetchOptions);
  const data = await response.json();

  if (type == "global") {
    // If successful response
    if (data.success) {
      // If there are feedposts to show
      if (data.data) {
        globalFeedPosts = data.data;
      } else {
        // If there are no feedposts to show
        globalFeedPosts = [];
      }
    }
  } else if (type == "own") {
    // If successful response
    if (data.success) {
      // If there are feedposts to show
      if (data.data) {
        ownFeedPosts = data.data;
      } else {
        // If there are no feedposts to show
        ownFeedPosts = [];
      }
    }
  }
}

function renderFeedPosts(type) {
  const markup = `
    <div class="feedpost-header">
      <img class="profile-img" src="../../static/img/profileLetters/J.png" />

      <div class="feedpost-header__first">
        <p class="username">JohnDoe2024</p>
        <p class="timestamp">41 minutes ago</p>
      </div>

      <div class="feedpost-header__second">
        <div>
          <p class="order-quantity">+0.0010</p>
          <p class=coin-id>Bitcoin</p>
        </div>

        <div>
          <p class="transaction-type">Bought</p>
          <p>@</p>
          <p class="order-price">$56,891.00</p>
        </div>
      </div>
    </div>

    <div class="feedpost-comment">
      <p>This trade has no description</p>
    </div>

    <div class="feedpost-likes">
      <ion-icon name="heart" class="like-btn">
        <div class='red-bg'></div>
      </ion-icon>
      <p class="likes-count">0</p>
      <p>Likes</p>
    </div>
  `;

  let currFeedPosts = [];

  if (type === "global") {
    currFeedPosts = globalFeedPosts;
  } else if (type == "own") {
    currFeedPosts = ownFeedPosts;
  }

  for (let i = 0; i < currFeedPosts.length; i++) {
    // Create a new div element
    const div = document.createElement("div");
    div.classList.add("feedpost");
    div.innerHTML = markup;
    const currFeedPost = currFeedPosts[i];

    if (type == "global") {
      document.querySelector(".global-feedposts-container").appendChild(div);
    } else if (type == "own") {
      document.querySelector(".own-feedposts-container").appendChild(div);
    }

    // Update the feedpost content
    // Update profile image
    div.querySelector(
      ".profile-img"
    ).src = `../../static/img/profileLetters/${currFeedPost.username[0]}.png`;

    // Update username
    div.querySelector(".username").textContent = currFeedPost.username;

    // Update timestamp
    div.querySelector(".timestamp").textContent = currFeedPost.timestamp;

    // Update order quantity
    if (currFeedPost.transaction_type === "buy") {
      div.querySelector(".order-quantity").textContent =
        "+" + currFeedPost.quantity.toFixed(4);
      div.querySelector(".order-quantity").style.color = "#17c671";
    } else {
      div.querySelector(".order-quantity").textContent =
        "-" + currFeedPost.quantity.toFixed(4);
      div.querySelector(".order-quantity").style.color = "#EB5757";
    }

    // Update coin name
    div.querySelector(".coin-id").textContent = toTitleCase(
      currFeedPost.coin_id
    );

    // Update transaction type (buy or sell)
    if (currFeedPost.transaction_type === "buy") {
      div.querySelector(".transaction-type").textContent = "Buy";
    } else if (currFeedPost.transaction_type === "sell") {
      div.querySelector(".transaction-type").textContent = "Sell";
    }

    // Update transaction price
    div.querySelector(".order-price").textContent =
      "$" + currFeedPost.price_per_unit.toLocaleString();

    // Update transaction comment
    if (currFeedPost.comment) {
      div.querySelector(".feedpost-comment p").textContent =
        currFeedPost.comment;
      div.querySelector(".feedpost-comment p").style.fontSize = "2.6rem";
      div.querySelector(".feedpost-comment p").style.color = "#000000";
    } else {
      div.querySelector(".feedpost-comment p").textContent =
        "This trade has no description";
    }

    // Update likes count
    div.querySelector(".likes-count").textContent = currFeedPost.likes;

    // TODO Add like button event listener
  }
}

function handleIntersect(entries) {
  entries.forEach(async (entry) => {
    if (entry.isIntersecting) {
      if (currFeed == "global") {
        globalPageCount++;
        await fetchFeedPosts("global", globalPageCount);
        renderFeedPosts("global");
      } else if (currFeed == "own") {
        ownPageCount++;
        await fetchFeedPosts("own", ownPageCount);
        renderFeedPosts("own");
      }
    }
  });
}

// Setting up the Intersection Observer
function setupObserver() {
  let observer = new IntersectionObserver(handleIntersect, {
    root: null, // observing in viewport
    rootMargin: "0px",
    threshold: 0.5, // trigger when half of the target is visible
  });

  let target = document.getElementById("page-end");
  observer.observe(target);
}

function addFeedMenuButtonEventListeners() {
  const globalFeedBtn = document.querySelector(".feed-header__global-label");
  const ownFeedBtn = document.querySelector(".feed-header__own-label");
  const globalFeedContainer = document.querySelector(
    ".global-feedposts-container"
  );
  const ownFeedContainer = document.querySelector(".own-feedposts-container");

  globalFeedBtn.addEventListener("click", function () {
    // Hide both feedposts sections
    globalFeedContainer.style.display = "flex";
    ownFeedContainer.style.display = "none";

    currFeed = "global";
  });

  ownFeedBtn.addEventListener("click", function () {
    ownFeedContainer.style.display = "flex";
    globalFeedContainer.style.display = "none";

    currFeed = "own";
  });
}

async function main() {
  addMessagePopupCloseEventListener();
  await fetchFeedPosts("global", 1);

  renderFeedPosts("global");
  setupObserver();

  if (globalFeedPosts.length > 0) {
    addLikeButtonAnimation();
  }

  addFeedMenuButtonEventListeners();
}

main();
