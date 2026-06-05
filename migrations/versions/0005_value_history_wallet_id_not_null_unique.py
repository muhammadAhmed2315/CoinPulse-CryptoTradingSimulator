"""enforce 1:1 Wallet<->ValueHistory via NOT NULL + UNIQUE on value_histories.wallet_id

The app treats Wallet <-> ValueHistory as strictly 1:1 (each wallet has exactly
one value history, and the background value updater appends to it), but
value_histories.wallet_id had only a foreign key: it was nullable and
non-unique. That allowed orphaned histories (wallet_id IS NULL) and multiple
histories pointing at the same wallet, both of which silently corrupt the
recorded value history.

This migration first deletes orphaned (NULL wallet_id) rows, then deduplicates
any wallets with more than one history -- keeping the row with the most
recorded entries (longest timestamps array, tie-broken by id) and deleting the
rest -- and finally sets wallet_id NOT NULL and adds a unique constraint so the
database enforces the invariant going forward. The unique constraint also
provides the index on value_histories.wallet_id that lookups rely on.

Revision ID: 0005_vh_wallet_id_notnull_uniq
Revises: 0004_uniq_txlikes_txid
Create Date: 2026-06-05 00:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "0005_vh_wallet_id_notnull_uniq"
down_revision = "0004_uniq_txlikes_txid"
branch_labels = None
depends_on = None


def upgrade():
    # Drop orphaned histories that belong to no wallet. A unique constraint
    # would permit multiple NULLs, but a NULL wallet_id history is meaningless
    # and would violate the NOT NULL we add below.
    op.execute("DELETE FROM value_histories WHERE wallet_id IS NULL;")

    # Deduplicate: keep one history per wallet -- the one with the most recorded
    # entries (longest timestamps array), tie-broken by id -- and delete the
    # rest. cardinality() returns 0 for empty arrays (not NULL), so the ordering
    # is well-defined.
    op.execute(
        """
        DELETE FROM value_histories
        WHERE id IN (
            SELECT id FROM (
                SELECT id,
                       ROW_NUMBER() OVER (
                           PARTITION BY wallet_id
                           ORDER BY cardinality(timestamps) DESC, id
                       ) AS rn
                FROM value_histories
            ) s
            WHERE s.rn > 1
        );
        """
    )

    op.alter_column("value_histories", "wallet_id", nullable=False)
    op.create_unique_constraint(
        "uq_value_histories_wallet_id",
        "value_histories",
        ["wallet_id"],
    )


def downgrade():
    op.drop_constraint(
        "uq_value_histories_wallet_id",
        "value_histories",
        type_="unique",
    )
    op.alter_column("value_histories", "wallet_id", nullable=True)
