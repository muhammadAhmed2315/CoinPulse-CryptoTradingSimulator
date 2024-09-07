import requests
import time
import time
from flask import render_template, request, Blueprint, jsonify, session
from flask_login import current_user, login_required
from models import User, Wallet, Transaction
from constants import COINGECKO_API_KEY
from extensions import db
import time

core = Blueprint("core", __name__)


@core.route("/dashboard")
@login_required
def dashboard():
    return render_template(
        "core/dashboard.html",
        COINGECKO_API_KEY=COINGECKO_API_KEY,
    )


@core.route("/top_coins")
@login_required
def top_coins():
    return render_template(
        "core/top-coins.html",
        COINGECKO_API_KEY=COINGECKO_API_KEY,
    )


@core.route("/my_trades")
@login_required
def my_trades():
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
            temp["type"] = transaction.type
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
    match sort:
        case "type_asc":
            return sorted(transactions, key=lambda trnsctn: trnsctn.type)
        case "type_desc":
            return sorted(transactions, key=lambda trnsctn: trnsctn.type, reverse=True)
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


@core.route("/process_transaction", methods=["POST"])
@login_required
def process_transaction():
    # Validate data
    if not request.json or "transactionData" not in request.json:
        return jsonify({"error": "Missing transaction data"}), 400

    data = request.json["transactionData"]

    required_fields = {
        "type": False,
        "coin_id": False,
        "quantity": False,
        "price_per_unit": False,
        "comment": False,
    }

    for key in data:
        if key in required_fields:
            required_fields[key] = True

    errors = ""

    for key in required_fields:
        if not required_fields[key]:
            errors += key + ", "

    if errors:
        errors = errors[:-2]

    if any(field not in data for field in required_fields):
        return jsonify({"error": "Missing fields: " + errors}), 400

    if data["type"] == "buy":
        # Make sure user has enough balance (USD) to make transaction
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

    elif data["type"] == "sell":
        # Make sure user is not selling more coins than they own
        if not current_user.wallet.has_enough_coins(data["coin_id"], data["quantity"]):
            return (
                jsonify(
                    {
                        "error": "Transaction Failed: Insufficient crypto balance to complete the sale transaction. Please check your portfolio and try again."
                    }
                ),
                400,
            )

    # Save the transaction in the database
    transaction = Transaction(
        type=data["type"],
        coin_id=data["coin_id"],
        quantity=data["quantity"],
        price_per_unit=data["price_per_unit"],
        wallet_id=current_user.wallet.id,
        comment=data["comment"],
        balance_before=current_user.wallet.balance,
    )

    try:
        user_wallet = current_user.wallet
        if transaction.type == "buy":
            # Update wallet balance
            user_wallet.update_balance_subtract(
                transaction.quantity * transaction.price_per_unit
            )

            # Update wallet assets dictionary
            user_wallet.update_assets_add(transaction.coin_id, transaction.quantity)

        elif transaction.type == "sell":
            # Update wallet balance
            user_wallet.update_balance_add(
                transaction.quantity * transaction.price_per_unit
            )

            # Update wallet assets dictionary
            user_wallet.update_assets_subtract(
                transaction.coin_id, transaction.quantity
            )

        db.session.add(transaction)
        db.session.add(user_wallet)
        db.session.commit()

        update_user_wallet_value_in_background(user_wallet.id)

        return jsonify({"success": "Transaction processed successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return (
            jsonify({"error": f"Failed to process transaction. Reason: {str(e)}"}),
            500,
        )


def update_user_wallet_value_in_background(current_wallet_id=None):
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
