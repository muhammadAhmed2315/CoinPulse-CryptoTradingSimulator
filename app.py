import os
import threading
import uuid
from datetime import timedelta

from flask import Flask, send_from_directory
from flask_compress import Compress
from flask_cors import CORS
from flask_mail import Mail
from flask_migrate import Migrate

from constants import (
    JWT_ACCESS_TOKEN_EXPIRES_HOURS,
    JWT_REFRESH_TOKEN_EXPIRES_DAYS,
    JWT_SECRET_KEY,
    MAIL_PASSWORD,
    MAIL_USERNAME,
    FLASK_APP_SECRET_KEY,
    FLASK_ENV,
)
from extensions import db, jwt, login_manager
from models import User


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
    CORS(
        app,
        supports_credentials=True,
        origins=os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(","),
        allow_headers=["Content-Type", "X-CSRF-TOKEN"],
    )

    # Compress responses (brotli preferred, gzip fallback) over the wire. This
    # wraps every response, including the static React assets served by
    # serve_frontend via send_from_directory.
    Compress(app)

    # Configure app
    database_url = os.environ.get("DATABASE_URL")
    if database_url and database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    app.config["SECRET_KEY"] = FLASK_APP_SECRET_KEY
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
    app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
    app.config["JWT_COOKIE_HTTPONLY"] = True
    app.config["JWT_COOKIE_SAMESITE"] = "Lax"
    # Secure cookies in production only; browsers drop Secure cookies over http://localhost.
    app.config["JWT_COOKIE_SECURE"] = FLASK_ENV == "production"
    app.config["JWT_COOKIE_CSRF_PROTECT"] = True
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
    from core.app import core
    from login.app import user_authentication

    # Register blueprints
    app.register_blueprint(user_authentication)
    app.register_blueprint(core)

    # Serve the built React frontend (single-app Heroku deploy). The Vite build
    # output lives in frontend/dist. Registered blueprint/API rules are static and
    # take routing precedence; any remaining path serves an existing asset, or
    # falls back to index.html so client-side (react-router) routes resolve.
    frontend_dist = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "frontend", "dist"
    )

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        asset = os.path.join(frontend_dist, path)
        if path and os.path.isfile(asset):
            resp = send_from_directory(frontend_dist, path)
            # Vite emits content-hashed filenames under assets/ (e.g.
            # index-<hash>.js). A content change yields a new filename, so these
            # can be cached forever and never revalidated.
            if path.startswith("assets/"):
                # send_from_directory defaults to "no-cache" (revalidate every
                # use); clear it so the immutable long-lived caching below is
                # not contradicted.
                resp.cache_control.no_cache = None
                resp.cache_control.public = True
                resp.cache_control.max_age = 31536000
                resp.cache_control.immutable = True
            return resp
        # index.html (the SPA fallback) references the hashed asset filenames and
        # must always be revalidated, so it keeps Flask's default caching.
        return send_from_directory(frontend_dist, "index.html")

    # Create database tables
    with app.app_context():
        db.create_all()

    return app, mail_server


app, mail_server = create_app()

if __name__ == "__main__":
    # Create the background task thread
    from core.app import (
        update_open_trades_in_background,
        update_user_wallet_value_in_background,
    )
    from background_supervisor import supervise_threads

    if not app.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        # Supervise the background tasks in a daemon thread (app.run() owns the main
        # thread). supervise_threads starts each task and restarts any that die.
        threading.Thread(
            target=supervise_threads,
            args=(
                [
                    ("wallet-value-updater", update_user_wallet_value_in_background),
                    ("open-trade-executor", update_open_trades_in_background),
                ],
            ),
            daemon=True,
        ).start()

    # NOTE: debug=True is only for development purposes. Do not use in production, else
    # the background threads will run twice.
    app.run(debug=False)
