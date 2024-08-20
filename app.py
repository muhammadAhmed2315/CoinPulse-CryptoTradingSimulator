import os
import logging
from flask import Flask
from flask_migrate import Migrate
from extensions import db, login_manager
from models import User

# Configure logging
log = logging.getLogger("werkzeug")


def create_app():
    # Initialize Flask app
    app = Flask(__name__)

    # Configure app
    app.config["SECRET_KEY"] = "mysecretkey"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    if os.environ.get("DATABASE_URL"):
        app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL").replace(
            "postgres://", "postgresql://"
        )
    else:
        basedir = os.path.abspath(os.path.dirname(__file__))
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(
            basedir, "data.sqlite"
        )

    # Initialize database
    db.init_app(app)
    Migrate(app, db)

    # Initialize login manager
    login_manager.init_app(app)
    login_manager.login_view = "login_register.login"

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    # Import blueprints
    from login.app import login_register
    from home.app import home

    # Register blueprints
    app.register_blueprint(login_register)
    app.register_blueprint(home)

    # Create database tables
    with app.app_context():
        db.create_all()

    return app


# Create the app instance
app = create_app()

if __name__ == "__main__":
    # Run the app
    app.run()
