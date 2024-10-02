from flask import Flask, jsonify, request, Blueprint
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from extensions import db
from models import User, Wallet, ValueHistory, Transaction
from rapidfuzz import process
import time
import requests
from constants import COINGECKO_API_HEADERS
from collections import OrderedDict


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
    return jsonify(access_token=access_token), 200


@api.route("/portfolio/assets", methods=["GET"])
@jwt_required()
def get_portfolio_assets():
    # Get the user's identity from the JWT token
    current_user_id = get_jwt_identity()

    # Fetch the user's wallet
    wallet = Wallet.query.filter_by(owner_id=current_user_id).first()
    wallet.assets["Account Cash Balance (USD)"] = wallet.balance

    return jsonify(wallet.assets), 200


@api.route("/portfolio/balance_history", methods=["GET"])
@jwt_required()
def get_balance_history():
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
    transaction.status = "cancelled"
    db.session.commit()

    return (
        jsonify({"msg": f"Success! Transaction {transaction.id} has been cancelled."}),
        200,
    )
