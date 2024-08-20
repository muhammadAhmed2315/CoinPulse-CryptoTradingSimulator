import os
from models import User
from home.app import home
from extensions import db
from constants import MOST_COMMON_PASSWORDS
from requests_oauthlib import OAuth2Session
from login.forms import LoginForm, RegisterForm
from validate_email_address import validate_email
from constants import PASSWORD_ALLOWED_SPECIAL_CHARS
from flask import render_template, redirect, request, url_for, Blueprint, session
from flask_login import login_user, login_required, logout_user, current_user


user_authentication = Blueprint("user_authentication", __name__)

# #################### GOOGLE OAUTH AUTHENTICATION ####################
# OAuth configuration via environment variables
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"  # Only for development on localhost
client_id = ""
client_secret = ""
authorization_base_url = "https://accounts.google.com/o/oauth2/auth"
token_url = "https://accounts.google.com/o/oauth2/token"
redirect_uri = "http://127.0.0.1:5000/google_callback"
userinfo_url = "https://www.googleapis.com/oauth2/v1/userinfo"
scope = ["profile", "email"]


@user_authentication.route("/login_google")
def login_google():
    """
    Initiates OAuth2 authentication with Google.

    This function creates an OAuth2 session with the specified client ID, redirect URI,
    and scope. It then constructs the authorization URL for Google's OAuth2 service,
    specifying that the access should be offline (allowing for refresh tokens) and
    prompting the user to select an account if multiple are logged in.

    The user is then redirected to the authorization URL to complete the login process.

    Returns:
        Redirect: A redirection response object that directs the user to Google's
                  OAuth2 login page.
    """
    google = OAuth2Session(client_id, redirect_uri=redirect_uri, scope=scope)
    authorization_url, state = google.authorization_url(
        authorization_base_url, access_type="offline", prompt="select_account"
    )
    session["oauth_state"] = state
    return redirect(authorization_url)


@user_authentication.route("/google_callback")
def google_callback():
    """
    Handles the callback from Google OAuth2 authentication.

    This function retrieves the OAuth2 state from the session and uses it to create a new
    OAuth2Session. It then exchanges the authorization code returned by Google for an access token,
    which is then saved in the session.

    Subsequently, it fetches the user's email and ID from Google's userinfo endpoint.
    If the user does not already exist in the database, a new user record is created
    with details obtained from Google.

    Finally, it logs in the user and redirects them to the home page.

    Returns:
        Redirect: A redirection response object that directs the user to the home page
                  after login.
    """
    # Fetches and saves token in the session data
    google = OAuth2Session(
        client_id, state=session.get("oauth_state"), redirect_uri=redirect_uri
    )
    token = google.fetch_token(
        token_url, client_secret=client_secret, authorization_response=request.url
    )
    session["google_token"] = token

    # Getting user email
    userinfo_response = google.get(userinfo_url)
    userinfo = userinfo_response.json()
    user_email = userinfo.get("email")
    user_id = userinfo.get("id")

    # Check if user already exists in the database
    user = User.query.filter_by(email=user_email).first()
    if not user:
        # Create the user, add to the database and then login
        user = User(email=user_email, provider="google", provider_id=user_id)
        db.session.add(user)
        db.session.commit()

    login_user(user)
    return redirect(url_for("home.index"))


# #################### DEFAULT AUTHENTICATION ####################
@user_authentication.route("/login", methods=["get", "post"])
def login():
    """
    View function to handle login requests. Redirects users who are already logged in to
    the home page. Handles form submission and validates login credentials. Successfully
    validated users are redirected to either the home page, or the restricted page
    they were trying to access.
    """
    if current_user.is_authenticated:
        return redirect(url_for("home.index"))  # TODO

    form = LoginForm()

    if form.is_submitted() and form.validate():
        user = User.query.filter_by(email=form.email.data).first()

        if not user:
            form.password.errors.append("Incorrect email or password")
            return render_template("login.html", form=form)

        if user.check_password(form.password.data):
            login_user(user)

            if next == None or next[0] != "/":
                next = url_for("core.index")

            return redirect(next)
        else:
            form.password.errors.append("Incorrect email or password")
            return render_template("login.html", form=form)

    return render_template("login.html", form=form)


@user_authentication.route("/register", methods=["get", "post"])
def register():
    """
    View function to handle registration requests. Redirects users who are already
    logged in to the home page. Handles form submission, and validates the input by
    checking the email is in the correct format, checking against common passwords, and
    ensuring the password meets the complexity requirements. Register the user and add
    them to the database if successful, and then redirect them to the home page.
    """
    if current_user.is_authenticated:
        return redirect(url_for("home.index"))

    form = RegisterForm()

    if form.is_submitted() and form.validate():
        input_email = form.email.data
        input_password = form.password.data
        input_pass_confirm = form.pass_confirm.data

        # Confirm email is valid format
        if not validate_email(input_email):
            form.email.errors.append("Email is invalid")
            return render_template("register.html", form=form)

        # Confirm email is not already in use
        user = User.query.filter_by(email=input_email).first()
        if user:
            form.email.errors.append("Email is already registered")
            return render_template("register.html", form=form)

        # Confirm password is not in too common list
        if input_password.lower() in MOST_COMMON_PASSWORDS:
            form.password.errors.append(
                "This password is too common. Choose a less common password for better security."
            )
            return render_template("register.html", form=form)

        # Confirm password is correct format
        password_errors = []
        if not any(char.isupper() for char in input_password):
            password_errors.append(
                "Password must include at least one uppercase letter"
            )
        if not any(char.islower() for char in input_password):
            password_errors.append(
                "Password must include at least one lowercase character"
            )
        if not any(char.isdigit() for char in input_password):
            password_errors.append("Password must include at least one digit (0-9)")
        if not any(char in PASSWORD_ALLOWED_SPECIAL_CHARS for char in input_password):
            password_errors.append(
                "Password must include at least one special character"
            )
        if not len(input_password) >= 8:
            password_errors.append("Password must be at least 8 characters long")

        if not password_errors:
            for error in password_errors:
                form.password.errors.append(error)
            return render_template("register.html", form=form)

        # Confirm passwords match
        if input_password != input_pass_confirm:
            form.password.errors.append("Passwords do not match")
            form.pass_confirm.errors.append("Passwords do not match")
            return render_template("register.html", form=form)

        # Login the user
        user = User(form.email.data, form.password.data)
        db.session.add(user)
        db.session.commit()
        return redirect(url_for("home.index"))
    return render_template("register.html", form=form)


@user_authentication.route("/logout")
def logout():
    """
    View function for logging out the current user and redirecting them to the log in
    page.
    """
    logout_user()
    return render_template("register.html", form=RegisterForm())
