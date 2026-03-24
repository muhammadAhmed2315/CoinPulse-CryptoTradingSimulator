import os

DISCORD_OAUTH2_CLIENT_ID = os.getenv("DISCORD_OAUTH2_CLIENT_ID")
DISCORD_OAUTH2_CLIENT_SECRET = os.getenv("DISCORD_OAUTH2_CLIENT_SECRET")
DISCORD_API_BASE_URL = os.environ.get("API_BASE_URL", "https://discordapp.com/api")
DISCORD_AUTHORIZATION_BASE_URL = DISCORD_API_BASE_URL + "/oauth2/authorize"
DISCORD_TOKEN_URL = DISCORD_API_BASE_URL + "/oauth2/token"
DISCORD_OAUTH2_REDIRECT_URI = (
    "https://coin-pulse-ffda7bc3f791.herokuapp.com/callback_discord"
)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_AUTHORIZATION_BASE_URL = "https://accounts.google.com/o/oauth2/auth"
GOOGLE_TOKEN_URL = "https://accounts.google.com/o/oauth2/token"
GOOGLE_REDIRECT_URI = "http://localhost:5000/callback_google"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v1/userinfo"
GOOGLE_SCOPE = ["profile", "email"]

MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

TOKEN_GENERATOR_SECRET_KEY = os.getenv("TOKEN_GENERATOR_SECRET_KEY")
TOKEN_GENERATOR_SALT = os.getenv("TOKEN_GENERATOR_SALT")
TOKEN_GENERATOR_EXPIRATION_TIME_SECONDS = 3600

COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")
COINGECKO_API_HEADERS = {
    "accept": "application/json",
    "x-cg-demo-api-key": COINGECKO_API_KEY,
}

POSTGRESQL_USERNAME = os.getenv("POSTGRESQL_USERNAME")
POSTGRESQL_PASSWORD = os.getenv("POSTGRESQL_PASSWORD")

REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_SECRET_KEY = os.getenv("REDDIT_SECRET_KEY")
REDDIT_USERNAME = os.getenv("REDDIT_USERNAME")
REDDIT_PASSWORD = os.getenv("REDDIT_PASSWORD")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT")

OPEN_TRADE_UPDATE_INTERVAL_SECONDS = 60
WALLET_VALUE_UPDATE_INTERVAL_SECONDS = 1800

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ACCESS_TOKEN_EXPIRES_HOURS = 1
JWT_REFRESH_TOKEN_EXPIRES_DAYS = 7

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

PASSWORD_ALLOWED_SPECIAL_CHARS = [
    "~",
    "`",
    "!",
    "@",
    "#",
    "$",
    "%",
    "^",
    "&",
    "*",
    "(",
    ")",
    "-",
    "_",
    "+",
    "=",
    "{",
    "}",
    "[",
    "]",
    "|",
    "\\",
    ";",
    ":",
    '"',
    "<",
    ">",
    ",",
    ".",
    "/?",
    "/",
]
