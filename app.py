import os
import logging
from flask import Flask
from models import User
from flask_mail import Mail
from flask_migrate import Migrate
from constants import MAIL_USERNAME
from constants import MAIL_PASSWORD
from extensions import db, login_manager, jwt
import uuid
from constants import (
    JWT_SECRET_KEY,
    JWT_ACCESS_TOKEN_EXPIRES_HOURS,
    JWT_REFRESH_TOKEN_EXPIRES_DAYS,
)
import threading
from flask_cors import CORS
from datetime import timedelta

# Configure logging
log = logging.getLogger("werkzeug")


def create_app():
    """
    Creates an configures an instance of a Flask application.

    Sets up configuration settings for the app and the associated database. Sets up the
    database and the login manager. Registers blueprints and prepares database tables
    if necessary.

    Returns:
        app: Configured Flask application
    """
    # Initialize Flask app
    app = Flask(__name__)
    CORS(app)

    # Configure app
    database_url = os.environ.get("DATABASE_URL")
    if database_url and database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    app.config["SECRET_KEY"] = "mysecretkey"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url

    # Configure mail
    app.config["MAIL_SERVER"] = "smtp.gmail.com"
    app.config["MAIL_PORT"] = 465
    app.config["MAIL_USERNAME"] = MAIL_USERNAME
    app.config["MAIL_PASSWORD"] = MAIL_PASSWORD
    app.config["MAIL_USE_TLS"] = False
    app.config["MAIL_USE_SSL"] = True

    # Initialise Mail object
    mail_server = Mail(app)

    # Configure JWT manager
    app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(
        hours=JWT_ACCESS_TOKEN_EXPIRES_HOURS
    )
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(
        days=JWT_REFRESH_TOKEN_EXPIRES_DAYS
    )

    # Initialize JWTManager with the app
    jwt.init_app(app)

    # Initialize database
    db.init_app(app)
    Migrate(app, db)

    # Initialize login manager
    login_manager.init_app(app)
    login_manager.login_view = "user_authentication.login"

    @login_manager.user_loader
    def load_user(user_id):
        """
        Required user_loader callback for Flask-Login, loads a user from the database.

        Parameters:
            user_id: The user ID stored in the session

        Returns:
            User: The user object if found, None otherwise
        """
        uid = uuid.UUID(user_id, version=4)
        return db.session.get(User, uid)

    # Import blueprints
    from login.app import user_authentication
    from core.app import core
    from api.app import api

    # Register blueprints
    app.register_blueprint(user_authentication)
    app.register_blueprint(core)
    app.register_blueprint(api, url_prefix="/api")

    # Create database tables
    with app.app_context():
        db.create_all()

    return app, mail_server


app, mail_server = create_app()

if __name__ == "__main__":
    # Create the background task thread
    from core.app import (
        update_user_wallet_value_in_background,
        update_open_trades_in_background,
    )

    if not app.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        # Run thread to continuously update user wallet value in the background
        threadOne = threading.Thread(target=update_user_wallet_value_in_background)
        threadOne.daemon = True
        threadOne.start()

        # Run thread to continuously monitor and execute open trades in the background
        threadTwo = threading.Thread(target=update_open_trades_in_background)
        threadTwo.daemon = True
        threadTwo.start()

    # NOTE: debug=True is only for development purposes. Do not use in production, else
    # the background threads will run twice.
    app.run(debug=False)
