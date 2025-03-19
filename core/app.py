import requests
import time
import time
from flask import (
    render_template,
    request,
    Blueprint,
    jsonify,
    session,
    redirect,
    url_for,
)
from flask_login import current_user, login_required, logout_user
from models import User, Wallet, Transaction, TransactionLikes
from constants import (
    COINGECKO_API_KEY,
    COINGECKO_API_HEADERS,
    OPEN_TRADE_UPDATE_INTERVAL_SECONDS,
    WALLET_VALUE_UPDATE_INTERVAL_SECONDS,
)
from extensions import db
import time
from YahooNewsScraper.YahooNewsScraper import YahooNewsScaper
from RedditScraper.RedditScraper import RedditScraper
from datetime import datetime
from sqlalchemy import or_, and_

core = Blueprint("core", __name__)


@core.route("/dashboard")
@login_required
def dashboard():
    """
    Route to display the dashboard page for logged-in users.

    Returns:
        A rendered HTML template for the dashboard page, with the COINGECKO_API_KEY
        available for use in the template.
    """
    # If user isn't verified and doesn't have a provider, log them out and redirect
    # them to the login page
    if not current_user.verified and not current_user.provider:
        logout_user()
        return redirect(url_for("user_authentication.login"))

    # Else, render the dashboard page
    return render_template(
        "core/dashboard.html",
        COINGECKO_API_KEY=COINGECKO_API_KEY,
    )


@core.route("/top_coins")
@login_required
def top_coins():
    """
    Route to display the top 100 coins available on the market (default = market cap
    descending).

    User can view the 100 top coins and information about them, sorted by market cap
    ascending and descending, andvolume ascending and descending. Coins are shown in a
    pagination component, with 10 coins per page.

    Returns:
        A rendered HTML template for the top coins page, with the COINGECKO_API_KEY
        available for use in the template.
    """
    return render_template(
        "core/top-coins.html",
        COINGECKO_API_KEY=COINGECKO_API_KEY,
    )


@core.route("/my_trades")
@login_required
def my_trades():
    """
    Route to display the user's trade history page.


    Since the CoinGecko API only updates coin prices every 45 seconds, this function
    only triggers a background update of the user's wallet ValueHistory attribute if
    the user has not visited the page within the last 45 seconds. If it has been more
    than 45 seconds since the user's last visit, it triggers a background update of the
    user's wallet ValueHistory attribute using the CoinGecko API. The last visit
    timestamp is stored in the session and updated upon each visit.

    Returns:
        A rendered template of the "my-trades.html" page with the necessary context,
        including the CoinGecko API key for front-end API calls.
    """
    # Since the CoinGecko API only updates coin prices every 45 seconds, only call the
    # update wallet history function if this page was accessed 45 seconds or more ago
    last_visit = session.get("my_trades_last_visited")
    if last_visit is not None:
        if int(time.time()) - last_visit >= 45:
            update_user_wallet_value_in_background(current_user.wallet.id)
    session["my_trades_last_visited"] = int(time.time())

    return render_template(
        "core/my-trades.html",
        COINGECKO_API_KEY=COINGECKO_API_KEY,
    )


