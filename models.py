from extensions import db
from sqlalchemy import Boolean
from flask_login import UserMixin, current_user
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model, UserMixin):
    """
    User model class (for the database) that supports authentication and additional
    properties inlcuding support for OAuth providers.

    Attributes:
        id: Unique identifier for the user, serves as the primary key
        email: User's email address, must be unique
        password_hash: Hashed and salted version of the user's password for secure
                       storage
        provider: Name of the OAuth provider, if relevant for that account
        provider_id: Identifier from the OAuth provider, if relevant for that account
        verified: Boolean flag to indicate whether the user's email is verified
    """

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.Text, nullable=False, unique=True)
    password_hash = db.Column(db.Text, nullable=True)
    provider = db.Column(db.Text, nullable=True)
    provider_id = db.Column(db.Text, nullable=True)
    verified = db.Column(Boolean, default=False, nullable=False)

    def __init__(self, email, password=None, provider=None, provider_id=None):
        """
        Initialises a new User instance.

        Parameters:
            email: User's email address
            password: User's password; will be hashed and salted before being stored in
                      the database
            provider: The OAuth provider's name (if applicable)
            provider_id: The OAuth provider's user identifier (if applicable)
        """
        self.email = email
        if password:
            self.password_hash = generate_password_hash(password)
        if provider and provider_id:
            self.provider = provider
            self.provider_id = provider_id

    def check_password(self, password):
        """
        Checks input password against the stored hash

        Parameters:
            password: The password to verify

        Returns:
            bool: True if password matches hash, else false
        """
        if self.password_hash:
            return check_password_hash(self.password_hash, password)
        return False

    def is_oauth_user(self):
        """
        Checks whether a user registered via an OAuth provider

        Returns:
            bool: True if the user is an OAuth user, else False
        """
        return self.provider and self.provider_id
