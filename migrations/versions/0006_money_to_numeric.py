"""Store money/quantities as exact NUMERIC (was float / double precision)

Converts every money and coin-quantity column from double precision to NUMERIC
so the ledger no longer accumulates floating-point drift: USD/price columns to
NUMERIC(20, 8), Transaction.quantity to NUMERIC(38, 18), and the ValueHistory
arrays to NUMERIC(20, 8)[]. The JSONB quantity dicts (wallets.assets /
reserved_assets) keep their JSONB type but their numeric values are rewritten as
decimal strings, since JSON has no decimal type and floats would round-trip lossily.

Revision ID: 0006_money_to_numeric
Revises: 0005_vh_wallet_id_notnull_uniq
Create Date: 2026-06-05 00:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "0006_money_to_numeric"
down_revision = "0005_vh_wallet_id_notnull_uniq"
branch_labels = None
depends_on = None


def upgrade():
    # --- Scalar money/quantity columns (float -> NUMERIC, explicit USING cast) ---
    op.execute(
        """
        ALTER TABLE wallets
            ALTER COLUMN balance TYPE NUMERIC(20, 8) USING balance::NUMERIC(20, 8),
            ALTER COLUMN reserved_balance TYPE NUMERIC(20, 8)
                USING reserved_balance::NUMERIC(20, 8),
            ALTER COLUMN total_current_value TYPE NUMERIC(20, 8)
                USING total_current_value::NUMERIC(20, 8);
        """
    )
    op.execute(
        """
        ALTER TABLE transactions
            ALTER COLUMN quantity TYPE NUMERIC(38, 18) USING quantity::NUMERIC(38, 18),
            ALTER COLUMN price_per_unit TYPE NUMERIC(20, 8)
                USING price_per_unit::NUMERIC(20, 8),
            ALTER COLUMN price_per_unit_at_execution TYPE NUMERIC(20, 8)
                USING price_per_unit_at_execution::NUMERIC(20, 8),
            ALTER COLUMN balance_before TYPE NUMERIC(20, 8)
                USING balance_before::NUMERIC(20, 8),
            ALTER COLUMN balance_after TYPE NUMERIC(20, 8)
                USING balance_after::NUMERIC(20, 8),
            ALTER COLUMN total_value TYPE NUMERIC(20, 8)
                USING total_value::NUMERIC(20, 8);
        """
    )

    # --- ValueHistory parallel arrays (float[] -> NUMERIC(20,8)[]) ---
    op.execute(
        """
        ALTER TABLE value_histories
            ALTER COLUMN balance_history TYPE NUMERIC(20, 8)[]
                USING balance_history::NUMERIC(20, 8)[],
            ALTER COLUMN assets_value_history TYPE NUMERIC(20, 8)[]
                USING assets_value_history::NUMERIC(20, 8)[],
            ALTER COLUMN total_value_history TYPE NUMERIC(20, 8)[]
                USING total_value_history::NUMERIC(20, 8)[];
        """
    )

    # --- JSONB quantity dicts: rewrite each numeric value as a decimal STRING ---
    # Empty dicts are skipped (jsonb_object_agg over no rows returns NULL, which
    # would violate NOT NULL). `v::text` of a JSON number is its canonical text;
    # to_jsonb wraps it as a JSON string.
    for col in ("assets", "reserved_assets"):
        op.execute(
            f"""
            UPDATE wallets
            SET {col} = (
                SELECT jsonb_object_agg(k, to_jsonb(v::text))
                FROM jsonb_each({col}) AS e(k, v)
            )
            WHERE {col} <> '{{}}'::jsonb;
            """
        )


def downgrade():
    # --- JSONB quantity dicts: decimal strings back to JSON numbers ---
    for col in ("assets", "reserved_assets"):
        op.execute(
            f"""
            UPDATE wallets
            SET {col} = (
                SELECT jsonb_object_agg(k, to_jsonb((v #>> '{{}}')::numeric))
                FROM jsonb_each({col}) AS e(k, v)
            )
            WHERE {col} <> '{{}}'::jsonb;
            """
        )

    # --- ValueHistory arrays (NUMERIC(20,8)[] -> double precision[]) ---
    op.execute(
        """
        ALTER TABLE value_histories
            ALTER COLUMN balance_history TYPE DOUBLE PRECISION[]
                USING balance_history::DOUBLE PRECISION[],
            ALTER COLUMN assets_value_history TYPE DOUBLE PRECISION[]
                USING assets_value_history::DOUBLE PRECISION[],
            ALTER COLUMN total_value_history TYPE DOUBLE PRECISION[]
                USING total_value_history::DOUBLE PRECISION[];
        """
    )

    # --- Scalar columns (NUMERIC -> double precision) ---
    op.execute(
        """
        ALTER TABLE transactions
            ALTER COLUMN quantity TYPE DOUBLE PRECISION USING quantity::DOUBLE PRECISION,
            ALTER COLUMN price_per_unit TYPE DOUBLE PRECISION
                USING price_per_unit::DOUBLE PRECISION,
            ALTER COLUMN price_per_unit_at_execution TYPE DOUBLE PRECISION
                USING price_per_unit_at_execution::DOUBLE PRECISION,
            ALTER COLUMN balance_before TYPE DOUBLE PRECISION
                USING balance_before::DOUBLE PRECISION,
            ALTER COLUMN balance_after TYPE DOUBLE PRECISION
                USING balance_after::DOUBLE PRECISION,
            ALTER COLUMN total_value TYPE DOUBLE PRECISION
                USING total_value::DOUBLE PRECISION;
        """
    )
    op.execute(
        """
        ALTER TABLE wallets
            ALTER COLUMN balance TYPE DOUBLE PRECISION USING balance::DOUBLE PRECISION,
            ALTER COLUMN reserved_balance TYPE DOUBLE PRECISION
                USING reserved_balance::DOUBLE PRECISION,
            ALTER COLUMN total_current_value TYPE DOUBLE PRECISION
                USING total_current_value::DOUBLE PRECISION;
        """
    )
