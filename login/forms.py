from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, ValidationError
from wtforms.validators import DataRequired, EqualTo
from models import User


class LoginForm(FlaskForm):
    """Creates a form for users to log in with their email and password"""

    email = StringField(
        render_kw={"placeholder": "Email", "class": "input input--email"},
        validators=[DataRequired()],
    )
    password = PasswordField(
        render_kw={
            "placeholder": "Password",
            "class": "input input--password",
        },
        validators=[DataRequired()],
    )
    submit = SubmitField("Login", render_kw={"class": "submit-btn"})


class PickUsernameForm(FlaskForm):
    """Creates a form for users to pick a username"""

    username = StringField(
        "Username", render_kw={"placeholder": "john2024"}, validators=[DataRequired()]
    )
    submit = SubmitField("Submit")


class RegisterForm(FlaskForm):
    """
    Creates a form for users to register by entering their email, password, and
    confirming their password
    """

    email = StringField(
        render_kw={"placeholder": "Email", "class": "input input--email"},
        validators=[DataRequired()],
    )
    username = StringField(
        render_kw={"placeholder": "Username", "class": "input input--username"},
        validators=[DataRequired()],
    )
    password = PasswordField(
        render_kw={"placeholder": "Password", "class": "input input--password"},
        validators=[DataRequired()],
    )
    pass_confirm = PasswordField(
        render_kw={
            "placeholder": "Confirm Password",
            "class": "input input--pass-confirm",
        },
        validators=[DataRequired()],
    )
    submit = SubmitField("Create Your Account", render_kw={"class": "submit-btn"})


class RequestPasswordResetForm(FlaskForm):
    """Creates a form for users to request a password reset link by entering their email"""

    email = StringField(
        "Email",
        render_kw={"placeholder": "john@example.com"},
        validators=[DataRequired()],
    )
    submit = SubmitField("Send Email")


class PasswordResetForm(FlaskForm):
    """
    Creates a form for users to reset their password by entering a new password and
    confirming that new password
    """

    password = PasswordField(
        "Password",
        render_kw={"placeholder": "******************"},
        validators=[DataRequired()],
    )
    pass_confirm = PasswordField(
        "Confirm Password",
        render_kw={"placeholder": "******************"},
        validators=[DataRequired()],
    )
    submit = SubmitField("Sign Up")
