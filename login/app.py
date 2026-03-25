import os
import time
from datetime import timedelta

from flask import (
    Blueprint,
    make_response,
    redirect,
    render_template,
    request,
    session,
)
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_jwt_identity,
    jwt_required,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer
from jwt.exceptions import ExpiredSignatureError, InvalidSignatureError
from requests_oauthlib import OAuth2Session
from validate_email_address import validate_email

from constants import (
    DISCORD_API_BASE_URL,
    DISCORD_AUTHORIZATION_BASE_URL,
    DISCORD_OAUTH2_CLIENT_ID,
    DISCORD_OAUTH2_CLIENT_SECRET,
    DISCORD_OAUTH2_REDIRECT_URI,
    DISCORD_TOKEN_URL,
    FRONTEND_URL,
    GOOGLE_AUTHORIZATION_BASE_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_SCOPE,
    GOOGLE_TOKEN_URL,
    GOOGLE_USERINFO_URL,
    PASSWORD_ALLOWED_SPECIAL_CHARS,
    TOKEN_GENERATOR_SECRET_KEY,
)
from extensions import db
from models import User, ValueHistory, Wallet

# This URLSafeTimedSerializer object will handle generating and verifying tokens
serializer = URLSafeTimedSerializer(TOKEN_GENERATOR_SECRET_KEY)
user_authentication = Blueprint("user_authentication", __name__)


# #################### DISCORD OAUTH AUTHENTICATION ####################
def token_updater(token):
    """Update the stored Discord OAuth2 token in the session."""
    session["oauth2_token"] = token


def make_session(token=None, state=None, scope=None):
    """Create an OAuth2 session for Discord authentication."""
    return OAuth2Session(
        client_id=DISCORD_OAUTH2_CLIENT_ID,
        token=token,
        state=state,
        scope=scope,
        redirect_uri=DISCORD_OAUTH2_REDIRECT_URI,
        auto_refresh_kwargs={
            "client_id": DISCORD_OAUTH2_CLIENT_ID,
            "client_secret": DISCORD_OAUTH2_CLIENT_SECRET,
        },
        auto_refresh_url=DISCORD_TOKEN_URL,
        token_updater=token_updater,
    )


@user_authentication.route("/login_discord")
def login_discord():
    """
    Initiates OAuth2 authentication with Discord by redirecting the user to
    Discord's authorization page.
    """
    scope = request.args.get("scope", "identify email")
    discord = make_session(scope=scope.split(" "))
    authorization_url, state = discord.authorization_url(DISCORD_AUTHORIZATION_BASE_URL)
    session["oauth2_state"] = state
    return redirect(authorization_url)


@user_authentication.route("/callback_discord")
def callback_discord():
    """
    Handles the OAuth2 callback from Discord. Exchanges the authorization code for
    an access token, retrieves user info, creates the user if they don't exist,
    sets JWT cookies, and redirects to the frontend.
    """
    if request.values.get("error"):
        return redirect(f"{FRONTEND_URL}/login?error=oauth_denied")

    discord = make_session(state=session.get("oauth2_state"))
    token = discord.fetch_token(
        DISCORD_TOKEN_URL,
        client_secret=DISCORD_OAUTH2_CLIENT_SECRET,
        authorization_response=request.url,
    )
    session["oauth2_token"] = token

    discord = make_session(token=session.get("oauth2_token"))
    user_info = discord.get(DISCORD_API_BASE_URL + "/users/@me").json()
    user_email = user_info["email"]
    user_id = user_info["id"]

    user = User.query.filter_by(email=user_email).first()
    if not user:
        user = User(email=user_email, provider="discord", provider_id=user_id)
        db.session.add(user)
        db.session.commit()

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    redirect_path = "/pick_username" if not user.username else "/dashboard"
    response = make_response(redirect(f"{FRONTEND_URL}{redirect_path}"), 302)
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)
    return response


# #################### GOOGLE OAUTH AUTHENTICATION ####################
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"  # Only for development on localhost


@user_authentication.route("/login_google")
def login_google():
    """
    Initiates OAuth2 authentication with Google by redirecting the user to
    Google's authorization page.
    """
    google = OAuth2Session(
        GOOGLE_CLIENT_ID, redirect_uri=GOOGLE_REDIRECT_URI, scope=GOOGLE_SCOPE
    )
    authorization_url, state = google.authorization_url(
        GOOGLE_AUTHORIZATION_BASE_URL, access_type="offline", prompt=None
    )
    session["oauth_state"] = state
    return redirect(authorization_url)


