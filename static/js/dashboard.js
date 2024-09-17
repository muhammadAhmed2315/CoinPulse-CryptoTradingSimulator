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

// type can be one of "global" or "own"
// page is 1-indexed

/**
 * Fetches feed posts from the server based on the specified feed type and page number
 *
 * @async
 * @function fetchFeedPosts
 * @param {string} type - The type of feed to fetch ("global" or "own" are the ONLY
 *                        options)
 * @param {number} page - The page number of the feed to fetch (1-indexed)
 * @returns {Promise<void>} - A promise that resolves when the feed posts have been
 *                            fetched and assigned.
 *
 * The function sends a POST request to the "/get_feedposts" endpoint, including the
 * feed type and page number in the request body. If the request is successful, it
 * updates either `globalFeedPosts` or `ownFeedPosts` with the received data. If no
 * data is available, it sets the respective feed to an empty array.
 */
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

/**
 * Renders feed posts on the page based on the specified type ("global" or "own").
 *
 * @function renderFeedPosts
 *
 * This function dynamically generates feed post elements, updates their content based
 * on the transaction data, and appends them to the appropriate feed post container. It
 * also handles the like button animation, toggling, and sends an update request to the
 * server when a post is liked or unliked.
 *
 * @param {string} type - The type of feed to render. Can be either "global" for all
 *                        users' visible posts or "own" for the current user's posts
 *                        (both visible and invisible).
 *
 * Global feed posts are rendered into the ".global-feedposts-container" and own posts
 * into the ".own-feedposts-container".
 *
 * Each feed post includes:
 * - Profile image
 * - Username
 * - Timestamp of the transaction
 * - Order quantity and transaction type (buy or sell)
 * - Coin name and price per unit
 * - Optional comment on the transaction
 * - Like button with current likes count
 *
 * Clicking the like button toggles the "active" state and sends a request to update the like count on the server.
 *
 * @returns {void}
 */

function renderFeedPosts(type) {
  const markup = `
    <div class="feedpost-header">
      <img class="profile-img" src="" />

      <div class="feedpost-header__first">
        <p class="username"></p>
        <p class="timestamp"></p>
      </div>

      <div class="feedpost-header__second">
        <div>
          <p class="order-quantity"></p>
          <p class=coin-id></p>
        </div>

        <div>
          <p class="transaction-type"></p>
          <p>@</p>
          <p class="order-price"></p>
        </div>
      </div>
    </div>

    <div class="feedpost-comment">
      <p></p>
    </div>

    <div class="feedpost-likes">
      <ion-icon name="heart" class="like-btn">
        <div class='red-bg'></div>
      </ion-icon>
      <p class="likes-count"></p>
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

    // //////////////////// Update the feedpost content ////////////////////////
    // Add like button animation
    let icon = div.querySelector(".like-btn");
    icon.addEventListener("click", function () {
      icon.classList.toggle("active");
    });

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

    // Update like button state
    if (currFeedPost.curr_user_liked) {
      div.querySelector(".like-btn").classList.add("active");
    }

    // Update likes count
    div.querySelector(".likes-count").textContent = currFeedPost.likes;

    // //////////////////// Add like button event listeners ////////////////////
    // TODO Add like button event listener
    div.querySelector(".like-btn").addEventListener("click", async function () {
      console.log(`Like button clicked for ${currFeedPost.timestamp}`);
      if (this.classList.contains("active")) {
        const response = (await updateLikeCounter(true, currFeedPost.id))[0];

        if (response.success) {
          div.querySelector(".likes-count").textContent = response.currLikes;
        } else {
          // TODO show error message popup
        }
      } else {
        const response = (await updateLikeCounter(false, currFeedPost.id))[0];

        if (response.success) {
          div.querySelector(".likes-count").textContent = response.currLikes;
        } else {
          // TODO show error message popup
        }
      }
    });
  }
}

/**
 * Updates the like counter for a specific transaction by either incrementing or
 * decrementing it.
 *
 * @async
 * @function updateLikeCounter
 * @param {boolean} isIncrement - Indicates whether to add a like (true) or remove a
 *                                like (false) from the transaction like counter.
 * @param {string} transactionID - The ID of the transaction whose like counter needs
 *                                 to be updated.
 * @returns {Promise<Object>} - A promise that resolves to the response data from the
 *                              server.
 *
 * The function sends a POST request to the "/update_likes" endpoint with the
 * `isIncrement` flag and `transactionID` in the request body. The server is expected
 * to return a JSON object which is then returned by this function.
 *
 * Error handling for unsuccessful responses is currently not implemented. TODO
 */
async function updateLikeCounter(isIncrement, transactionID) {
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      isIncrement: isIncrement,
      transactionID: transactionID,
    }),
  };

  const response = await fetch("/update_likes", fetchOptions);
  const data = await response.json();

  // TODO add error handling for if /update_likes doesn't return a success
  return data;
}

/**
 * Handles the intersection of observed elements and triggers fetching and rendering of
 * new feed posts when the user reaches the end of the page/feed.
 *
 * @function handleIntersect
 * @param {IntersectionObserverEntry[]} entries - An array of IntersectionObserverEntry
 *                                                objects representing the observed
 *                                                elements
 *
 * This function is called when the user has scrolled to the end of the page. When this
 * happens, the function checks the current feed type ("global" or "own"), increments
 * the respective page count, fetches the next page of feed posts of that type, and
 * renders them.
 */
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

/**
 * Sets up an IntersectionObserver to detect when the user has scrolled to the bottom
 * of the page/feed and triggers fetching and rendering more feed posts.
 *
 * @function setupObserver
 *
 * This function creates a new IntersectionObserver that monitors the visibility of an
 * element (in this case, the element with the ID "page-end"). When half of the target
 * element is visible in the viewport (as defined by the threshold of 0.5), the
 * `handleIntersect` function is called to fetch and render additional feed posts.
 *
 * - `root`: Set to `null` to use the viewport as the observing area.
 * - `rootMargin`: No margin (set to "0px").
 * - `threshold`: Triggers the observer when 50% of the target is visible.
 */
function setupObserver() {
  let observer = new IntersectionObserver(handleIntersect, {
    root: null, // observing in viewport
    rootMargin: "0px",
    threshold: 0.5, // trigger when half of the target is visible
  });

  let target = document.getElementById("page-end");
  observer.observe(target);
}

/**
 * Adds event listeners to the "Global feed" and "Own feed" buttons for switching
 * between what feed type is currently visible.
 *
 * @function addFeedMenuButtonEventListeners
 *
 * This function attaches click event listeners to the "Global feed" and "Own feed" #
 * menu buttons. When the user clicks on one of the buttons:
 * - The corresponding feed posts container is displayed.
 * - The other feed posts container is hidden.
 * - The `currFeed` variable is updated to reflect the current feed type ("global" or
 *   "own").
 */
function addFeedMenuButtonEventListeners() {
  const globalFeedBtn = document.querySelector(".feed-header__global-label");
  const ownFeedBtn = document.querySelector(".feed-header__own-label");
  const globalFeedContainer = document.querySelector(
    ".global-feedposts-container"
  );
  const ownFeedContainer = document.querySelector(".own-feedposts-container");

  globalFeedBtn.addEventListener("click", function () {
    console.log("Global feed button clicked");
    // Hide both feedposts sections
    globalFeedContainer.style.display = "flex";
    ownFeedContainer.style.display = "none";

    currFeed = "global";
  });

  ownFeedBtn.addEventListener("click", function () {
    console.log("Own feed button clicked");
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

  addFeedMenuButtonEventListeners();
}

main();
