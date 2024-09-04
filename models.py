from extensions import db
from sqlalchemy import Boolean
from flask_login import UserMixin, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict
import time


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

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = db.Column(db.Text, nullable=False, unique=True)
    password_hash = db.Column(db.Text, nullable=True)
    provider = db.Column(db.Text, nullable=True)
    provider_id = db.Column(db.Text, nullable=True)
    verified = db.Column(Boolean, default=False, nullable=False)
    wallet = db.Relationship("Wallet", backref="owner", uselist=False)

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

    def update_password(self, password):
        if not self.provider and self.provider_id:
            self.password_hash = generate_password_hash(password)

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


class Wallet(db.Model):
    __tablename__ = "wallets"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    balance = db.Column(db.Float, default=1000000)
    assets = db.Column(MutableDict.as_mutable(JSONB), default={}, nullable=False)
    time_created = db.Column(
        db.Integer, default=lambda: int(time.time()), nullable=False
    )
    status = db.Column(db.Text, default="active", nullable="False")
    total_current_value = db.Column(db.Float, default=0.0, nullable=False)
    owner_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"))
    transactions = db.relationship("Transaction", backref="wallet", lazy="dynamic")

    def __init__(self, owner_id):
        self.owner_id = owner_id

    def update_balance_add(self, amount):
        self.balance += amount

    def update_balance_subtract(self, amount):
        self.balance -= amount

    def update_assets_add(self, coin_id, quantity):
        if coin_id in self.assets:
            self.assets[coin_id] += quantity
        else:
            self.assets[coin_id] = quantity

    def update_assets_subtract(self, coin_id, quantity):
        self.assets[coin_id] -= quantity

    def has_enough_balance(self, amount):
        return self.balance >= amount

    def has_enough_coins(self, coin_id, coin_quantity):
        return self.assets.get(coin_id, 0) >= coin_quantity


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.Integer, default=lambda: int(time.time()), nullable=False)
    coin_id = db.Column(db.Text, nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    price_per_unit = db.Column(db.Float, nullable=False)
    comment = db.Column(db.Text)
    balance_before = db.Column(db.Float, nullable=False)
    balance_after = db.Column(db.Float, nullable=False)
    wallet_id = db.Column(UUID(as_uuid=True), db.ForeignKey("wallets.id"))

    def __init__(
        self,
        type,
        coin_id,
        quantity,
        price_per_unit,
        wallet_id,
        comment,
        balance_before,
    ):
        self.type = type
        self.coin_id = coin_id
        self.quantity = quantity
        self.comment = comment
        self.price_per_unit = price_per_unit
        self.wallet_id = wallet_id
        self.balance_before = balance_before
        if type == "buy":
            self.balance_after = balance_before - (quantity * price_per_unit)
        elif type == "sell":
            self.balance_after = balance_before + (quantity * price_per_unit)
