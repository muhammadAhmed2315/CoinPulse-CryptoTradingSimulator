"""wallet open-order fund reservations (reserved_balance / reserved_assets)

Revision ID: d2e5b7c1f9a4
Revises: c1f4a9b2d3e7
Create Date: 2026-05-31 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'd2e5b7c1f9a4'
down_revision = 'c1f4a9b2d3e7'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Add reserved_balance (server_default 0 so existing rows are valid).
    op.add_column(
        "wallets",
        sa.Column(
            "reserved_balance",
            sa.Float(),
            nullable=False,
            server_default="0",
        ),
    )

    # 2. Add reserved_assets JSONB (server_default empty object).
    op.add_column(
        "wallets",
        sa.Column(
            "reserved_assets",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )

    # 3a. Backfill reserved_balance = SUM(quantity * price_per_unit) over each
    #     wallet's OPEN BUY transactions. The model attribute transactionType maps
    #     to the literal mixed-case column "transactionType", so it is quoted here.
    op.execute(
        """
        UPDATE wallets
        SET reserved_balance = COALESCE((
            SELECT SUM(t.quantity * t.price_per_unit)
            FROM transactions t
            WHERE t.wallet_id = wallets.id
              AND t.status = 'open'
              AND t."transactionType" = 'buy'
        ), 0);
        """
    )

    # 3b. Backfill reserved_assets = {coin_id: SUM(quantity)} over each wallet's
    #     OPEN SELL transactions, built as a JSONB object via jsonb_object_agg.
    op.execute(
        """
        UPDATE wallets w
        SET reserved_assets = COALESCE((
            SELECT jsonb_object_agg(s.coin_id, s.qty)
            FROM (
                SELECT t.coin_id AS coin_id, SUM(t.quantity) AS qty
                FROM transactions t
                WHERE t.wallet_id = w.id
                  AND t.status = 'open'
                  AND t."transactionType" = 'sell'
                GROUP BY t.coin_id
            ) s
        ), '{}'::jsonb);
        """
    )

    # 5. Add the reserved invariants AFTER backfill so existing data is checked.
    op.create_check_constraint(
        "ck_wallets_reserved_balance_nonneg", "wallets", "reserved_balance >= 0"
    )
    op.create_check_constraint(
        "ck_wallets_balance_ge_reserved", "wallets", "balance >= reserved_balance"
    )


def downgrade():
    op.drop_constraint(
        "ck_wallets_balance_ge_reserved", "wallets", type_="check"
    )
    op.drop_constraint(
        "ck_wallets_reserved_balance_nonneg", "wallets", type_="check"
    )
    op.drop_column("wallets", "reserved_assets")
    op.drop_column("wallets", "reserved_balance")
