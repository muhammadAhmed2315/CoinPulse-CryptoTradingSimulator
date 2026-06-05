"""Exact-decimal money helpers.

Money and coin quantities are stored as Postgres ``NUMERIC`` (Python ``Decimal``)
so the ledger never accumulates floating-point drift. Floats only appear at the
edges: CoinGecko prices come in as floats and values are serialized back out as
floats for the frontend. Everything in between must be ``Decimal``.

This module is intentionally dependency-free (no Flask/SQLAlchemy imports) so it
can be used from ``models.py`` and the request handlers without circular imports.
"""

from decimal import Decimal, ROUND_HALF_UP, ROUND_DOWN

# Smallest representable units, matching the NUMERIC scales in the schema.
USD_SCALE = Decimal("1E-8")  # NUMERIC(20, 8)
QTY_SCALE = Decimal("1E-18")  # NUMERIC(38, 18)

# A coin position at or below this is treated as fully closed and removed, so a
# sell-to-zero doesn't leave a dust key behind. Replaces the old 1e-8 float epsilon.
DUST_QTY = QTY_SCALE


def D(x) -> Decimal:
    """Coerce a value to ``Decimal`` safely.

    Floats are routed through ``str`` first so we get the human-meaningful value
    (``Decimal(str(0.1)) == Decimal("0.1")``) rather than the exact binary
    artefact (``Decimal(0.1) == 0.1000000000000000055...``). ``Decimal``/``int``/
    ``str`` pass straight through.
    """
    if isinstance(x, Decimal):
        return x
    if isinstance(x, float):
        return Decimal(str(x))
    return Decimal(x)


def quantize_usd(d: Decimal) -> Decimal:
    """Round a USD amount to the stored scale (8 dp), half-up like a ledger."""
    return D(d).quantize(USD_SCALE, rounding=ROUND_HALF_UP)


def quantize_qty(d: Decimal) -> Decimal:
    """Round a coin quantity to the stored scale (18 dp), down — never credit
    more of a coin than actually exists."""
    return D(d).quantize(QTY_SCALE, rounding=ROUND_DOWN)


# ----- JSONB quantity dict helpers -------------------------------------------
# Wallet.assets / reserved_assets are JSONB dicts {coin_id: quantity}. JSON has
# no decimal type, so quantities are stored as decimal STRINGS and converted at
# the boundary with these helpers.


def qty_get(d: dict, coin_id: str) -> Decimal:
    """Read a coin quantity from a JSONB dict as ``Decimal`` (0 if absent)."""
    return D(d.get(coin_id, "0"))


def qty_set(d: dict, coin_id: str, quantity: Decimal) -> None:
    """Write a coin quantity into a JSONB dict as a decimal string."""
    d[coin_id] = str(quantize_qty(quantity))
