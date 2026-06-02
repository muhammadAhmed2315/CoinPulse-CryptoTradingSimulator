# Importing `app` runs create_app() at module import time, which configures the
# Flask app the background thread functions rely on (they each import `app` from
# this module and manage their own `with app.app_context():`).
from app import app  # noqa: F401  (imported for its create_app() side effect)
from background_supervisor import supervise_threads
from core.app import (
    update_open_trades_in_background,
    update_user_wallet_value_in_background,
)


def main():
    """
    Dedicated single worker process that runs the background tasks.

    Mirrors the thread-start logic in app.py's `__main__` block so that limit/stop
    orders auto-execute and wallet values update in production (where gunicorn serves
    the web process and never runs that block). supervise_threads starts each task as
    a daemon thread and restarts any that die, then blocks the main thread forever.
    """
    supervise_threads(
        [
            ("wallet-value-updater", update_user_wallet_value_in_background),
            ("open-trade-executor", update_open_trades_in_background),
        ]
    )


if __name__ == "__main__":
    main()
