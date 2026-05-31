"""wallet balance >= 0 check constraint

Revision ID: c1f4a9b2d3e7
Revises: 8693137a7546
Create Date: 2026-05-31 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c1f4a9b2d3e7'
down_revision = '8693137a7546'
branch_labels = None
depends_on = None


def upgrade():
    op.create_check_constraint(
        "ck_wallets_balance_nonneg", "wallets", "balance >= 0"
    )


def downgrade():
    op.drop_constraint("ck_wallets_balance_nonneg", "wallets", type_="check")
