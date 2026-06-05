"""add unique constraint on transaction_likes.transaction_id

The Transaction.likes relationship uses uselist=False (1:1), but
transaction_likes.transaction_id had only a foreign key with no uniqueness
guarantee. Under concurrency, two inserts for the same transaction could both
succeed, producing duplicate likes rows. This migration deduplicates any
pre-existing rows (merging the distinct union of liked_by_user_ids into the
surviving row) and then adds a unique constraint so the database enforces the
1:1 invariant.

Revision ID: 0004_uniq_txlikes_txid
Revises: 0003_token_blocklist
Create Date: 2026-06-05 00:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "0004_uniq_txlikes_txid"
down_revision = "0003_token_blocklist"
branch_labels = None
depends_on = None


def upgrade():
    # Merge the distinct union of liked_by_user_ids from every duplicate row
    # into the surviving row for each transaction_id, so no likes are lost when
    # the duplicates are removed. The id column is a UUID (no MIN() aggregate),
    # so the keeper is chosen with ROW_NUMBER() ordered by id. NULL
    # transaction_id rows are left untouched (a unique constraint permits
    # multiple NULLs).
    op.execute(
        """
        WITH ranked AS (
            SELECT id, transaction_id,
                   ROW_NUMBER() OVER (
                       PARTITION BY transaction_id ORDER BY id
                   ) AS rn
            FROM transaction_likes
            WHERE transaction_id IS NOT NULL
        ),
        keeper AS (
            SELECT r.id AS keep_id,
                   ARRAY(
                       SELECT DISTINCT u
                       FROM transaction_likes t2,
                            unnest(t2.liked_by_user_ids) AS u
                       WHERE t2.transaction_id = r.transaction_id
                   ) AS ids
            FROM ranked r
            WHERE r.rn = 1
              AND EXISTS (
                  SELECT 1 FROM ranked r2
                  WHERE r2.transaction_id = r.transaction_id AND r2.rn > 1
              )
        )
        UPDATE transaction_likes t
        SET liked_by_user_ids = keeper.ids
        FROM keeper
        WHERE t.id = keeper.keep_id;
        """
    )

    # Remove the now-redundant duplicate rows, keeping one per transaction_id.
    op.execute(
        """
        DELETE FROM transaction_likes
        WHERE id IN (
            SELECT id FROM (
                SELECT id,
                       ROW_NUMBER() OVER (
                           PARTITION BY transaction_id ORDER BY id
                       ) AS rn
                FROM transaction_likes
                WHERE transaction_id IS NOT NULL
            ) s
            WHERE s.rn > 1
        );
        """
    )

    op.create_unique_constraint(
        "uq_transaction_likes_transaction_id",
        "transaction_likes",
        ["transaction_id"],
    )


def downgrade():
    op.drop_constraint(
        "uq_transaction_likes_transaction_id",
        "transaction_likes",
        type_="unique",
    )