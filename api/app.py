from flask import Flask, jsonify, request, Blueprint
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from extensions import db
from models import User, Wallet, ValueHistory

api = Blueprint("api", __name__)


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


@api.route("/get_jwt_token", methods=["POST"])
def get_jwt_token():
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


@api.route("/get_portfolio", methods=["GET"])
@jwt_required()
def get_portfolio():
    # Get the user's identity from the JWT token
    current_user_id = get_jwt_identity()

    # Fetch the user's wallet
    wallet = Wallet.query.filter_by(owner_id=current_user_id).first()
    wallet.assets["Account Cash Balance (USD)"] = wallet.balance

    return jsonify(wallet.assets), 200
