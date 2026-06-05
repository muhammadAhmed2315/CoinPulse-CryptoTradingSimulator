"""make wallets.balance NOT NULL with a server_default

Backfills any existing NULL balances to the starting amount, then alters the
column to be NOT NULL with a server-side default of 1000000 so inserts that
bypass the ORM (raw SQL, bulk inserts) still get a valid balance.

Revision ID: 0002_wallet_balance_not_null
Revises: 0001_initial_schema
Create Date: 2026-06-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0002_wallet_balance_not_null"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("UPDATE wallets SET balance = 1000000 WHERE balance IS NULL")
    op.alter_column(
        "wallets",
        "balance",
        existing_type=sa.Float(),
        nullable=False,
        server_default="1000000",
    )


def downgrade():
    op.alter_column(
        "wallets",
        "balance",
        existing_type=sa.Float(),
        nullable=True,
        server_default=None,
    )