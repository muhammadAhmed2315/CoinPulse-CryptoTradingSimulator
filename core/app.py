from flask import render_template, request, Blueprint
from flask_login import current_user, login_required
from constants import COINGECKO_API_KEY

core = Blueprint("core", __name__)


@core.route("/index")
@login_required
def index():
    user_email = current_user.email
    return render_template(
        "core/dashboard.html",
        user_email=user_email,
        COINGECKO_API_KEY=COINGECKO_API_KEY,
    )
