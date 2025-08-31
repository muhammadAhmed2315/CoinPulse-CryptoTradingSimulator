from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired


class LoginForm(FlaskForm):
    """Creates a form for users to log in with their email and password."""

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
    submit_login = SubmitField("Login", render_kw={"class": "submit-btn"})


class TestAccountLoginForm(FlaskForm):
    """Creates a form for users to log in to the test account."""

    submit_test = SubmitField(
        "Login to Test Account", render_kw={"class": "submit-btn submit-btn--test"}
    )


class PickUsernameForm(FlaskForm):
    """Creates a form for users to pick a username"""

    username = StringField(
        render_kw={"placeholder": "Username", "class": "input input--username"},
        validators=[DataRequired()],
    )
    submit = SubmitField("Submit", render_kw={"class": "submit-btn"})


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
        render_kw={
            "placeholder": "Email",
            "class": "input input--email",
        },
        validators=[DataRequired()],
    )
    submit = SubmitField("Send Password Reset Email", render_kw={"class": "submit-btn"})


class PasswordResetForm(FlaskForm):
    """
    Creates a form for users to reset their password by entering a new password and
    confirming that new password
    """

    password = PasswordField(
        render_kw={
            "placeholder": "New Password",
            "class": "input input--password",
        },
        validators=[DataRequired()],
    )
    pass_confirm = PasswordField(
        render_kw={
            "placeholder": "Confirm New Password",
            "class": "input input--pass-confirm",
        },
        validators=[DataRequired()],
    )
    submit = SubmitField("Set New Password", render_kw={"class": "submit-btn"})
