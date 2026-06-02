import logging
import threading
import time


def supervise_threads(specs, poll_interval=30, restart_backoff=5):
    """
    Start each background task as a daemon thread and keep it alive.

    The background task functions (e.g. update_user_wallet_value_in_background,
    update_open_trades_in_background) are long-running `while True` loops. They
    handle expected errors internally and continue, but an unexpected, unhandled
    exception would otherwise let the thread exit silently with nothing to notice
    or restart it. This supervisor closes that gap.

    Args:
        specs: an iterable of (name, target) pairs, where `target` is the callable
            to run in a daemon thread and `name` is a human-readable label used for
            logging and thread naming.
        poll_interval: seconds between liveness checks.
        restart_backoff: seconds to wait before restarting a dead thread, so a task
            that crashes immediately on start does not spin in a tight restart loop.

    Blocks forever. Run it in the process's main thread (e.g. worker.py) or in a
    dedicated daemon thread (e.g. app.py's dev `__main__`, where app.run() owns the
    main thread).
    """
    specs = list(specs)
    threads = {}

    def start(name, target):
        thread = threading.Thread(target=target, name=name, daemon=True)
        thread.start()
        threads[name] = thread

    for name, target in specs:
        start(name, target)

    while True:
        time.sleep(poll_interval)
        for name, target in specs:
            if not threads[name].is_alive():
                logging.error(
                    "Background task %r died; restarting in %ss",
                    name,
                    restart_backoff,
                )
                time.sleep(restart_backoff)
                start(name, target)