@user_authentication.route("/callback_google")
def callback_google():
    """
    Handles the OAuth2 callback from Google. Exchanges the authorization code for
    an access token, retrieves user info, creates the user if they don't exist,
    sets JWT cookies, and redirects to the frontend.
    """
    if request.values.get("error"):
        return redirect(f"{FRONTEND_URL}/login?error=oauth_denied")

    google = OAuth2Session(
        GOOGLE_CLIENT_ID,
        state=session.get("oauth_state"),
        redirect_uri=GOOGLE_REDIRECT_URI,
    )
    token = google.fetch_token(
        GOOGLE_TOKEN_URL,
        client_secret=GOOGLE_CLIENT_SECRET,
        authorization_response=request.url,
    )
    session["google_token"] = token

    userinfo_response = google.get(GOOGLE_USERINFO_URL)
    userinfo = userinfo_response.json()
    user_email = userinfo.get("email")
    user_id = userinfo.get("id")

    user = User.query.filter_by(email=user_email).first()
    if not user:
        user = User(email=user_email, provider="google", provider_id=user_id)
        db.session.add(user)
        db.session.commit()

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    redirect_path = "/pick_username" if not user.username else "/dashboard"
    response = make_response(redirect(f"{FRONTEND_URL}{redirect_path}"), 302)
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)
    return response


# #################### DEFAULT AUTHENTICATION ####################
@user_authentication.route("/login", methods=["post"])
def login():
    """
    Endpoint to handle login requests. Redirects users who are already logged in to the
    home page. Handles form submission and validates login credentials. Successfully
    validated users are redirected to either the home page, or the restricted page
    they were trying to access.
    """
    data = request.get_json()
    email, password = data["email"], data["password"]

    user = User.query.filter_by(email=email).first()

    if not user:
        return {
            "error": "Invalid email or password",
            "description": "Please check your credentials and try again",
        }, 401

    if not user.check_password(password):
        return {
            "error": "Invalid email or password",
            "description": "Please check your credentials and try again",
        }, 401

    # Generate access token
    access_token = create_access_token(identity=user.id)

    if not user.verified:
        send_activation_email(user.email, access_token, user.username)
        return {
            "error": "Email not verified",
            "description": "A verification email has been sent. Please check your inbox and verify your account before logging in.",
        }, 403

    refresh_token = create_refresh_token(identity=user.id)

    response = make_response({"message": "Login successful"}, 200)
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)
    return response


