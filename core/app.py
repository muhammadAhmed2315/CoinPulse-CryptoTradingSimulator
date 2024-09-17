import requests
import time
import time
from flask import render_template, request, Blueprint, jsonify, session
from flask_login import current_user, login_required
from models import User, Wallet, Transaction, TransactionLikes
from constants import COINGECKO_API_KEY
from extensions import db
import time
from YahooNewsScraper.YahooNewsScraper import YahooNewsScaper
from YahooNewsScraper.NewsArticle import NewsArticle
from RedditScraper.RedditScraper import RedditScraper
from RedditScraper.RedditPost import RedditPost
from datetime import datetime, timedelta
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
    last_visited = session.get("last_visited")
    if last_visited is not None:
        if int(time.time()) - last_visited >= 45:
            update_user_wallet_value_in_background(current_user.wallet.id)
    session["last_visited"] = int(time.time())

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

    # TODO TEST THIS WITH A NEW USER WHO HAS NO TRANSACTIONS
    if transactions:
        transactions = sort_transactions(transactions, sort)
        maxPages = (len(transactions) // 25) + 1
        transactions = transactions[(page - 1) * 25 : page * 25]

        res = []

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
            temp["total_value"] = transaction.total_value
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
        case "total_value_asc":
            return sorted(transactions, key=lambda trnsctn: trnsctn.total_value)
        case "total_value_desc":
            return sorted(
                transactions, key=lambda trnsctn: trnsctn.total_value, reverse=True
            )
        case "timestamp_asc":
            return sorted(transactions, key=lambda trnsctn: trnsctn.timestamp)
        case "timestamp_desc":
            return sorted(
                transactions, key=lambda trnsctn: trnsctn.timestamp, reverse=True
            )


@core.route("/get_feedposts", methods=["POST"])
@login_required
def get_feedposts():
    # TODO add error handling for this function (e.g., user has no transactions)
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

    TODO:
        - Add error handling for cases where the transaction ID is not found.
        - Add return for cases where like count was not successfully updated.

    Raises:
        Exception: If any error occurs during the update process.
    """
    data = request.get_json()
    is_increment = data["isIncrement"]
    transaction_id = data["transactionID"]

    # TODO add in error handling for this function (what if id is not found?)
    # Assuming for now the id is always found

    transaction = Transaction.query.get(transaction_id)

    if is_increment:
        transaction.add_like(current_user.id)
    else:
        transaction.remove_like(current_user.id)

    db.session.add(transaction)
    db.session.add(transaction.likes)
    db.session.commit()

    # TODO add in return for if like count was not successfully updated

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
    # Ensure request contains necessary JSON data
    if not request.json or "transactionData" not in request.json:
        return jsonify({"error": "Missing transaction data"}), 400

    data = request.json["transactionData"]

    print(data)

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
    data = request.get_json()
    query = data["query"]
    page = data["page"]

    # Create YahooNewsScraper object
    scraper = YahooNewsScaper()

    # Search for news articles
    articles = scraper.search(query, page)

    res = []

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
                response = requests.get(url, params=params)
                data = response.json()

                for coin in data:
                    # TODO RESPONSIBLE FOR THE STIRNG INDICES MUST BE INTEGERS, NOT STR
                    # ERROR DO THIS1
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
                    curr_assets_value += wallet.assets[key] * coin_market_prices[key]

                wallet.value_history.updateValueHistory(
                    wallet.balance, curr_assets_value, current_time
                )

                db.session.add(wallet)
            db.session.commit()

        if not current_wallet_id:
            time.sleep(1800)


def update_open_trades_in_background():
    def cancel_open_order(transaction):
        transaction.cancel_open_order(coin_market_prices[transaction.coin_id])
        db.session.add(transaction)

    def execute_open_order(transaction, is_buy):
        transaction.execute_open_order(coin_market_prices[transaction.coin_id])
        if is_buy:
            transaction.wallet.update_balance_subtract(
                transaction.quantity * coin_market_prices[transaction.coin_id]
            )
            transaction.wallet.update_assets_add(
                transaction.coin_id, transaction.quantity
            )
        else:
            transaction.wallet.update_balance_add(
                transaction.quantity * coin_market_prices[transaction.coin_id]
            )
            transaction.wallet.update_assets_subtract(
                transaction.coin_id, transaction.quantity
            )
        db.session.add(transaction)
        db.session.add(transaction.wallet)

    while True:
        print("RUNNING")
        from app import app

        with app.app_context():
            coins = set()
            coin_market_prices = {}

            # Get list of all open trades (market and limit) in the database
            open_transactions = Transaction.query.filter(
                or_(
                    and_(Transaction.orderType == "limit", Transaction.status == "open"),
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
                            transaction.quantity * coin_market_prices[transaction.coin_id]
                        ):
                            # Execute the order
                            print("JUST EXECUTED A LIMIT BUY ORDER")
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
                            print("JUST EXECUTED A LIMIT SELL ORDER")
                            execute_open_order(transaction, False)
                        else:
                            # If user doesn't have enough coins to execute the trade, cancel it
                            cancel_open_order(transaction)
                elif transaction.orderType == "stop":
                    print("STOP ORDER")
                    print("FIRST >= SECOND")
                    print(coin_market_prices[transaction.coin_id])
                    print(transaction.price_per_unit)
                    if (
                        transaction.transactionType == "buy"
                        and coin_market_prices[transaction.coin_id]
                        >= transaction.price_per_unit
                    ):
                        print("USER HAS ENOUGH BALANCE")
                        # If user has enough balance to execute the trade, execute it
                        if transaction.wallet.has_enough_balance(
                            transaction.quantity * coin_market_prices[transaction.coin_id]
                        ):
                            # Execute the order
                            print("JUST EXECUTED A STOP BUY ORDER")
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
                            print("JUST EXECUTED A STOP SELL ORDER")
                            execute_open_order(transaction, False)
                        else:
                            # If user doesn't have enough coins to execute the trade, cancel it
                            cancel_open_order(transaction)

        time.sleep(60)
