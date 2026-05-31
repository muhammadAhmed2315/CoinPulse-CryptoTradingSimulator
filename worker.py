import threading
import time

# Importing `app` runs create_app() at module import time, which configures the
# Flask app the background thread functions rely on (they each import `app` from
# this module and manage their own `with app.app_context():`).
from app import app
from core.app import (
    update_open_trades_in_background,
    update_user_wallet_value_in_background,
)


def main():
    """
    Dedicated single worker process that runs the background tasks exactly once.

    Mirrors the thread-start logic in app.py's `__main__` block so that limit/stop
    orders auto-execute and wallet values update in production (where gunicorn serves
    the web process and never runs that block).
    """
    # Run thread to continuously update user wallet value in the background
    threadOne = threading.Thread(target=update_user_wallet_value_in_background)
    threadOne.daemon = True
    threadOne.start()

    # Run thread to continuously monitor and execute open trades in the background
    threadTwo = threading.Thread(target=update_open_trades_in_background)
    threadTwo.daemon = True
    threadTwo.start()

    # Keep the main thread alive so the daemon threads keep running.
    while True:
        time.sleep(60)


if __name__ == "__main__":
    main()
