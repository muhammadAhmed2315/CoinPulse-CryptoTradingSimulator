from extensions import db
from sqlalchemy import Boolean, ARRAY
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict, MutableList
import time


class User(db.Model, UserMixin):
    """
    User model class (for the database) that supports authentication and additional
    properties including support for OAuth providers.

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
    username = db.Column(db.Text, unique=True)
    password_hash = db.Column(db.Text, nullable=True)
    provider = db.Column(db.Text, nullable=True)
    provider_id = db.Column(db.Text, nullable=True)
    verified = db.Column(Boolean, default=False, nullable=False)
    wallet = db.relationship("Wallet", backref="owner", uselist=False)

    def __init__(
        self, email, username=None, password=None, provider=None, provider_id=None
    ):
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
        if username:
            self.username = username
        if password:
            self.password_hash = generate_password_hash(password)
        if provider and provider_id:
            self.provider = provider
            self.provider_id = provider_id

    def update_username(self, username):
        """
        Updates the username for the user.

        Parameters:
            username (str): The new username to be assigned to the user.
        """
        self.username = username

    def update_password(self, password):
        """
        Updates the password for the user. If the user is not authenticated via an
        an external provider (e.g., OAuth), this function will update the user's
        hashed password in the database.

        Parameters:
            password (str): The new password to be hashed and stored.
        """
        if not self.provider and not self.provider_id:
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
    """
    Wallet model class (for the database) that stores the user's balance, assets,
    transaction history, etc.

    Attributes:
        id: Unique identifier for the wallet, serves as the primary key
        balance: The user's balance in USD
        assets: A dictionary of the user's assets, where the key is the coin ID and the
                value is the quantity of that coin
        time_created: The time the wallet was created, in UNIX time (in seconds)
        status: The status of the wallet, e.g., "active" or "inactive"
        total_current_value: The total value of the user's assets in USD
        owner_id: The user ID of the wallet owner
        transactions: A relationship to the Transaction model, representing the user's
                      transaction history
        value_history: A relationship to the ValueHistory model, storing the history of
                       the wallet's value
    """

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
    value_history = db.relationship("ValueHistory", backref="wallet", uselist=False)

    def __init__(self, owner_id):
        """
        Initializes a new wallet for the specified owner.

        Parameters:
            owner_id (UUID): The UUID of the user who owns this wallet.
        """
        self.owner_id = owner_id

    def update_balance_add(self, amount):
        """
        Adds a specified amount to the wallet's balance.

        Parameters:
            amount (float): The amount to add to the balance.
        """
        self.balance += amount

    def update_balance_subtract(self, amount):
        """
        Subtracts a specified amount from the wallet's balance.

        Parameters:
            amount (float): The amount to subtract from the balance.
        """
        self.balance -= amount

    def update_assets_add(self, coin_id, quantity):
        """
        Adds a specified quantity of a coin to the wallet's assets.

        Parameters:
            coin_id (str): The identifier for the coin.
            quantity (float): The amount of the coin to add.
        """
        if coin_id in self.assets:
            self.assets[coin_id] += quantity
        else:
            self.assets[coin_id] = quantity

    def update_assets_subtract(self, coin_id, quantity):
        """
        Subtracts a specified quantity of a coin from the wallet's assets.

        Parameters:
            coin_id (str): The identifier for the coin.
            quantity (float): The amount of the coin to subtract.

        Note:
            If subtracting the quantity results in zero holdings of the coin,
            it is removed from the assets dictionary.
        """
        # If transaction results in User owning 0 of the coin, then remove the coin
        # from the assets dictionary
        if self.assets[coin_id] == quantity:
            self.assets.pop(coin_id)
        else:
            self.assets[coin_id] -= quantity

    def has_enough_balance(self, amount):
        """
        Determines if the wallet has enough balance for a transaction.

        Parameters:
            amount (float): The amount to check against the wallet's balance.

        Returns:
            bool: True if the wallet has enough balance, False otherwise.
        """
        return self.balance >= amount

    def has_enough_coins(self, coin_id, coin_quantity):
        """
        Determines if the wallet has enough of a specific coin for a transaction.

        Parameters:
            coin_id (str): The identifier for the coin to check.
            coin_quantity (float): The quantity of the coin to check.

        Returns:
            bool: True if the wallet has enough of the specified coin, False otherwise.
        """
        return self.assets.get(coin_id, 0) >= coin_quantity


class ValueHistory(db.Model):
    """
    ValueHistory model class (for the database) that stores the wallet's total value,
    balance, and assets value over time.

    Attributes:
        id: Unique identifier for the value history, serves as the primary key
        wallet_id: The ID of the wallet to which this value history belongs
        balance_history: A list of the wallet's balance over time
        assets_value_history: A list of the wallet's assets value over time
        total_value_history: A list of the wallet's total value over time
        timestamps: A list of timestamps corresponding to the value history entries
    """

    __tablename__ = "value_histories"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_id = db.Column(UUID(as_uuid=True), db.ForeignKey("wallets.id"))
    balance_history = db.Column(
        MutableList.as_mutable(ARRAY(db.Float)), default=lambda: [1000000]
    )
    assets_value_history = db.Column(
        MutableList.as_mutable(ARRAY(db.Float)), default=lambda: [0]
    )
    total_value_history = db.Column(
        MutableList.as_mutable(ARRAY(db.Float)), default=lambda: [1000000]
    )
    timestamps = db.Column(
        MutableList.as_mutable(ARRAY(db.Integer)), default=lambda: [int(time.time())]
    )

    def __init__(self, wallet_id):
        """
        Initializes a new ValueHistory instance associated with a specific wallet.

        Parameters:
            wallet_id (UUID): The identifier of the wallet for which the value history
                              is being recorded.
        """
        self.wallet_id = wallet_id

    def update_value_history(self, balance_value, assets_value, time):
        """
        Updates the value history by adding new entries for the balance, assets value,
        and total value at a given time.

        Parameters:
            balance_value (float): The current balance of the wallet to be recorded.
            assets_value (float): The current total value of the assets in the wallet
                                  to be recorded.
            time (int): The UNIX timestamp (in seconds) of when the values were
                        recorded.
        """
        self.balance_history.append(balance_value)
        self.assets_value_history.append(assets_value)
        self.total_value_history.append(balance_value + assets_value)
        self.timestamps.append(time)


class Transaction(db.Model):
    """
    Transaction model class (for the database) that stores information about a given
    transaction, including the status, type, order type, coin ID, quantity, etc.

    Attributes:
        id: Unique identifier for the transaction, serves as the primary key (UUID)
        status: The status of the transaction ("open" || "finished" || "cancelled")
        transactionType: The type of transaction ("buy" || "sell")
        orderType: The type of order ("market" || "limit" || "stop")
        timestamp: The UNIX timestamp (in seconds) of when the transaction was created
        coin_id: The identifier of the coin involved in the transaction
        quantity: The quantity of the coin involved in the transaction
        price_per_unit: The price per unit of the coin at the time of the transaction
        price_per_unit_at_execution: The price per unit of the coin at the time of
                                     execution (if applicable)
        comment: A comment or note associated with the transaction
        balance_before: The user's balance before the transaction
        balance_after: The user's balance after the transaction
        total_value: The total value of the transaction
        likes: A relationship to the TransactionLikes model, representing the likes
               associated with the transaction
        visibility: A boolean flag indicating whether the transaction is visible to
                    other users
        wallet_id: The ID of the wallet to which this transaction belongs
    """

    __tablename__ = "transactions"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status = db.Column(db.Text, nullable=False)
    transactionType = db.Column(db.Text, nullable=False)
    orderType = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.Integer, default=lambda: int(time.time()), nullable=False)
    coin_id = db.Column(db.Text, nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    price_per_unit = db.Column(db.Float, nullable=False)
    price_per_unit_at_execution = db.Column(db.Float, default=-1)
    comment = db.Column(db.Text)
    balance_before = db.Column(db.Float, nullable=False)
    balance_after = db.Column(db.Float)
    total_value = db.Column(db.Float, nullable=False)
    likes = db.relationship("TransactionLikes", backref="transaction", uselist=False)
    visibility = db.Column(db.Boolean, nullable=False)
    wallet_id = db.Column(UUID(as_uuid=True), db.ForeignKey("wallets.id"))

    def __init__(
        self,
        status,
        transactionType,
        orderType,
        coin_id,
        quantity,
        price_per_unit,
        wallet_id,
        comment,
        balance_before,
        visibility,
    ):
        """Initializes a new instance of the Transaction class with necessary parameters."""
        self.visibility = visibility
        self.status = status
        self.transactionType = transactionType
        self.orderType = orderType
        self.coin_id = coin_id
        self.quantity = quantity
        self.comment = comment
        self.price_per_unit = price_per_unit
        self.wallet_id = wallet_id
        self.total_value = quantity * price_per_unit
        self.balance_before = balance_before

        if orderType == "market":
            self.price_per_unit_at_execution = price_per_unit
            if transactionType == "buy":
                self.balance_after = balance_before - (quantity * price_per_unit)
            elif transactionType == "sell":
                self.balance_after = balance_before + (quantity * price_per_unit)
        elif orderType == "limit" or orderType == "stop":
            self.price_per_unit_at_execution = None
            self.balance_after = None

    def add_like(self, user_id):
        """
        Adds a like to the transaction by a specific user.

        Parameters:
            user_id (UUID): The ID of the user who is liking the transaction.
        """
        self.likes.add_user_like(user_id)

    def remove_like(self, user_id):
        """
        Removes a like from the transaction by a specific user.

        Parameters:
            user_id (UUID): The ID of the user who is unliking the transaction.
        """
        self.likes.remove_user_like(user_id)

    def get_number_of_likes(self):
        """
        Retrieves the total number of likes this transaction has received.

        Returns:
            int: The number of users who have liked the transaction.
        """
        return len(self.likes.liked_by_user_ids)

    def execute_open_order(self, price_per_unit_at_execution):
        """
        Executes an open order at a specified execution price and updates the
        transaction's status and balance.

        Parameters:
            price_per_unit_at_execution (float): The price per unit at which the order
                                                 is executed.
        """
        self.price_per_unit_at_execution = price_per_unit_at_execution

        if self.transactionType == "buy":
            self.balance_after = self.balance_before - (
                self.quantity * price_per_unit_at_execution
            )
        elif self.transactionType == "sell":
            self.balance_after = self.balance_before + (
                self.quantity * price_per_unit_at_execution
            )
        self.status = "finished"

    def cancel_open_order(self):
        """
        Cancels an open order and sets the user's balance_after to "N/A". Also updates
        the transaction status to "cancelled".
        """
        self.balance_after = "N/A"
        self.status = "cancelled"


class TransactionLikes(db.Model):
    """
    TransactionLikes model class (for the database) that stores the user IDs of users
    who have liked a specific transaction.

    Attributes:
        id: Unique identifier for the transaction likes, serves as the primary key
        liked_by_user_ids: A list of user IDs who have liked the transaction
        transaction_id: The ID of the transaction to which these likes belong
    """

    __tablename__ = "transaction_likes"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    liked_by_user_ids = db.Column(
        MutableList.as_mutable(ARRAY(UUID(as_uuid=True))),
        default=lambda: [],
    )
    transaction_id = db.Column(UUID(as_uuid=True), db.ForeignKey("transactions.id"))

    def __init__(self, transaction_id):
        """
        Initialize a TransactionLikes instance.

        Args:
            transaction_id (UUID): The ID of the transaction to associate likes with.
        """
        self.transaction_id = transaction_id

    def add_user_like(self, user_id):
        """
        Add a user's like to the transaction if they have not already liked it.

        Args:
            user_id (UUID): The ID of the user liking the transaction.
        """
        if user_id not in self.liked_by_user_ids:
            self.liked_by_user_ids.append(user_id)

    def remove_user_like(self, user_id):
        """
        Remove a user's like from the transaction if they have already liked it.

        Args:
            user_id (UUID): The ID of the user whose like is to be removed.
        """
        if user_id in self.liked_by_user_ids:
            self.liked_by_user_ids.remove(user_id)
