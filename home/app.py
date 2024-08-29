from flask import render_template, request, Blueprint
from flask_login import current_user, login_required

home = Blueprint("home", __name__)


@home.route("/index")
@login_required
def index():
    user_email = current_user.email
    return render_template("core/dashboard.html", user_email=user_email)
