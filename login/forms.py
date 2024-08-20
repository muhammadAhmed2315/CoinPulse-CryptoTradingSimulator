from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, ValidationError
from wtforms.validators import DataRequired, EqualTo
from models import User


class LoginForm(FlaskForm):
    """Creates a form for users to log in with their email and password"""

    email = StringField(
        "Email",
        render_kw={"placeholder": "john@example.com"},
        validators=[DataRequired()],
    )
    password = PasswordField(
        "Password",
        render_kw={"placeholder": "******************"},
        validators=[DataRequired()],
    )
    submit = SubmitField("Log In")


class RegisterForm(FlaskForm):
    """
    Creates a form for users to register by entering their email, password, and
    confirming their password
    """

    email = StringField(
        "Email",
        render_kw={"placeholder": "john@example.com"},
        validators=[DataRequired()],
    )
    password = PasswordField(
        "Password",
        render_kw={"placeholder": "******************"},
        validators=[DataRequired()],
    )
    pass_confirm = PasswordField(
        "Confirm Password",
        render_kw={"palceholder": "******************"},
        validators=[DataRequired()],
    )
    submit = SubmitField("Sign Up")