@user_authentication.route("/refresh", methods=["post"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    response = make_response({"message": "Token refreshed"}, 200)
    set_access_cookies(response, access_token)
    return response


@user_authentication.route("/create_account", methods=["post"])
def create_account():
    """
    Endpoint to handle registration requests. Redirects users who are already logged in
    to the home page. Handles form submission, and validates the input by checking the
    email is in the correct format, and ensuring the password meets the complexity
    requirements. Register the user and add them to the database if successful, and
    then redirect them to the home page.
    """
    data = request.get_json()
    email: str = data["email"]
    username: str = data["username"]
    password: str = data["password"]
    confirm_password: str = data["confirmPassword"]

    if not validate_email(email):
        return {
            "error": "Invalid email address",
            "description": "Please enter a valid email address (e.g., john.doe@gmail.com)",
        }, 400

    user = User.query.filter_by(email=email).first()
    if user:
        return {
            "error": "Email already in use",
            "description": "An account with this email address already exists. Please use a different email or login.",
        }, 409

    if len(username) < 3 or len(username) > 20:
        return {
            "error": "Invalid username length",
            "description": "Username must be between 3 and 20 characters.",
        }, 400

    if not username[0].isalpha():
        return {
            "error": "Invalid username",
            "description": "Username must begin with a letter.",
        }, 400

    for char in username:
        if not char.isalnum():
            return {
                "error": "Invalid username",
                "description": "Username can only contain alphanumeric characters.",
            }, 400

    user = User.query.filter_by(username=username).first()
    if user:
        return {
            "error": "Username already taken",
            "description": "Please choose a different username.",
        }, 409

    password_errors = " ".join(validate_password_format(password))
    if password_errors:
        return {
            "error": "Invalid password format",
            "description": password_errors,
        }, 400

    if password != confirm_password:
        return {
            "error": "Passwords do not match",
            "description": "Please make sure both passwords are identical.",
        }, 400

    # Save user information to database, create a wallet for them, and log them in
    user = User(email=email, username=username, password=password)
    db.session.add(user)
    db.session.commit()

    wallet = Wallet(user.id)
    db.session.add(wallet)
    db.session.commit()

    valueHistory = ValueHistory(wallet.id)
    db.session.add(valueHistory)
    db.session.commit()

    # Send verification email
    token = create_access_token(identity=user.id)
    send_activation_email(user.email, token, user.username)
    return {
        "message": "User registered successfully. Please check your email to verify your account."
    }, 201


@user_authentication.route("/pick_username", methods=["post"])
@jwt_required()
def pick_username():
    """
    Allows a newly registered (OAuth) user to pick a username after signing up.

    This view function supports both GET and POST methods. It is intended for users who
    registered using an OAuth provider and don't yet have a username. This function
    enforces username requirements and checks for uniqueness in the database.

    Behavior:
    - If the user already has a username, they are redirected to the dashboard.
    - On GET request: Displays the username selection form.
    - On POST request: Validates the username's format and uniqueness, updates the
                       user's profile, and initializes related models like Wallet and
                       ValueHistory for the user.

    Returns:
    - If the user already has a username: Redirects to the dashboard.
    - If the form is submitted and valid: Updates the user's username and associated
      models, logs in the user, and redirects them to the dashboard.
    - If the form is submitted but invalid: Renders the form again with error messages.
    """
    data = request.get_json()
    username = data["username"]

    if len(username) < 3 or len(username) > 20:
        return {
            "error": "Invalid username length",
            "description": "Username must be between 3 and 20 characters.",
        }, 400

    # Check if username is in a valid format
    if not username[0].isalpha():
        return {
            "error": "Invalid username format",
            "description": "Username must begin with a letter",
        }, 400

    if any([not char.isalnum() for char in username]):
        return {
            "error": "Invalid username format",
            "description": "Username can only contain alphanumeric characters",
        }, 400

    # Check username is not already taken
    user = User.query.filter_by(username=username).first()
    if user:
        return {
            "error": "Username unavailable",
            "description": "That username is already in use. Please choose a different one.",
        }, 409

    # Save username to database
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    user.update_username(username)
    db.session.add(user)
    db.session.commit()

    wallet = Wallet(user.id)
    db.session.add(wallet)
    db.session.commit()

    valueHistory = ValueHistory(wallet.id)
    db.session.add(valueHistory)
    db.session.commit()

    return {"success": "Username has been successfully picked"}, 200


@user_authentication.route("/logout", methods=["get"])
def logout():
    response = make_response({"message": "Logged out"}, 200)
    unset_jwt_cookies(response)
    return response


# #################### VERIFY USER'S EMAIL ####################
@user_authentication.route("/retry_verification_from_email", methods=["post"])
def retry_verification_from_email():
    """
    Endpoint to handle the process of sending a verification email to a user.

    Generates the verification token for the current user and sends a verification
    email to them. It then renders a template to display a confirmation message that
    the verification email has been sent.
    """
    data = request.get_json()
    email = data["email"]

    user = User.query.filter_by(email=email).first()
    if user and not user.provider:
        token = create_access_token(identity=user.id)
        send_activation_email(user.email, token, user.username)

    return {
        "message": "Account activation email sent. Please check your email to verify your account."
    }, 200


@user_authentication.route("/verify_email/<token>", methods=["get"])
def verify_email(token):
    """
    Endpoint to verify a user's email address using a provided token.

    This function attempts to decode and validate a token passed via URL. It checks the
    token's validity, age, and if the token's data matches a user's record. If the
    token is valid, and the user is not already verified, it marks the user as verified
    and updates the database. The user is redirected to different pages based on the
    outcome of the token validation.

    This endpoint is called when a user clicks a verification link in an email sent to
    them.

    Parameters:
    - token: The verification token sent to the user's email that needs to be validated
    """
    # Verify the token
    try:
        # Decode the token back into a Python object
        data = decode_token(token)

        user = User.query.filter_by(id=data["sub"]).first()
        # Token is valid and matches data
        if user and str(user.id) == data["sub"]:
            if not user.verified:
                user.verified = True
                db.session.add(user)
                db.session.commit()
                return {
                    "message": "Email verification successful",
                    "email": user.email,
                }, 200
            else:
                return {
                    "message": "Email already verified",
                    "email": user.email,
                }, 200
        else:
            return {
                "error": "Unauthorised",
                "message": "Invalid or expired verification token",
            }, 401

    except ExpiredSignatureError:
        # Expired token
        return {
            "error": "Unauthorised",
            "message": "Invalid or expired verification token",
        }, 401
    except InvalidSignatureError:
        # Token has been corrupted or tampered with or is invalid token
        return {
            "error": "Unauthorised",
            "message": "Invalid or expired verification token",
        }, 401


@user_authentication.route("/retry_verification_from_token", methods=["post"])
def retry_verification_from_token():
    """
    This function is used on the /email_verification_unsuccessful component. This
    function requires a token to be sent as input.

    There are three cases this function deals with:
    - The token is valid but expired within the last 24 hours, in which case we can
      simply send a new verification email
    - The token is valid but did not expire within the last 24 hours, in which case the
      frontend redirects the user to the "put in your email to request the verification
      email again" page
    - The token is invalid (e.g., has been tampered with), in which case the frontend
      redirects the user to the "put in your email to request the verification email
      again" page
    """
    data = request.get_json()
    token = data["token"]

    try:
        decoded = decode_token(token, allow_expired=True)
        user_id = decoded["sub"]
        token_expiry_time = decoded["exp"]

        # If token did not expire within last 24 hours
        if not (0 < time.time() - token_expiry_time <= 86400):
            return {
                "error": "Invalid token",
                "message": "This token is invalid. Please request a new verification email.",
            }, 401

        # Otherwise resend the verification email
        user = User.query.filter_by(id=user_id).first()
        if user:
            new_token = create_access_token(identity=user.id)
            send_activation_email(user.email, new_token, user.username)
            return {
                "message": "Account activation email sent. Please check your email to verify your account."
            }, 200
        else:
            # Return generic "invalid token" to avoid revealing whether a user ID exists
            return {
                "error": "Invalid token",
                "message": "This token is invalid. Please request a new verification email.",
            }, 401

    except InvalidSignatureError:
        # Token has been tampered with
        return {
            "error": "Invalid token",
            "message": "This token is invalid. Please request a new verification email.",
        }, 401


# #################### RESET USER'S PASSWORD ####################
@user_authentication.route(
    "/verify_password_reset_token/<token>", methods=["get", "post"]
)
def verify_password_reset_token(token: str):
    """
    Handles the password reset process using a provided security token.

    This view function supports both GET and POST methods and is used to validate a
    password reset token, show a password reset form if the token is valid, and update
    the user's password if the form is submitted and validated successfully.

    Parameters:
    token (str): The security token sent to the user's email for password reset
                 validation.

    Behavior:
    - Token verification: Checks if the token is valid, not expired, and not tampered
                          with or corrupted.
    - GET request: If the token is valid, displays the password reset form.
    - POST request: Validates the new password input and updates the password if all
                    conditions are met.

    Returns:
    - If the token is expired or invalid: Renders an appropriate error page.
    - If the form is submitted and valid: Updates the user's password and redirects to
      a success page.
    - If the form is submitted but invalid: Renders the form again with error messages.
    """
    # Verify the token
    try:
        # Decode the token back into a Python object
        data = decode_token(token)

    except ExpiredSignatureError:
        # Expired token
        return {
            "error": "Unauthorised",
            "message": "Invalid or expired verification token",
        }, 401

    except InvalidSignatureError:
        # Token has been corrupted or tampered with or is invalid token
        return {
            "error": "Unauthorised",
            "message": "Invalid or expired verification token",
        }, 401

    # Token is valid
    user_id = data["sub"]
    user = User.query.filter_by(id=user_id).first()

    # Check if token has already been used
    if user.last_password_reset_token == token:
        return {
            "error": "Invalid token",
            "description": "This password reset link has already been used.",
        }, 401

    return {
        "message": "Account verification successful",
        "email": user.email,
    }, 200


@user_authentication.route("/reset_password", methods=["post"])
def reset_password():
    data = request.get_json()
    email, token = data["email"], data["token"]
    password, confirm_password = data["password"], data["confirmPassword"]

    if not validate_email(email):
        return {
            "error": "Invalid email address",
            "description": "Please enter a valid email address (e.g., john.doe@gmail.com)",
        }, 400

    user = User.query.filter_by(email=email).first()

    # Check if reset link has already been used
    if user.last_password_reset_token == token:
        return {
            "error": "Invalid token",
            "description": "This password reset link has already been used.",
        }, 401

    password_errors = " ".join(validate_password_format(password))
    if password_errors:
        return {
            "error": "Invalid password format",
            "description": password_errors,
        }, 400

    # Confirm passwords match
    if password != confirm_password:
        return {
            "error": "Passwords do not match",
            "description": "Please make sure both passwords are identical.",
        }, 400

    # Update user password in the database
    user = db.session.get(User, user.id)
    user.update_password(password)
    user.update_last_password_reset_token(token)
    db.session.add(user)
    db.session.commit()

    return {"message": "Password updated successfully"}, 200


@user_authentication.route("/request_password_reset", methods=["post"])
def request_password_reset():
    """
    Handles the password reset request process for users who have forgotten their
    password.

    This view function supports both GET and POST methods. It displays a password reset
    request form and processes the form submission. If the form is submitted and
    validated successfully, it checks if the email provided exists in the database and
    is not linked to an OAuth provider. If these conditions are met, it generates a
    password reset token and sends a reset email to the user.

    Behavior:
    - If the user is already authenticated, they are redirected to the dashboard.
    - On GET request: Displays the password reset form.
    - On POST request: Validates the form and, if valid, sends a password reset email.
                       If the email does not exist in the database or is invalid, it
                       displays appropriate errors.

    Returns:
    - If the user is authenticated: Redirects to the dashboard.
    - If the form submission is invalid or an email is not found: Renders the form with
      error messages.
    - If the reset email is sent successfully: Renders a confirmation page indicating
      the email has been sent.
    """
    data = request.get_json()
    email = data["email"]

    if not validate_email(email):
        return {
            "error": "Invalid email",
            "description": "Please enter a valid email address.",
        }, 400

    # If user exists and isn't using OAuth for login
    user = User.query.filter_by(email=email).first()
    if user and not user.provider:
        token = create_access_token(
            identity=user.id, expires_delta=timedelta(seconds=600)
        )
        send_password_reset_email(
            user_email=user.email, token=token, username=user.username
        )

    return {"success": "Verification email (potentially) sent"}, 200


@user_authentication.route("/auth/me", methods=["get"])
@jwt_required()
def authenticate_user():
    user = db.session.get(User, get_jwt_identity())
    return {"email": user.email, "username": user.username}, 200


# #################### HELPER FUNCTIONS ####################
def validate_password_format(input_password: str) -> list[str]:
    """
    Validates the format of a user's password based on several criteria.

    This function checks if the provided password meets the following conditions:
    - Contains at least one uppercase letter.
    - Contains at least one lowercase letter.
    - Contains at least one digit (0-9).
    - Contains at least one special character from a predefined set
      (PASSWORD_ALLOWED_SPECIAL_CHARS).
    - Is at least 8 characters in length.

    Parameters:
    input_password (str): The password string to validate.

    Returns:
    list: A list of error messages for each criterion that the password fails to meet.
    An empty list indicates that the password meets all the criteria.
    """
    password_errors = []

    if not any(char.isupper() for char in input_password):
        password_errors.append("Password must include at least one uppercase letter.")
    if not any(char.islower() for char in input_password):
        password_errors.append(
            "Password must include at least one lowercase character."
        )
    if not any(char.isdigit() for char in input_password):
        password_errors.append("Password must include at least one digit (0-9).")
    if not any(char in PASSWORD_ALLOWED_SPECIAL_CHARS for char in input_password):
        password_errors.append("Password must include at least one special character.")
    if not len(input_password) >= 8:
        password_errors.append("Password must be at least 8 characters long.")

    return password_errors


def send_password_reset_email(user_email: str, token: str, username: str) -> None:
    """
    Sends a password reset email to a user.

    This function composes and sends an email with a password reset link that includes
    a security token. The email is sent to the user's email address provided during
    registration or stored in the user's profile.

    Parameters:
    user_email (str): The email address of the user to whom the password reset email
                      will be sent.
    token (str): A unique security token used for verifying the identity of the user
                 during the password reset process.
    username (str): The username of the user, used to personalize the email content.

    Returns:
    None: The function sends an email and does not return any value.
    """
    from app import mail_server

    html_body = render_template(
        "passwordReset/password-reset-email.html", token=token, username=username
    )
    msg = Message(
        subject="Reset your CoinPulse password",
        sender="MAIL_DEFAULT_SENDER",
        recipients=[user_email],
        html=html_body,
    )
    mail_server.send(msg)


def send_activation_email(user_email: str, token: str, username: str) -> None:
    """
    Sends a verification email to the specified user.

    Creates and sends an email which consists of a verification token embedded within
    an HTML template. Email is sent using the configured mail server to the user's
    email address.

    Parameters:
        user_email: Email address of user to whom the verification email will be sent
        token: The verification token to be included in the email for user verification
    """
    from app import mail_server

    html_body = render_template(
        "emailVerification/verification-email.html", token=token, username=username
    )
    msg = Message(
        subject="Verify Your CoinPulse Account",
        sender="MAIL_DEFAULT_SENDER",
        recipients=[user_email],
        html=html_body,
    )
    mail_server.send(msg)
