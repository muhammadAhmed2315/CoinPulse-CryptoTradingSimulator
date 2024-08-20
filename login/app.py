from models import User
from home.app import home
from extensions import db
from login.forms import LoginForm, RegisterForm
from constants import MOST_COMMON_PASSWORDS
from validate_email_address import validate_email
from constants import PASSWORD_ALLOWED_SPECIAL_CHARS
from flask import render_template, redirect, request, url_for, Blueprint, session
from flask_login import login_user, login_required, logout_user, current_user

login_register = Blueprint("login_register", __name__)


@login_register.route("/login", methods=["get", "post"])
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


@login_register.route("/register", methods=["get", "post"])
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


@login_register.route("/logout")
def logout():
    """
    View function for logging out the current user and redirecting them to the log in
    page.
    """
    logout_user()
    return render_template("register.html", form=RegisterForm())
