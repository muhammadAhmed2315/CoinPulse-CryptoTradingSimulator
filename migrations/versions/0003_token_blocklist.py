"""create token_blocklist table for JWT revocation/rotation

Adds a table of revoked JWT JTIs. The @jwt.token_in_blocklist_loader callback
consults this table on every @jwt_required() request, so revoked access/refresh
tokens are rejected. Refresh tokens are inserted here when rotated (on /refresh)
or invalidated (on /logout).

Revision ID: 0003_token_blocklist
Revises: 0002_wallet_balance_not_null
Create Date: 2026-06-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "0003_token_blocklist"
down_revision = "0002_wallet_balance_not_null"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "token_blocklist",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("jti", sa.String(length=36), nullable=False),
        sa.Column("token_type", sa.String(length=16), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_token_blocklist_jti"), "token_blocklist", ["jti"], unique=True
    )
    op.create_index(
        op.f("ix_token_blocklist_user_id"), "token_blocklist", ["user_id"], unique=False
    )


def downgrade():
    op.drop_index(op.f("ix_token_blocklist_user_id"), table_name="token_blocklist")
    op.drop_index(op.f("ix_token_blocklist_jti"), table_name="token_blocklist")
    op.drop_table("token_blocklist")