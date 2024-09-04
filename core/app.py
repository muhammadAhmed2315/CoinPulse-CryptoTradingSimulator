from flask import render_template, request, Blueprint, jsonify
from flask_login import current_user, login_required
from models import Transaction
from constants import COINGECKO_API_KEY
from extensions import db

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

        return jsonify({"success": "Transaction processed successfully"}), 201
    except Exception as e:
        db.session.rollback()
        print(str(e))
        return (
            jsonify({"error": f"Failed to process transaction. Reason: {str(e)}"}),
            500,
        )


# user = User(email=input_email, password=input_password)
# db.session.add(user)

# wallet = Wallet(user.id)
# db.session.add(wallet)

# db.session.commit()