@core.route("/get_trades_info", methods=["POST"])
@login_required
def get_trades_info():
    """
    Fetches the transaction history for the currently logged-in user and returns (as a
    JSON response) a paginated list of transactions sorted according to the specified
    criteria.

    Each page contains up to 25 transactions, and if a user has no transactions an
    empty list is returned. The response also includes the total number of pages based
    on the number of transactions.

    The possible types of sorts are specified in the sort_transactions() function.

    Args:
        None. Expects JSON data in the request body with the following keys:
        - page (int): The page number of the transactions to fetch.
        - sort (str): The sorting criteria for the transactions.

    Returns:
        Response (JSON): A JSON object containing:
        - success (str): A message indicating the success of the operation.
        - data (list): A list of transaction details, or an empty list if no
                       transactions exist for the current user.
        - maxPages (int): The total number of pages for pagination.

    Raises:
        KeyError: If the 'page' or 'sort' keys are not found in the request data.
    """
    data = request.get_json()
    page = data["page"]
    sort = data["sort"]

    transactions = current_user.wallet.transactions

    # If the user has transactions, sort them based on the specified criteria and
    # paginate the results
    if transactions:
        transactions = sort_transactions(transactions, sort)
        maxPages = (len(transactions) // 25) + 1
        transactions = transactions[(page - 1) * 25 : page * 25]

        res = []

        # Extract the necessary data from each transaction
        for transaction in transactions:
            temp = {}
            temp["orderType"] = transaction.orderType
            temp["transactionType"] = transaction.transactionType
            temp["id"] = transaction.id
            temp["timestamp"] = transaction.timestamp
            temp["coin_id"] = transaction.coin_id
            temp["quantity"] = transaction.quantity
            temp["price_per_unit"] = transaction.price_per_unit
            temp["comment"] = transaction.comment
            temp["status"] = transaction.status
            temp["price_at_execution"] = transaction.price_per_unit_at_execution
            res.append(temp)

        return (
            jsonify(
                {
                    "success": "Transaction history successfully fetched",
                    "data": res,
                    "maxPages": maxPages,
                }
            ),
            200,
        )
    else:
        return jsonify(
            {
                "success": "Transaction history successfully fetched",
                "data": [],
                "maxPages": 0,
            },
            200,
        )


def sort_transactions(transactions, sort="timestamp_desc"):
    """
    Sorts a list of transactions based on the specified sorting criteria.

    This function takes a list of transactions and sorts them according to the provided
    `sort` argument. The sorting can be done on various transaction fields, such as
    order type, transaction type, coin ID, quantity, price per unit, total value, and
    timestamp. If no sorting argument is provided, it defaults to sorting by timestamp
    in descending order.

    Args:
        transactions (list): A list of transaction objects to be sorted.
        sort (str, optional): A string that specifies the sorting criteria.

    Returns:
        list: A sorted list of transactions based on the specified criteria.
    """
    match sort:
        case "order_type_asc":
            return sorted(transactions, key=lambda trnsctn: trnsctn.orderType)
        case "order_type_desc":
            return sorted(
                transactions, key=lambda trnsctn: trnsctn.orderType, reverse=True
            )
        case "transaction_type_asc":
            return sorted(transactions, key=lambda trnsctn: trnsctn.transactionType)
        case "transaction_type_desc":
            return sorted(
                transactions, key=lambda trnsctn: trnsctn.transactionType, reverse=True
            )
        case "coin_asc":
            return sorted(transactions, key=lambda trnsctn: trnsctn.coin_id)
        case "coin_desc":
            return sorted(
                transactions, key=lambda trnsctn: trnsctn.coin_id, reverse=True
            )
        case "quantity_asc":
            return sorted(transactions, key=lambda trnsctn: trnsctn.quantity)
        case "quantity_desc":
            return sorted(
                transactions, key=lambda trnsctn: trnsctn.quantity, reverse=True
            )
        case "price_asc":
            return sorted(transactions, key=lambda trnsctn: trnsctn.price_per_unit)
        case "price_desc":
            return sorted(
                transactions, key=lambda trnsctn: trnsctn.price_per_unit, reverse=True
            )
        case "timestamp_asc":
            return sorted(transactions, key=lambda trnsctn: trnsctn.timestamp)
        case "timestamp_desc":
            return sorted(
                transactions, key=lambda trnsctn: trnsctn.timestamp, reverse=True
            )
        case "status_asc":
            return sorted(transactions, key=lambda trnsctn: trnsctn.status)
        case "status_desc":
            return sorted(
                transactions, key=lambda trnsctn: trnsctn.status, reverse=True
            )
        case "price_at_execution_asc":
            return sorted(
                transactions, key=lambda trnsctn: trnsctn.price_per_unit_at_execution
            )
        case "price_at_execution_desc":
            return sorted(
                transactions,
                key=lambda trnsctn: trnsctn.price_per_unit_at_execution,
                reverse=True,
            )


@core.route("/get_feedposts", methods=["POST"])
@login_required
def get_feedposts():
    """
    Fetches and returns a list of feed posts (transactions) based on the specified type
    and pagination.

    This function retrieves the information about the globally visible transactions or
    transactions specific to the current user (based on the input type). The
    transactions are sorted by their timestamp in descending order to ensure the most
    recent transactions are shown first.

    Args:
        None directly. Expects a JSON payload in the request containing:
            type (str): Can be 'global' = fetch transactions visible to all users or
                        'own' = fetch transactions specific to the current user.
            page (int): The page number for pagination purposes, used to calculate the
                        slice of transactions to return (1-indexed).

    Returns:
        A JSON response containing:
            - 'success': A message indicating the status of the request.
            - 'data': A list of dictionaries, each representing a transaction with
                      details such as transaction ID, username, timestamp, number of
                      likes, coin ID, quantity, price per unit, transaction type, and
                      order type. Additional visibility status is included for 'own'
                      type.
    """
    data = request.get_json()
    type = data["type"]
    page = data["page"]

    if type == "global":
        # Get transactions from the database that have public (true) visibility, and
        # then order by most recent first (timestamp descending)
        transactions = (
            Transaction.query.filter_by(visibility=True)
            .order_by(Transaction.timestamp.desc())
            .all()
        )
    elif type == "own":
        # Get transactions from the database that belong to the current user,
        # regardless of their visibility
        transactions = (
            Transaction.query.filter_by(wallet_id=current_user.wallet.id)
            .order_by(Transaction.timestamp.desc())
            .all()
        )

    res = []

    # Extract the necessary data from each transaction
    for transaction in transactions:
        temp = {}

        temp["id"] = transaction.id
        temp["username"] = transaction.wallet.owner.username
        temp["timestamp"] = transaction.timestamp
        temp["comment"] = transaction.comment
        temp["likes"] = transaction.get_number_of_likes()
        temp["coin_id"] = transaction.coin_id
        temp["quantity"] = transaction.quantity
        temp["price_per_unit"] = transaction.price_per_unit
        temp["transaction_type"] = transaction.transactionType
        temp["order_type"] = transaction.orderType
        if type == "own":
            temp["visibility"] = transaction.visibility

        # Has user liked the current transaction
        if current_user.id in transaction.likes.liked_by_user_ids:
            temp["curr_user_liked"] = True
        else:
            temp["curr_user_liked"] = False

        res.append(temp)

    # Paginate the results
    res = res[(page - 1) * 10 : page * 10]

    if res:
        return jsonify({"success": "Feedposts successfully fetched", "data": res}), 200
    else:
        return jsonify({"success": "No feedposts to show"}), 200


@core.route("/update_likes", methods=["POST"])
@login_required
def update_likes():
    """
    Updates the like count for a specific transaction.

    Given a transaction ID and a boolean flag indicating whether to add or remove a
    like from the transaction, the function adds or removes the current user from the
    transaction's TransactionLikes.liked_by_user_ids list.
    """
    data = request.get_json()
    is_increment = data["isIncrement"]
    transaction_id = data["transactionID"]

    # Get the transaction object from the database
    transaction = Transaction.query.get(transaction_id)

    # Increment or decrement the number of likes for the transaction
    if is_increment:
        transaction.add_like(current_user.id)
    else:
        transaction.remove_like(current_user.id)

    # Save the updated transaction to the database
    db.session.add(transaction)
    db.session.add(transaction.likes)
    db.session.commit()

    return jsonify(
        {
            "success": "Like count successfully updated",
            "currLikes": transaction.get_number_of_likes(),
        },
        200,
    )


@core.route("/process_transaction", methods=["POST"])
@login_required
def process_transaction():
    """
    Processes a cryptocurrency transaction submitted via a POST request containing JSON
    data.

    The function validates the input JSON for necessary fields and constraints, such as
    ensuring positive quantities and sufficient balances to complete buy or sell
    orders. It handles different transaction types and order types accordingly.

    If the transaction is valid:
    - It updates the user's wallet balance and assets based on the transaction type and
      order type.
    - It records the transaction in the database along with a new TransactionLikes
      object to track likes.
    - It invokes a background task to update the wallet value if necessary.

    Returns:
        JSON response: A JSON object indicating the success or failure of the
                       transaction. On success, returns HTTP 201. On failure due to
                       client errors (e.g., missing data, insufficient funds), returns
                       HTTP 400. On failure due to server errors (e.g., database
                       issues), returns HTTP 500.

    Raises:
        HTTPException: If the input JSON is missing or incorrectly formatted, or if any
                       data constraints are violated, the function will raise an HTTP
                       exception with an appropriate status code and error message.
    """
    # Ensure request contains necessary JSON data
    if not request.json or "transactionData" not in request.json:
        return jsonify({"error": "Missing transaction data"}), 400

    data = request.json["transactionData"]

    # Check data contains all required fields
    required_fields = {
        "transactionType": False,
        "orderType": False,
        "quantity": False,
        "coin_id": False,
        "comment": False,
        "price_per_unit": False,
        "visibility": False,
    }

    for key in data:
        if key in required_fields:
            required_fields[key] = True

    errors = []
    for key in required_fields:
        if not required_fields[key]:
            errors.append(key)
    errors = ", ".join(errors)

    if any(field not in data for field in required_fields):
        return jsonify({"error": "Missing fields: " + errors}), 400

    # Make sure user did not enter a negative quantity
    if data["quantity"] <= 0:
        return (
            jsonify(
                {
                    "error": "Transaction Failed: Quantity must be greater than 0. Please check your input and try again."
                }
            ),
            400,
        )

    # Make sure user has enough balance (USD) to execute a buy order of any type
    if data["transactionType"] == "buy":
        if not current_user.wallet.has_enough_balance(
            data["quantity"] * data["price_per_unit"]
        ):
            return (
                jsonify(
                    {
                        "error": "Transaction Failed: Insufficient USD balance to complete the buy transaction. Please check your portfolio and try again."
                    }
                ),
                400,
            )
    # Make sure user is not selling more coins than they own for any type of sell order
    elif data["transactionType"] == "sell":
        if not current_user.wallet.has_enough_coins(data["coin_id"], data["quantity"]):
            return (
                jsonify(
                    {
                        "error": "Transaction Failed: Insufficient crypto balance to complete the sale transaction. Please check your portfolio and try again."
                    }
                ),
                400,
            )

    # Get status value
    status = "finished" if data["orderType"] == "market" else "open"

    # Save the transaction in the database
    transaction = Transaction(
        status=status,
        transactionType=data["transactionType"],
        orderType=data["orderType"],
        coin_id=data["coin_id"],
        quantity=data["quantity"],
        price_per_unit=data["price_per_unit"],
        wallet_id=current_user.wallet.id,
        comment=data["comment"],
        balance_before=current_user.wallet.balance,
        visibility=data["visibility"],
    )

    try:
        user_wallet = current_user.wallet
        if transaction.orderType == "market" and transaction.transactionType == "buy":
            # Update wallet balance
            user_wallet.update_balance_subtract(
                transaction.quantity * transaction.price_per_unit
            )

            # Update wallet assets dictionary
            user_wallet.update_assets_add(transaction.coin_id, transaction.quantity)
        elif (
            transaction.orderType == "market" and transaction.transactionType == "sell"
        ):
            # Update wallet balance
            user_wallet.update_balance_add(
                transaction.quantity * transaction.price_per_unit
            )

            # Update wallet assets dictionary
            user_wallet.update_assets_subtract(
                transaction.coin_id, transaction.quantity
            )

        # Add transaction and update user_wallet in the database
        db.session.add(transaction)
        db.session.add(user_wallet)
        db.session.commit()

        # Create a TransactionLikes object for the transaction
        transaction_likes = TransactionLikes(transaction_id=transaction.id)
        db.session.add(transaction_likes)
        db.session.commit()

        update_user_wallet_value_in_background(user_wallet.id)

        return jsonify({"success": "Transaction processed successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return (
            jsonify({"error": f"Failed to process transaction. Reason: {str(e)}"}),
            500,
        )


@core.route("/get_wallet_history", methods=["POST"])
@login_required
def get_wallet_history():
    """
    Retrieves the wallet value history for the currently logged-in user.

    This function, upon a successful request, returns a JSON response containing the
    wallet value history, including balance, assets value, total value, and timestamps.

    If the wallet value history could not be fetched from the database for any reason,
    the function returns an error JSON response.

    Raises:
        Exception: If any error occurs during the retrieval process.
    """
    try:
        wallet_history = current_user.wallet.value_history

        res = {
            "balance_history": wallet_history.balance_history,
            "assets_value_history": wallet_history.assets_value_history,
            "total_value_history": wallet_history.total_value_history,
            "timestamps": wallet_history.timestamps,
        }
        return jsonify({"success": "Data successfully retrieved", "data": res}), 200
    except Exception as e:
        return (
            jsonify(
                {
                    "error": "An error occurred while retrieving the wallet history from the database"
                }
            ),
            500,
        )


@core.route("/get_wallet_total_current_value", methods=["GET"])
@login_required
def get_wallet_total_current_value():
    """
    Retrieves the current total value of the current user's wallet (i.e., returns
    wallet.get_wallet_total_current_value, which represents the total value of all
    coins the user owns, plus their balance in USD).

    This function, upon a successful request, returns a JSON response containing the
    wallet total current value.

    If the wallet value history could not be fetched from the database for any reason,
    the function returns an error JSON response.

    Raises:
        Exception: If any error occurs during the retrieval process.
    """
    # Since the CoinGecko API only updates coin prices every 45 seconds, only call the
    # update wallet history function if this page was accessed 45 seconds or more ago
    last_visit = session.get("get_wallet_total_current_value_last_visited")
    if last_visit is not None:
        if int(time.time()) - last_visit >= 45:
            update_user_wallet_value_in_background(current_user.wallet.id)
    session["get_wallet_total_current_value_last_visited"] = int(time.time())

    try:
        current_total_value = current_user.wallet.total_current_value
        return (
            jsonify(
                {"success": "Data successfully retrieved", "data": current_total_value}
            ),
            200,
        )
    except Exception as e:
        return (
            jsonify(
                {
                    "error": (
                        "An error occurred while retrieving the wallet's current total value from the database. "
                        f"Reason: {str(e)}"
                    )
                }
            ),
            500,
        )


@core.route("/get_wallet_usd_balance", methods=["GET"])
@login_required
def get_wallet_usd_balance():
    """
    Retrieves the current USD balance from the user's wallet.

    Returns:
        tuple: A tuple containing a JSON response and an HTTP status code. On
               successful retrieval, it returns the USD balance along with a 200 status
               code. If an error occurs, it returns an error message with a 500 status
               code.

    Raises:
        Exception: Captures any exceptions that may occur during the process of
                   fetching the balance from the database and includes it in the error
                   response.
    """
    try:
        current_usd_balance = current_user.wallet.balance

        return (
            jsonify(
                {"success": "Data successfully retrieved", "data": current_usd_balance}
            ),
            200,
        )
    except Exception as e:
        return (
            jsonify(
                {
                    "error": (
                        "An error occurred while retrieving the wallet's current USD balance from the database. "
                        f"Reason: {str(e)}"
                    )
                }
            ),
            500,
        )


@core.route("/coin_info")
@login_required
def coin_info():
    """
    Renders the coin information page for the logged-in user. This page allows the user
    to search for a coin by name and then provides detailed information about the coin
    such as its current price, market cap, historical graphs, etc.

    This function passes the CoinGecko API key to the template so that the front-end
    can make API requests to fetch coin data.

    Returns:
        HTML: Renders the 'core/coin-info.html' template with the CoinGecko API key passed
        as context for use in the front-end JavaScript.
    """
    return render_template(
        "core/coin-info.html",
        COINGECKO_API_KEY=COINGECKO_API_KEY,
    )


@core.route("/get_news", methods=["POST"])
@login_required
def get_news():
    """
    Fetch news articles based on a user-specified query and page number.

    This endpoint accepts a JSON payload with the search query and page number to fetch
    news articles using the YahooNewsScraper class.

    Returns:
        json: A JSON object containing a success message and a list of news articles.
              Each article includes details like the title, URL, UNIX timestamp,
              description, and publisher.
    """
    data = request.get_json()
    query = data["query"]
    page = data["page"]

    # Create YahooNewsScraper object
    scraper = YahooNewsScaper()

    # Search for news articles
    articles = scraper.search(query, page)

    res = []

    # Extract necessary data from each article
    for article in articles:
        temp = {}
        temp["title"] = article.title
        temp["url"] = article.url
        temp["timestamp"] = article.timestamp
        temp["description"] = article.description
        temp["publisher"] = article.publisher
        res.append(temp)

    return jsonify(
        {"success": "News articles successfully fetched", "articles": res}, 200
    )


@core.route("/get_reddit_posts", methods=["POST"])
@login_required
def get_reddit_posts():
    """
    Fetches posts from Reddit based on a user-specified query and pagination parameter.

    This endpoint accepts a JSON payload with the search query and pagination 'after'
    parameter to fetch posts. It uses the RedditScraper class to scrape Reddit posts
    based on relevance within the past week.

    Returns:
        json: A JSON object containing the success message and a list of posts. Each
              post includes details like title, thumbnail, content, subreddit, score,
              comment count, id, url, fullname, and a human-readable timestamp
              indicating how long ago the post was made.
    """
    data = request.get_json()
    query = data["query"]
    after = data["after"]

    # Create a RedditScraper object
    scraper = RedditScraper()

    # Search for Reddit posts
    posts = scraper.search_keyword_in_reddit(
        sort="relevance", keyword=query, time="week", limit=10, after=after
    )

    res = []

    # Extract the necessary data from each post
    for post in posts:
        temp = {}
        temp["title"] = post.title
        temp["thumbnail"] = post.thumbnail if post.thumbnail != "self" else ""
        temp["content"] = post.content
        temp["subreddit"] = post.subreddit
        temp["score"] = post.score
        temp["comment_count"] = post.comment_count
        temp["id"] = post.id
        temp["url"] = post.url
        temp["fullname"] = post.fullname
        temp["timestamp"] = time_ago(post.timestamp)
        res.append(temp)

    return jsonify({"success": "Reddit posts successfully fetched", "posts": res}, 200)


def time_ago(unix_timestamp):
    """
    Converts a UNIX timestamp to a relative time string indicating how long ago that
    time was in a human-readable format.

    Parameters:
        unix_timestamp (int): A UNIX timestamp in seconds.

    Returns:
        str: A string representing the time difference in a human-readable format, such
             as "Just now", "X minutes ago", "X hours ago", or "X days ago". It
             dynamically adjusts the singular or plural form based on the time
             difference.

    Examples:
        - If the timestamp is less than a minute ago, it returns "Just now".
        - If the timestamp is one minute ago, it returns "1 minute ago".
        - If the timestamp is several hours or days in the past, it formats the string
          accordingly.
    """
    now = datetime.now()
    past_time = datetime.fromtimestamp(unix_timestamp)
    difference = now - past_time

    seconds = difference.total_seconds()

    if seconds < 60:
        return "Just now"
    elif seconds < 3600:
        minutes = int(seconds // 60)
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    elif seconds < 86400:
        hours = int(seconds // 3600)
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    else:
        days = int(seconds // 86400)
        return f"{days} day{'s' if days > 1 else ''} ago"


def update_user_wallet_value_in_background(current_wallet_id=None):
    """
    Updates the value of user wallets in the background by fetching the latest market
    prices of owned cryptocurrencies from the CoinGecko API and recalculating the total
    asset values for each wallet. If a specific wallet ID is provided, only that
    wallet's value is updated; otherwise, the function updates all wallets in the
    database.

    - Retrieves a list of all unique cryptocurrency coins owned by all registered
      users.
    - Fetches the current market prices for these coins from the CoinGecko API, in
      batches of up to 250 coins at a time to adhere to the API rate limits.
    - Updates the balance value history, assets value history, total value history,
      total current value, and timestamp for each wallet.
    - If more than 250 coins need to be fetched, the function sleeps for 25 seconds
      between API calls to avoid rate-limiting.
    - If no wallet ID is provided (i.e., the function is updating the wallet value
      history for all wallets in the database), the function sleeps for 30 minutes
      (1800 seconds) before executing again, in order to control the frequency of
      updates.

    Args:
        current_wallet_id (UUID, optional): The ID of a specific wallet to update.
                                           If None, all wallets are updated.
    """
    while True:
        from app import app

        with app.app_context():
            coins = set()
            coin_market_prices = {}

            if current_wallet_id:
                all_wallets = [db.session.query(Wallet).get(current_wallet_id)]
            else:
                # Get list of all coins currently owned by users
                all_wallets = Wallet.query.all()

            for wallet in all_wallets:
                coins.update(set(wallet.assets.keys()))

            coins = list(coins)

            # Iterate over 250 coins at a time, getting their market data
            # 250 because the CoinGecko API only allows fetching market data of 250 coins
            # at a time
            current_time = int(time.time())
            for i in range(0, len(coins), 250):
                current_batch = coins[i : i + 250]
                current_batch = ",".join(current_batch)

                url = "https://api.coingecko.com/api/v3/coins/markets"
                params = {"vs_currency": "usd", "per_page": 250, "ids": current_batch}
                headers = {"X-CoinGecko-Api-Key": COINGECKO_API_KEY}
                response = requests.get(url, params=params, headers=headers)
                data = response.json()

                for coin in data:
                    coin_market_prices[coin["id"]] = coin["current_price"]

                # If more than one page of data needs to be fetched from the API, then
                # sleep for 25 seconds before making another request so that we don't get
                # rate-limited by the API
                if len(coins) > 250:
                    time.sleep(25)

            # Update the following fields for each wallet:
            # - balance_value_history
            # - assets_value_history
            # - total_value_history
            # - total_current_value
            for wallet in all_wallets:
                # Get current total value of assets
                curr_assets_value = 0
                for key in wallet.assets:
                    if key in coin_market_prices:
                        curr_assets_value += wallet.assets[key] * coin_market_prices[key]

                wallet.value_history.update_value_history(
                    wallet.balance, curr_assets_value, current_time
                )

                wallet.total_current_value = wallet.balance + curr_assets_value

                db.session.add(wallet)
            db.session.commit()

        if not current_wallet_id:
            time.sleep(WALLET_VALUE_UPDATE_INTERVAL_SECONDS)
        else:
            break


def update_open_trades_in_background():
    """
    Continuously monitors and executes open trades based on current market conditions.

    This function runs in a infinite loop that checks all open trades for all users and
    determines if they can be executed based on their type (limit or stop) and the
    current market price of the coin involved. Trades are executed (if the user has
    enough money/balance) or cancelled (if the user does not have enough money/balance),
    updating the transaction and wallet accordingly.


    This function fetches current market prices in batches to adhere to API rate limits
    and updates each trade accordingly.

    This function should be run in a background thread or as a separate process due
    to its infinite loop nature and sleep intervals which pause execution to limit
    API calls and database transactions.

    The function uses two helper functions:
    - `cancel_open_order`: Cancels an open order and updates the transaction without
                           committing it.
    - `execute_open_order`: Executes an open order based on market prices and updates
                            balances and assets.
    """

    def cancel_open_order(transaction):
        """
        Cancels an open order/transaction and updates the transaction in the database
        (does not commit the changes to the database)

        This function invokes the `cancel_open_order` method of the given transaction
        object to change its status to 'cancelled'. It then adds the updated transaction
        object to the database session for persistence.

        Args:
        transaction (Transaction): The transaction object representing the order to be cancelled.

        Returns:
        None
        """
        transaction.cancel_open_order()
        db.session.add(transaction)

    def execute_open_order(transaction, is_buy):
        """
        Executes an open order based on the current market price and updates the wallet
        balance and assets.

        This function checks if the order is a buy or sell. For a buy order, it
        subtracts the total cost of the coins from the wallet's balance and adds the
        quantity to the assets. For a sell order, it adds the total cost to the balance
        and subtracts the quantity from the assets. The transaction and wallet states
        are then updated in the database session.

        Args:
        transaction (Transaction): The transaction object representing the order to be
                                   executed.
        is_buy (bool): A flag indicating whether the transaction is a buy (True) or
                       sell (False).

        Returns:
        None
        """
        # Execute the order
        transaction.execute_open_order(coin_market_prices[transaction.coin_id])
        if is_buy:
            # Update wallet balance and assets for buy order
            transaction.wallet.update_balance_subtract(
                transaction.quantity * coin_market_prices[transaction.coin_id]
            )
            transaction.wallet.update_assets_add(
                transaction.coin_id, transaction.quantity
            )
        else:
            # Update wallet balance and assets for sell order
            transaction.wallet.update_balance_add(
                transaction.quantity * coin_market_prices[transaction.coin_id]
            )
            transaction.wallet.update_assets_subtract(
                transaction.coin_id, transaction.quantity
            )

        # Update the transaction and the wallet in the database
        db.session.add(transaction)
        db.session.add(transaction.wallet)

    while True:
        from app import app

        with app.app_context():
            coins = set()
            coin_market_prices = {}

            # Get list of all open trades (market and limit) in the database
            open_transactions = Transaction.query.filter(
                or_(
                    and_(
                        Transaction.orderType == "limit", Transaction.status == "open"
                    ),
                    and_(Transaction.orderType == "stop", Transaction.status == "open"),
                )
            ).all()

            # Get all unique coins involved in open trades
            for transaction in open_transactions:
                coins.add(transaction.coin_id)

            # Get market prices for all coins involved in open trades, iterating through
            # 250 coins at a time to adhere to CoinGecko API rate limits
            coins, coin_market_prices = list(coins), {}

            for i in range(0, len(coins), 250):
                current_batch = coins[i : i + 250]
                current_batch = ",".join(current_batch)

                url = "https://api.coingecko.com/api/v3/coins/markets"
                params = {"vs_currency": "usd", "per_page": 250, "ids": current_batch}
                response = requests.get(url, params=params)
                data = response.json()

                for coin in data:
                    coin_market_prices[coin["id"]] = coin["current_price"]

            # Update each open trade, seeing if it can be closed
            for transaction in open_transactions:
                if transaction.orderType == "limit":
                    if (
                        transaction.transactionType == "buy"
                        and coin_market_prices[transaction.coin_id]
                        <= transaction.price_per_unit
                    ):
                        # If user has enough balance to execute the trade, execute it
                        if transaction.wallet.has_enough_balance(
                            transaction.quantity
                            * coin_market_prices[transaction.coin_id]
                        ):
                            # Execute the order
                            execute_open_order(transaction, True)
                        else:
                            # If user doesn't have enough balance to execute the trade, cancel it
                            cancel_open_order(transaction)
                    elif (
                        transaction.transactionType == "sell"
                        and coin_market_prices[transaction.coin_id]
                        >= transaction.price_per_unit
                    ):
                        # If the user has enough coins to execute the trade, execute it
                        if transaction.wallet.has_enough_coins(
                            transaction.coin_id, transaction.quantity
                        ):
                            # Execute the order
                            execute_open_order(transaction, False)
                        else:
                            # If user doesn't have enough coins to execute the trade, cancel it
                            cancel_open_order(transaction)
                elif transaction.orderType == "stop":
                    if (
                        transaction.transactionType == "buy"
                        and coin_market_prices[transaction.coin_id]
                        >= transaction.price_per_unit
                    ):
                        # If user has enough balance to execute the trade, execute it
                        if transaction.wallet.has_enough_balance(
                            transaction.quantity
                            * coin_market_prices[transaction.coin_id]
                        ):
                            # Execute the order
                            execute_open_order(transaction, True)
                        else:
                            # If user doesn't have enough balance to execute the trade, cancel it
                            cancel_open_order(transaction)
                    elif (
                        transaction.transactionType == "sell"
                        and coin_market_prices[transaction.coin_id]
                        <= transaction.price_per_unit
                    ):
                        # If the user has enough coins to execute the trade, execute it
                        if transaction.wallet.has_enough_coins(
                            transaction.coin_id, transaction.quantity
                        ):
                            # Execute the order
                            execute_open_order(transaction, False)
                        else:
                            # If user doesn't have enough coins to execute the trade, cancel it
                            cancel_open_order(transaction)

            # Commit all changes to the database
            db.session.commit()

        time.sleep(OPEN_TRADE_UPDATE_INTERVAL_SECONDS)


@core.route("/get_wallet_assets", methods=["GET"])
@login_required
def get_wallet_assets():
    """
    Retrieves and returns the assets and balance of the currently logged-in user's
    wallet.

    This function accesses the assets attribute of the current user's wallet to obtain
    a dictionary of all assets owned by the user. It also retrieves the current balance
    of the user's wallet. The response is structured as a JSON object that includes
    both the assets dictionary and the balance.

    Returns:
        A JSON response containing a success message along with the user's assets and wallet balance.
    """
    current_assets = current_user.wallet.assets

    return (
        jsonify(
            {
                "success": "Data successfully retrieved",
                "assets": current_assets,
                "balance": current_user.wallet.balance,
            }
        ),
        200,
    )


@core.route("/get_open_trades", methods=["GET"])
@login_required
def get_open_trades():
    """
    Retrieves and returns a list of open trade transactions (i.e., limit or stop orders
    that are active/open) for the currently logged-in user.

    This endpoint filters transactions by the current user's wallet ID and 'open'
    status to fetch all open trades associated with the user. Each transaction is
    represented as a dictionary containing key details such as transaction ID, coin ID,
    quantity, price per unit, transaction type, and order type.

    Returns:
        A JSON response containing a success message and the data list of open
        transactions. If an error occurs (e.g., the user has no transactions or the
        database query fails), the function needs proper error handling to manage such
        exceptions.
    """
    open_transactions = Transaction.query.filter_by(
        wallet_id=current_user.wallet.id, status="open"
    ).all()

    res = []

    for transaction in open_transactions:
        temp = {}
        temp["id"] = transaction.id
        temp["coin_id"] = transaction.coin_id
        temp["quantity"] = transaction.quantity
        temp["price_per_unit"] = transaction.price_per_unit
        temp["transaction_type"] = transaction.transactionType
        temp["order_type"] = transaction.orderType
        res.append(temp)

    return jsonify({"success": "Open orders successfully fetched", "data": res}), 200


@core.route("/cancel_open_trade", methods=["POST"])
@login_required
def cancel_open_trade():
    """
    Cancels an open trade transaction (i.e., a limit or stop order that is currently
    still active/open).

    This function handles a POST request to cancel an open transaction. It retrieves
    the transaction ID from the JSON payload of the request, finds the corresponding
    transaction in the database, and invokes the cancel_open_order method on the
    transaction object. After updating the transaction status, it commits the changes
    to the database.

    Returns:
        A JSON response indicating the success of the operation and HTTP status code 200.
    """
    data = request.get_json()
    transaction_id = data["transaction_id"]

    transaction = Transaction.query.get(transaction_id)
    transaction.cancel_open_order()

    db.session.add(transaction)
    db.session.commit()

    return jsonify({"success": "Transaction successfully cancelled"}), 200


@core.route("/get_top_coins_data", methods=["POST"])
def get_top_coins_data():
    """
    Retrieve and return a list of the top coins from the CoinGecko API, sorted by a
    user-specified criterion.

    The function fetches JSON data from the CoinGecko API based on the sorting
    parameter received from the client. The response includes various details about the
    coins such as current price, price change percentages over different time frames,
    and sparkline data.

    The endpoint accepts a POST request with a JSON body that specifies the sorting
    criteria.

    Returns:
        A JSON response containing an array of the top 100 cryptocurrencies sorted
        according to the specified parameter. Each item in the array includes detailed
        market data of the coin.
    """
    data = request.get_json()
    sort_coins_by = data["sort_coins_by"]

    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "order": sort_coins_by,
        "per_page": 100,
        "page": 1,
        "price_change_percentage": "1h,24h,7d",
        "precision": 2,
        "sparkline": "true",
    }

    response = requests.get(url, params=params, headers=COINGECKO_API_HEADERS)
    data = response.json()
    data = jsonify(data)

    return data


@core.route("/get_single_coin_data", methods=["POST"])
def get_single_coin_data():
    """
    Fetches and returns detailed market data for a specific coin.

    This function processes a POST request that includes JSON data with a 'coin_id'
    key. It constructs a query to the CoinGecko API to retrieve current market data for
    the specified coin in USD, including the price change percentage over the last 24
    hours.

    Returns:
        Flask.Response: A JSON response containing detailed market data for the specified cryptocurrency coin.
    """
    data = request.get_json()
    coin_id = data["coin_id"]

    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "ids": coin_id,
        "price_change_percentage": "24h",
    }

    response = requests.get(url, params=params, headers=COINGECKO_API_HEADERS)
    data = response.json()
    data = jsonify(data)

    return data


@core.route("/get_coin_balance", methods=["POST"])
def get_coin_balance():
    """
    Fetches and returns the balance of a specific coin from the current user's wallet.

    This function handles a POST request with JSON content including a 'coin_id'. It
    retrieves the balance of the specified coin from the current user's wallet. If the
    coin is not found in the wallet, it returns a balance of 0.

    Returns:
        Flask.Response: A JSON response containing the balance of the specified coin in
                        the user's wallet.

    """
    data = request.get_json()
    coin_id = data["coin_id"]

    # Get coin balance from curent user's wallet corresponding with the coin_id
    coin_balance = current_user.wallet.assets.get(coin_id, 0)

    return jsonify(coin_balance), 200


@core.route("/get_all_coin_names")
def get_all_coin_names():
    """
    Fetch and return a list of all cryptocurrency coins available on CoinGecko.

    This function processes a GET request and queries the CoinGecko API at the
    '/coins/list' endpoint, which provides a comprehensive list of all cryptocurrencies
    tracked by CoinGecko, including their IDs, symbols, and names.

    Returns:
        Flask.Response: A JSON response containing a list of all cryptocurrencies, with each entry including
        the coin's ID, symbol, and name.
    """
    url = "https://api.coingecko.com/api/v3/coins/list"

    response = requests.get(url, headers=COINGECKO_API_HEADERS)
    data = response.json()
    data = jsonify(data)

    return data


@core.route("/get_trending_coins_data")
def get_trending_coins_data():
    """
    Fetch and return data for currently trending coins from the CoinGecko API.

    This function handles a GET request and queries the CoinGecko API's trending
    endpoint, which provides data on the most popular cryptocurrencies based on recent
    search activities.

    Returns:
        Flask.Response: A JSON response containing data about trending cryptocurrency coins.
    """
    url = "https://api.coingecko.com/api/v3/search/trending"

    response = requests.get(url, headers=COINGECKO_API_HEADERS)

    data = response.json()
    data = jsonify(data)

    return data


@core.route("/get_multiple_coin_data", methods=["POST"])
def get_multiple_coin_data():
    """
    Fetch and return market data for multiple specified coins.

    This function processes a POST request that should include a JSON body containing
    'coin_ids', a string of coin IDs (comma-separated). It constructs a query to the
    CoinGecko API to retrievethe current market data for the specified coins in USD.

    Returns:
        Flask.Response: A JSON response containing the market data for the specified coins.
    """
    data = request.get_json()
    coin_ids = data["coin_ids"]

    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "ids": coin_ids,
    }

    response = requests.get(url, params=params, headers=COINGECKO_API_HEADERS)
    data = response.json()
    data = jsonify(data)

    return data


@core.route("/get_coin_OHLC_data", methods=["POST"])
def get_coin_OHLC_data():
    """
    Fetch and return the Open, High, Low, and Close (OHLC) market data for a specified
    coin over the past year.

    This function processes a POST request containing JSON data with a 'coin_id' key.
    It uses this ID to query the CoinGecko API and retrieves OHLC data in USD for the
    specified coin over the last 365 days.

    Returns:
        Flask.Response: A JSON response containing the OHLC data for the specified coin.
    """
    data = request.get_json()
    coin_id = data["coin_id"]

    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/ohlc?vs_currency=usd&days=365"

    response = requests.get(url, headers=COINGECKO_API_HEADERS)
    data = response.json()
    data = jsonify(data)

    return data


@core.route("/get_coin_historical_data", methods=["POST"])
def get_coin_historical_data():
    """
    Fetch and return historical market data for a specified coin over the past year.

    This function handles a POST request with JSON content that includes a 'coin_id'.
    It queries the CoinGecko API to retrieve daily market chart data in USD for the
    specified coin over the last 365 days.

    Returns:
        Flask.Response: A JSON response containing the historical market data.
    """
    data = request.get_json()
    coin_id = data["coin_id"]

    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart?vs_currency=usd&days=365&interval=daily"

    response = requests.get(url, headers=COINGECKO_API_HEADERS)
    data = response.json()
    data = jsonify(data)

    return data
