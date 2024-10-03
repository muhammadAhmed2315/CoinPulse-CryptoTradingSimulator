from flask import jsonify, request, Blueprint
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)
from extensions import db
from models import User, Wallet, Transaction, TransactionLikes
from rapidfuzz import process
import time
import requests
from constants import COINGECKO_API_HEADERS
from core.app import update_user_wallet_value_in_background
from YahooNewsScraper.YahooNewsScraper import YahooNewsScaper
from RedditScraper.RedditScraper import RedditScraper
from core.app import time_ago


api = Blueprint("api", __name__)

# List of coins available on the CoinGecko API, cached to minimize frequent API calls
# and updated every 5 minutes. In the format of a list, with each element being of the
# following format: [<coin_name>, <coin_id>].
cache = {"coins_list": [], "timestamp": 0}


@api.route("/")
def home():
    """
    Home endpoint for the API.
    Provides a basic overview of the API and its endpoints.
    """
    return (
        jsonify(
            {
                "message": "Welcome to the CoinPulse API!",
                "endpoints": {
                    "/get_jwt_token": "POST to obtain a JWT token by providing 'email' and 'password' in the request body as JSON.",
                },
            }
        ),
        200,
    )


@api.route("/token/generate", methods=["POST"])
def generate_token():
    """
    Processes a POST request to authenticate a user using their email and password and
    generate a JWT access token.

    The request must contain JSON data with 'email' and 'password' fields. The function
    validates the presence of these fields, checks the credentials against the stored
    user data, and if the credentials are correct, generates and returns a JWT access
    token with the user's ID as the identity.

    Returns:
        - JSON response with the JWT access token and status code 200 if authentication
          is successful.
        - JSON response with an error message and status code 400 if the JSON data is
          missing or incomplete.
        - JSON response with an error message and status code 401 if the email or
          password is incorrect.
    """
    # Validate JSON request
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    # Validate JSON request body parameters
    email = request.json.get("email", None)
    password = request.json.get("password", None)

    if not email:
        return jsonify({"msg": "Missing email"}), 400
    if not password:
        return jsonify({"msg": "Missing password"}), 400

    # Check if email and password are valid
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"msg": "Incorrect email or password"}), 401

    if not user.check_password(password):
        return jsonify({"msg": "Incorrect email or password"}), 401

    # Create an access token
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return jsonify(access_token=access_token, refresh_token=refresh_token), 200


