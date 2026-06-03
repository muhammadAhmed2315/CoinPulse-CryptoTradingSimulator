"""initial schema squashed baseline

Squashed baseline migration that creates the entire schema from scratch.
This replaces the previous five incremental migrations
(39de48d224af -> 96a7793c98a3 -> 8693137a7546 -> c1f4a9b2d3e7 -> d2e5b7c1f9a4)
so that ``flask db upgrade`` builds the database from an empty state and
Alembic is the single source of truth for the schema (db.create_all() has
been removed from app.py).

The resulting schema must match models.py exactly: 5 tables, UUID primary
keys throughout, JSONB asset dicts, parallel ARRAY columns on
value_histories / transaction_likes, the wallets.owner_id UNIQUE constraint,
the mixed-case transactions."transactionType" column, and the three wallet
CHECK constraints (ck_wallets_balance_nonneg,
ck_wallets_reserved_balance_nonneg, ck_wallets_balance_ge_reserved).

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-06-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ------------------------------------------------------------------ users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("username", sa.String(length=20), nullable=True),
        sa.Column("password_hash", sa.Text(), nullable=True),
        sa.Column("provider", sa.Text(), nullable=True),
        sa.Column("provider_id", sa.Text(), nullable=True),
        sa.Column("verified", sa.Boolean(), nullable=False),
        sa.Column("last_password_reset_token", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )

    # ---------------------------------------------------------------- wallets
    op.create_table(
        "wallets",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("balance", sa.Float(), nullable=True),
        sa.Column("assets", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("reserved_balance", sa.Float(), nullable=False),
        sa.Column(
            "reserved_assets",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("time_created", sa.Integer(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column("total_current_value", sa.Float(), nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.CheckConstraint("balance >= 0", name="ck_wallets_balance_nonneg"),
        sa.CheckConstraint(
            "reserved_balance >= 0", name="ck_wallets_reserved_balance_nonneg"
        ),
        sa.CheckConstraint(
            "balance >= reserved_balance", name="ck_wallets_balance_ge_reserved"
        ),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_id"),
    )

    # -------------------------------------------------------- value_histories
    op.create_table(
        "value_histories",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("wallet_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("balance_history", postgresql.ARRAY(sa.Float()), nullable=True),
        sa.Column(
            "assets_value_history", postgresql.ARRAY(sa.Float()), nullable=True
        ),
        sa.Column(
            "total_value_history", postgresql.ARRAY(sa.Float()), nullable=True
        ),
        sa.Column("timestamps", postgresql.ARRAY(sa.Integer()), nullable=True),
        sa.ForeignKeyConstraint(["wallet_id"], ["wallets.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # ----------------------------------------------------------- transactions
    op.create_table(
        "transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.Text(), nullable=False),
        # Model attribute ``transactionType`` maps to this literal mixed-case
        # column; Alembic/Postgres preserve and quote the casing.
        sa.Column("transactionType", sa.Text(), nullable=False),
        sa.Column("orderType", sa.Text(), nullable=False),
        sa.Column("timestamp", sa.Integer(), nullable=False),
        sa.Column("coin_id", sa.Text(), nullable=False),
        sa.Column("quantity", sa.Float(), nullable=False),
        sa.Column("price_per_unit", sa.Float(), nullable=False),
        sa.Column("price_per_unit_at_execution", sa.Float(), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("balance_before", sa.Float(), nullable=False),
        sa.Column("balance_after", sa.Float(), nullable=True),
        sa.Column("total_value", sa.Float(), nullable=False),
        sa.Column("visibility", sa.Boolean(), nullable=False),
        sa.Column("wallet_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["wallet_id"], ["wallets.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # ------------------------------------------------------ transaction_likes
    op.create_table(
        "transaction_likes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "liked_by_user_ids",
            postgresql.ARRAY(postgresql.UUID(as_uuid=True)),
            nullable=True,
        ),
        sa.Column("transaction_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["transaction_id"], ["transactions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    # Reverse foreign-key dependency order.
    op.drop_table("transaction_likes")
    op.drop_table("transactions")
    op.drop_table("value_histories")
    op.drop_table("wallets")
    op.drop_table("users")