@api.route("/token/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """
    Generates a new access token for authenticated users using a valid refresh token.

    The endpoint requires a POST request with a valid JWT refresh token provided in the
    request header. It uses the `jwt_required` decorator with the `refresh=True` option
    to ensure that only requests with a valid refresh token can access this route.

    Returns:
        json: A JSON object containing the new access token.
        int: HTTP status code 200 indicating successful token refresh.
    """
    current_user = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user)
    return jsonify(access_token=new_access_token), 200


@api.route("/portfolio/assets", methods=["GET"])
@jwt_required()
def get_portfolio_assets():
    """
    Fetches the portfolio assets for the currently authenticated user.

    This endpoint requires a valid JWT token for authentication. Once authenticated,
    it returns a JSON object containing the user's assets, including their current cash
    balance in USD.

    Returns:
        dict: A JSON object containing the user's assets, including their cash balance.
        int: HTTP status code 200 on successful retrieval.
    """
    # Get the user's identity from the JWT token
    current_user_id = get_jwt_identity()

    # Fetch the user's wallet
    wallet = Wallet.query.filter_by(owner_id=current_user_id).first()
    wallet.assets["Account Cash Balance (USD)"] = wallet.balance

    return jsonify(wallet.assets), 200


@api.route("/portfolio/balance_history", methods=["GET"])
@jwt_required()
def get_balance_history():
    """
    Retrieves the historical balance data from the currently authenticated user's
    wallet.

    This endpoint requires a valid JWT for authentication. Once authenticated, the
    user's balance history and corresponding timestamps are fetched from their wallet's
    'value_history' attribute, and then formatted into a list of
    [balance, timestamp] pairs. These pairs are then returned as a list in the JSON
    response.

    Returns:
        list: A list of [balance, timestamp] pairs representing the history of
              balance changes.
        int: HTTP status code 200 on successful retrieval.
    """
    # Get the user's identity from the JWT token
    current_user_id = get_jwt_identity()

    # Fetch the user's wallet
    wallet = Wallet.query.filter_by(owner_id=current_user_id).first()

    # Get balance history and timestamps from wallet.value_history
    balance_history = wallet.value_history.balance_history
    timestamps = wallet.value_history.timestamps

    # Format the balance history and the timestamps into a single list
    res = []
    for i in range(len(balance_history)):
        res.append([balance_history[i], timestamps[i]])

    return jsonify(res), 200


@api.route("/portfolio/assets_value_history", methods=["GET"])
@jwt_required()
def get_assets_value_history():
    """
    Retrieves the historical assets value data from the currently authenticated user's
    wallet.

    This endpoint requires a valid JWT for authentication. Once authenticated, the
    user's assets value history and corresponding timestamps are fetched from their
    wallet's 'value_history' attribute, and then formatted into a list of
    [asset_value, timestamp] pairs. These pairs are then returned as a list in the JSON
    response.

    Returns:
        list: A list of [asset_value, timestamp] pairs representing the history of
              balance changes.
        int: HTTP status code 200 on successful retrieval.
    """
    # Get the user's identity from the JWT token
    current_user_id = get_jwt_identity()

    # Fetch the user's wallet
    wallet = Wallet.query.filter_by(owner_id=current_user_id).first()

    # Get assets value history and timestamps from wallet.value_history
    assets_value_history = wallet.value_history.assets_value_history
    timestamps = wallet.value_history.timestamps

    # Format the assets value history and the timestamps into a single list
    res = []
    for i in range(len(assets_value_history)):
        res.append([assets_value_history[i], timestamps[i]])

    return jsonify(res), 200


@api.route("/portfolio/total_value_history", methods=["GET"])
@jwt_required()
def get_total_value_history():
    """
    Retrieves the historical total value data from the currently authenticated user's
    wallet.

    This endpoint requires a valid JWT for authentication. Once authenticated, the
    user's wallet's total value (historical) data and corresponding timestamps are
    fetched from their wallet's 'total_value_history' attribute, and then formatted
    into a list of [total_value, timestamp] pairs. These pairs are then returned as a
    list in the JSON response.

    Returns:
        list: A list of [total_value, timestamp] pairs representing the history of
              balance changes.
        int: HTTP status code 200 on successful retrieval.
    """
    # Get the user's identity from the JWT token
    current_user_id = get_jwt_identity()

    # Fetch the user's wallet
    wallet = Wallet.query.filter_by(owner_id=current_user_id).first()

    # Get total value history and timestamps from wallet.value_history
    total_value_history = wallet.value_history.total_value_history
    timestamps = wallet.value_history.timestamps

    # Format the total value history and the timestamps into a single list
    res = []
    for i in range(len(total_value_history)):
        res.append([total_value_history[i], timestamps[i]])

    return jsonify(res), 200


@api.before_request
def cache_coin_names():
    """
    Caches the names and IDs of all cryptocurrencies from the CoinGecko API before
    handling any request.

    This function is executed before each request to ensure that the cache of
    cryptocurrency names and IDs is up-to-date. It checks if the cache has been updated
    within the last 5 minutes. If not, it fetches the latest list of cryptocurrencies
    from the CoinGecko API and updates the cache. This helps in minimising API calls
    and also because the CoinGecko API updates the list of coins every 5 minutes.

    The cache is stored in a dictionary with a 'timestamp' key to track the last update
    time and a 'coins_list' key containing a list of [name, id] pairs of the coins.

    No parameters.
    No returns.

    Side effects:
        Updates the global cache dictionary with the latest cryptocurrency data from the CoinGecko API if more than 5 minutes have passed since the last update.
    """
    # Fetch all coins from the CoinGecko API (update this cache every 5 minutes since
    # the CoinGecko API updates the list of coins every 5 minutes)
    current_time = time.time()

    if current_time - cache["timestamp"] > 300:
        url = "https://api.coingecko.com/api/v3/coins/list"

        response = requests.get(url, headers=COINGECKO_API_HEADERS)
        coins_list = response.json()
        cache["coins_list"] = []

        for coin in coins_list:
            cache["coins_list"].append([coin["name"].lower(), coin["id"]])

        cache["timestamp"] = current_time


@api.route("/coins/search", methods=["GET"])
@jwt_required()
def search_coins():
    """
    Searches for coins with names similar to the input coin name, using a fuzzy
    matching algorithm. Returns a list of similar coins in the format of a list, with
    each element of the list being of the following format: [<coin_name>, <coin_id>].

    This endpoint processes GET requests with JSON body content that must include:
    - `coin_name`: A string representing the name of the coin to search for.
    - `limit`: An optional integer to limit the number of similar coins returned
      (default is 10).
    - `similarity_threshold`: An optional integer (percentage) defining the minimum
      similarity score for matches (default is 80).

    The function fetches the list of all coins from the CoinGecko API, caching the
    results and updating the cache every 5 minutes to minimize frequent API calls (and
    also because the CoinGecko API updates its list of coins every 5 minutes). It then
    performs a fuzzy search for coins with names similar to `coin_name` based on the
    provided `similarity_threshold`.

    Returns:
        - A JSON response containing a list of similar coins in the format
          [<coin_name>, <coin_id>], along with a message describing the format of the
          returned data.
    """
    # Validate JSON request
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    # Validate JSON request body parameters
    input_coin_name = request.json.get("coin_name", None)
    input_limit = request.json.get("limit", 10)
    input_similarity_threshold = request.json.get("similarity_threshold", 80)

    if not input_coin_name:
        return jsonify({"msg": "Missing coin_name"}), 400

    # Convert input to lowercase
    input_coin_name = input_coin_name.lower()

    cache_coin_names()

    # Search for similar coins
    coin_names = [coin[0] for coin in cache["coins_list"]]

    similar_coins = process.extract(
        query=input_coin_name,
        choices=coin_names,
        limit=input_limit,
        score_cutoff=input_similarity_threshold,
    )

    # Format the output
    res = []
    for coin in similar_coins:
        res.append([coin[0], cache["coins_list"][coin[2]][1]])

    return (
        jsonify(
            {
                "msg": "Format = <coin_name, coin_id>",
                "similar_coins": res,
            }
        ),
        200,
    )


@api.route("/transactions", methods=["GET"])
@jwt_required()
def get_transactions():
    """
    Retrieves a paginated list of transactions from the currently authenticated user's
    wallet.

    This endpoint requires a valid JWT token for authentication and optionally accepts
    'page' and 'per_page' query parameters to control pagination. After validating the
    user's identity and fetching their wallet, it retrieves the transactions associated
    with that wallet. Transactions are ordered by their timestamp in descending order
    (most recent first) and paginated based on the provided query parameters.

    The function constructs a list of dictionaries, each representing a transaction
    with detailed attributes, and returns this list along with pagination metadata and
    a success message.

    Returns:
        dict: A JSON object containing a list of transactions, pagination details, and
              a success message.
        int: HTTP status code 200 on successful retrieval, or 404 if the wallet is not
              found.
    """
    # Get the user's identity from the JWT token
    current_user_id = get_jwt_identity()

    # Fetch the user's wallet
    wallet = Wallet.query.filter_by(owner_id=current_user_id).first()
    if not wallet:
        return jsonify({"message": "Wallet not found"}), 404

    # Get pagination parameters from query string, set defaults if not provided
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get(
        "per_page", 10, type=int
    )  # You can adjust the default per_page as needed

    # Fetch transactions with pagination
    wallet = Wallet.query.filter_by(owner_id=current_user_id).first()
    transactions = wallet.transactions.order_by(Transaction.timestamp.desc())
    pagination = transactions.paginate(page=page, per_page=per_page, error_out=False)
    transactions = pagination.items

    res = []

    for transaction in transactions:
        temp = {
            "id": transaction.id,
            "status": transaction.status,
            "transaction_type": transaction.transactionType,
            "order_type": transaction.orderType,
            "timestamp": transaction.timestamp,
            "coin_id": transaction.coin_id,
            "quantity": transaction.quantity,
            "price_per_unit": transaction.price_per_unit,
            "price_per_unit_at_execution": transaction.price_per_unit_at_execution,
            "total_value": transaction.total_value,
            "comment": transaction.comment,
        }
        res.append(temp)

    # Prepare pagination metadata
    pagination_info = {
        "total_items": pagination.total,
        "total_pages": pagination.pages,
        "current_page": pagination.page,
        "per_page": pagination.per_page,
        "has_next": pagination.has_next,
        "has_prev": pagination.has_prev,
    }

    return (
        jsonify(
            {
                "transactions": res,
                "pagination": pagination_info,
                "msg": "Format = <coin_name, coin_id>",
            }
        ),
        200,
    )


@api.route("/transactions/cancel", methods=["POST"])
@jwt_required()
def cancel_transaction():
    """
    Cancels an open transaction for the currently authenticated user.

    This endpoint requires a valid JWT token for authentication. Once the user has been
    authenticated, the function checks for a valid JSON payload containing the
    transaction_id. If the transaction_id is found in the user's wallet, the status of
    the transaction is checked. If the transaction is open, it will be cancelled;
    otherwise, an error response will be generated.

    Returns:
        dict: A JSON object with a message indicating either success or the nature of
              the error.
        int: HTTP status code 200 for success, 400 for input errors, or 404 for not
              found items.
    """
    # Get the user's identity from the JWT token
    current_user_id = get_jwt_identity()

    # Validate JSON request
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    # Validate JSON request body parameters
    transaction_id = request.json.get("transaction_id", None)

    if not transaction_id:
        return jsonify({"msg": "Missing transaction_id"}), 400

    # Fetch the user's wallet
    wallet = Wallet.query.filter_by(owner_id=current_user_id).first()
    if not wallet:
        return jsonify({"message": "Wallet not found"}), 404

    # Fetch the transaction to cancel
    transaction = wallet.transactions.filter_by(id=transaction_id).first()

    if not transaction:
        return jsonify({"message": "Transaction not found"}), 404

    # Check if the transaction is active/open
    if transaction.status != "open":
        return jsonify({"message": "Transaction is not open"}), 400

    # Cancel the transaction
    transaction.cancel_open_order()
    db.session.commit()

    return (
        jsonify({"msg": f"Success! Transaction {transaction.id} has been cancelled."}),
        200,
    )


@api.route("/transactions/execute", methods=["POST"])
@jwt_required()
def process_buy_transaction():
    """
    Processes a buy or sell transaction based on the provided JSON parameters in the
    request body.

    This endpoint is designed to execute market, limit, or stop buy/sell transactions
    for a specified cryptocurrency. The function requires a JWT token for authorization
    and validates the JSON in the request to ensure all required fields are provided
    and valid. It performs checks on user balance or coin availability, and executes
    the transaction accordingly.

    Parameters:
        transaction_type (str): Specifies the type of transaction ('buy' || 'sell')
        order_type (str): Specifies the order type ('market' || 'limit' || or 'stop')
        coin_id (str): A unique identifier for the cryptocurrency.
        visibility (str): A string flag ('True' || 'False') indicating whether the
                          transaction should be visible to other users.
        comment (str, optional): An optional comment about the transaction.
        quantity_in_usd (float, optional): The quantity of the transaction in USD,
                                           applicable only to market orders.
        quantity (float, optional): The quantity of coins to transact, required for
                                    limit and stop orders.
        price_per_unit (float, optional): The price per unit in USD, required for limit
                                          and stop orders.

    Returns:
        jsonify: A JSON object containing a message about the successful execution of
                 the transaction or any errors encountered due to invalid or
                 insufficient parameters.
    """
    # Validate JSON request
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    # Validate JSON request body parameters
    transaction_type = request.json.get("transaction_type")
    order_type = request.json.get("order_type")
    coin_id = request.json.get("coin_id")
    visibility = request.json.get("visibility")
    comment = request.json.get("comment", None)
    quantity_in_usd = request.json.get("quantity_in_usd", None)
    quantity = request.json.get("quantity", None)
    price_per_unit = request.json.get("price_per_unit", None)

    if not transaction_type:
        return jsonify({"msg": "Missing transaction_type"}), 400
    if transaction_type not in ["buy", "sell"]:
        return (
            jsonify({"msg": "Invalid transaction_type. Must be 'buy' or 'sell'."}),
            400,
        )

    if not order_type:
        return jsonify({"msg": "Missing order_type"}), 400
    if order_type not in ["market", "limit", "stop"]:
        return (
            jsonify(
                {"msg": "Invalid order_type. Must be 'market', 'limit', or 'stop'."}
            ),
            400,
        )

    if not coin_id:
        return jsonify({"msg": "Missing coin_id"}), 400

    valid_coin_ids = [coin[1] for coin in cache["coins_list"]]
    if coin_id not in valid_coin_ids:
        return (
            jsonify(
                {
                    "msg": "Invalid coin_id. Use the '/coins/search' endpoint to find the ID of the coin you wish to buy."
                }
            ),
            400,
        )

    if not visibility:
        return jsonify({"msg": "Missing visibility"}), 400
    if visibility not in ["True", "False"]:
        return (
            jsonify({"msg": "Invalid visibility value. Must be 'True' or 'False'."}),
            400,
        )

    if order_type == "market":
        if not quantity_in_usd and not quantity:
            return jsonify({"msg": "Missing quantity_in_usd/quantity"}), 400

        if quantity and quantity_in_usd:
            return (
                jsonify(
                    {"msg": "Provide either quantity or quantity_in_usd, not both"}
                ),
                400,
            )

        if quantity and quantity <= 0:
            return jsonify({"msg": "Invalid quantity"}), 400

        if quantity_in_usd and quantity_in_usd <= 0:
            return jsonify({"msg": "Invalid quantity_in_usd"}), 400

    elif order_type == "limit" or order_type == "stop":
        if not quantity:
            return jsonify({"msg": "Missing quantity"}), 400
        if not price_per_unit:
            return jsonify({"msg": "Missing price_per_unit"}), 400

        if quantity <= 0:
            return jsonify({"msg": "Invalid quantity"}), 400

        if price_per_unit <= 0:
            return jsonify({"msg": "Invalid price_per_unit"}), 400

    # Get the current coin price from the CoinGecko API
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "ids": coin_id,
    }

    response = requests.get(url, params=params, headers=COINGECKO_API_HEADERS)
    data = response.json()
    current_coin_price = data[0]["current_price"]

    # Get the user's identity from the JWT token
    current_user_id = get_jwt_identity()

    # Fetch the user's wallet
    wallet = Wallet.query.filter_by(owner_id=current_user_id).first()

    # Make sure user has enough USD balance to execute a buy order
    if transaction_type == "buy":
        if order_type == "market":
            if quantity_in_usd:
                if not wallet.has_enough_balance(quantity_in_usd):
                    return (
                        jsonify({"msg": "Insufficient USD balance to make this trade"}),
                        400,
                    )
            elif quantity:
                if not wallet.has_enough_balance(current_coin_price * quantity):
                    return (
                        jsonify({"msg": "Insufficient USD balance to make this trade"}),
                        400,
                    )
        elif order_type == "limit" or order_type == "stop":
            if not wallet.has_enough_balance(price_per_unit * quantity):
                return (
                    jsonify({"msg": "Insufficient USD balance to make this trade"}),
                    400,
                )
    elif transaction_type == "sell":
        if order_type == "market":
            if quantity_in_usd:
                if not wallet.has_enough_coins(
                    coin_id, quantity_in_usd / current_coin_price
                ):
                    return (
                        jsonify(
                            {"msg": "Insufficient coin balance to make this trade"}
                        ),
                        400,
                    )
            elif quantity:
                if not wallet.has_enough_coins(coin_id, quantity):
                    return (
                        jsonify(
                            {"msg": "Insufficient coin balance to make this trade"}
                        ),
                        400,
                    )
        elif order_type == "limit" or order_type == "stop":
            if not wallet.has_enough_coins(coin_id, quantity):
                return (
                    jsonify({"msg": "Insufficient coin balance to make this trade"}),
                    400,
                )

    # Execute the buy transaction
    # Create transaction
    transaction = Transaction(
        status="finished" if order_type == "market" else "open",
        transactionType=transaction_type,
        orderType=order_type,
        coin_id=coin_id,
        quantity=quantity if quantity else quantity_in_usd / current_coin_price,
        price_per_unit=current_coin_price if order_type == "market" else price_per_unit,
        wallet_id=wallet.id,
        comment=comment,
        balance_before=wallet.balance,
        visibility=True if visibility == "True" else False,
    )

    if transaction_type == "buy" and order_type == "market":
        # Update wallet balance
        wallet.update_balance_subtract(
            quantity_in_usd if quantity_in_usd else quantity * current_coin_price
        )
        # Update wallet assets dictionary
        wallet.update_assets_add(
            coin_id, quantity if quantity else quantity_in_usd / current_coin_price
        )
    elif transaction_type == "sell" and order_type == "market":
        # Update wallet balance
        wallet.update_balance_add(
            quantity_in_usd if quantity_in_usd else quantity * current_coin_price
        )

        # Update wallet assets dictionary
        wallet.update_assets_subtract(
            coin_id, quantity if quantity else quantity_in_usd / current_coin_price
        )

    # Add transaction to the session
    db.session.add(transaction)
    db.session.commit()

    # Create a TransactionLikes object for the transaction
    transaction_likes = TransactionLikes(transaction_id=transaction.id)
    db.session.add(transaction_likes)
    db.session.commit()

    update_user_wallet_value_in_background(wallet.id)

    return jsonify({"msg": "Transaction executed successfully"}), 200


@api.route("/coins/historical/ohlc", methods=["GET"])
@jwt_required()
def get_coin_historical_ohlc_data():
    """
    Fetches the historical daily OHLC data for a specified cryptocurrency over the past
    year.

    This endpoint retrieves daily OHLC data from the CoinGecko API for a cryptocurrency
    identified by the `coin_id` provided as a request parameter. This function requires
    a JWT token for authorization.

    Parameters:
        coin_id (str): A unique identifier for the cryptocurrency. This should be
                       passed as a query parameter.

    Returns:
        jsonify: A JSON object containing the historical daily OHLC data if successful.
                 The data includes each day's timestamp and volume in USD. If there are
                 any issues with the `coin_id` (such as missing or invalid),
                 appropriate error messages and status codes are returned.
    """
    coin_id = request.args.get("coin_id")

    if not coin_id:
        return jsonify({"msg": "Missing coin_id"}), 400

    # Check coin_id validity
    valid_coin_ids = [coin[1] for coin in cache["coins_list"]]
    if coin_id not in valid_coin_ids:
        return (
            jsonify(
                {
                    "msg": "Invalid coin_id. Use the '/coins/search' endpoint to find the ID of the coin you wish to buy."
                }
            ),
            400,
        )

    # Get OHLC data for previous year from CoinGecko API
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/ohlc?vs_currency=usd&days=365"

    response = requests.get(url, headers=COINGECKO_API_HEADERS)
    data = response.json()

    return jsonify(data), 200


@api.route("/coins/historical/price", methods=["GET"])
@jwt_required()
def get_coin_historical_price_data():
    """
    Fetches the historical daily price data for a specified cryptocurrency over the
    past year.

    This endpoint retrieves daily price data from the CoinGecko API for a
    cryptocurrency identified by the `coin_id` provided as a request parameter. This
    function requires a JWT token for authorization.

    Parameters:
        coin_id (str): A unique identifier for the cryptocurrency. This should be
                       passed as a query parameter.

    Returns:
        jsonify: A JSON object containing the historical daily price data if
                 successful. The data includes each day's timestamp and volume in USD.
                 If there are any issues with the `coin_id` (such as missing or
                 invalid), appropriate error messages and status codes are returned.
    """
    coin_id = request.args.get("coin_id")

    if not coin_id:
        return jsonify({"msg": "Missing coin_id"}), 400

    # Check coin_id validity
    valid_coin_ids = [coin[1] for coin in cache["coins_list"]]
    if coin_id not in valid_coin_ids:
        return (
            jsonify(
                {
                    "msg": "Invalid coin_id. Use the '/coins/search' endpoint to find the ID of the coin you wish to buy."
                }
            ),
            400,
        )

    # Get price data for previous year from CoinGecko API
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart?vs_currency=usd&days=365&interval=daily"

    response = requests.get(url, headers=COINGECKO_API_HEADERS)
    data = response.json()["prices"]

    return jsonify(data), 200


@api.route("/coins/historical/market_cap", methods=["GET"])
@jwt_required()
def get_coin_historical_market_cap_data():
    """
    Fetches the historical daily market cap data for a specified cryptocurrency
    over the past year.

    This endpoint retrieves daily trading market cap data from the CoinGecko API for a
    cryptocurrency identified by the `coin_id` provided as a request parameter. This
    function requires a JWT token for authorization.

    Parameters:
        coin_id (str): A unique identifier for the cryptocurrency. This should be
                       passed as a query parameter.

    Returns:
        jsonify: A JSON object containing the historical daily market cap data if
                 successful. The data includes each day's timestamp and market cap in
                 USD. If there are any issues with the `coin_id` (such as missing or
                 invalid), appropriate error messages and status codes are returned.
    """
    coin_id = request.args.get("coin_id")

    if not coin_id:
        return jsonify({"msg": "Missing coin_id"}), 400

    # Check coin_id validity
    valid_coin_ids = [coin[1] for coin in cache["coins_list"]]
    if coin_id not in valid_coin_ids:
        return (
            jsonify(
                {
                    "msg": "Invalid coin_id. Use the '/coins/search' endpoint to find the ID of the coin you wish to buy."
                }
            ),
            400,
        )

    # Get price data for previous year from CoinGecko API
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart?vs_currency=usd&days=365&interval=daily"

    response = requests.get(url, headers=COINGECKO_API_HEADERS)
    data = response.json()["market_caps"]

    return jsonify(data), 200


@api.route("/coins/historical/volume", methods=["GET"])
@jwt_required()
def get_coin_historical_volume_data():
    """
    Fetches the historical daily trading volume data for a specified cryptocurrency
    over the past year.

    This endpoint retrieves daily trading volume data from the CoinGecko API for a
    cryptocurrency identified by the `coin_id` provided as a request parameter. This
    function requires a JWT token for authorization.

    Parameters:
        coin_id (str): A unique identifier for the cryptocurrency. This should be
                       passed as a query parameter.

    Returns:
        jsonify: A JSON object containing the historical daily trading volumes if
                 successful. The data includes each day's timestamp and volume in USD.
                 If there are any issues with the `coin_id` (such as missing or
                 invalid), appropriate error messages and status codes are returned.
    """
    coin_id = request.args.get("coin_id")

    if not coin_id:
        return jsonify({"msg": "Missing coin_id"}), 400

    # Check coin_id validity
    valid_coin_ids = [coin[1] for coin in cache["coins_list"]]
    if coin_id not in valid_coin_ids:
        return (
            jsonify(
                {
                    "msg": "Invalid coin_id. Use the '/coins/search' endpoint to find the ID of the coin you wish to buy."
                }
            ),
            400,
        )

    # Get price data for previous year from CoinGecko API
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart?vs_currency=usd&days=365&interval=daily"

    response = requests.get(url, headers=COINGECKO_API_HEADERS)
    data = response.json()["total_volumes"]

    return jsonify(data), 200


@api.route("/coins/news", methods=["GET"])
@jwt_required()
def get_coin_news_articles():
    """
    Fetches news articles from Yahoo News related to a specified cryptocurrency coin.

    This endpoint retrieves news articles for a given cryptocurrency using the coin ID
    provided in the request parameters. It uses a Yahoo news scraper to fetch relevant
    articles. The function requires a JWT token for authorization.

    Parameters:
        coin_id (str): A unique identifier for the cryptocurrency. This should be
                       passed as a query parameter.
        page (int, optional): The page number of the news results to return. Defaults
                              to 1 if not specified.

    Returns:
        jsonify: A JSON object containing a list of news articles with their details
                 such as title, url, timestamp, description, and publisher, if
                 successful. If there are any issues with the request parameters (such
                 as missing or invalid `coin_id` or `page`), appropriate error messages
                 and status codes are returned.
    """
    coin_id = request.args.get("coin_id")
    page = int(request.args.get("page", 1))

    if not request.args.get("coin_id"):
        return jsonify({"msg": "Missing coin_id"}), 400

    if page < 1:
        return jsonify({"msg": "Invalid page number"}), 400

    # Get the coin name from the coin_id
    query = ""
    for id, name in cache["coins_list"]:
        if id == coin_id:
            query = name
            break

    if query == "":
        return (
            jsonify(
                {
                    "msg": "Invalid coin_id. Use the '/coins/search' endpoint to find the ID of the coin you wish to buy."
                }
            ),
            400,
        )

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


@api.route("/coins/reddit", methods=["GET"])
@jwt_required()
def get_coin_reddit_posts():
    """
    Fetches Reddit posts related to a specified cryptocurrency using its coin ID.

    This endpoint requires JWT authentication and utilizes the RedditScraper object
    to search for the most relevant posts from the past week. The coin ID must be
    provided as a query parameter, and an optional 'after' parameter can be used
    to paginate through the results. The value of the 'after'parameter should be the
    'fullname' of the last post in the current list.

    Parameters:
        coin_id (str): The unique identifier for the cryptocurrency, passed as a query
                       parameter.
        after (str): A cursor for pagination, passed as a query parameter. Defaults to
                     an empty string.

    Returns:
        json: A JSON response containing the fetched Reddit posts or an error message.
            The successful response includes a list of posts with details such as title,
            thumbnail, content, subreddit, score, comment count, post ID, post URL, post fullname,
            and a human-readable timestamp. Each post is represented as a dictionary within the list.
            Error responses are sent with appropriate HTTP status codes and messages indicating
            missing or invalid parameters.

    Raises:
        HTTP 400: If 'coin_id' is missing or invalid, indicating client-side input errors.
    """
    coin_id = request.args.get("coin_id")
    after = request.args.get("after", "")

    if not request.args.get("coin_id"):
        return jsonify({"msg": "Missing coin_id"}), 400

    # Get the coin name from the coin_id
    query = ""
    for id, name in cache["coins_list"]:
        if id == coin_id:
            query = name
            break

    if query == "":
        return (
            jsonify(
                {
                    "msg": "Invalid coin_id. Use the '/coins/search' endpoint to find the ID of the coin you wish to buy."
                }
            ),
            400,
        )

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
