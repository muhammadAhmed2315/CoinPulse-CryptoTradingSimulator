from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from constants import POSTGRESQL_USERNAME, POSTGRESQL_PASSWORD

# Connection string for the 'postgres' system database
engine = create_engine(
    f"postgresql://{POSTGRESQL_USERNAME}:{POSTGRESQL_PASSWORD}@localhost/postgres"
)

# Name of the database to create
dbname = "CryptoTradingSimulator"

# Create database
try:
    with engine.connect() as conn:
        conn.execute(
            text("commit")
        )  # required since CREATE DATABASE cannot run in a transaction
        conn.execute(text(f"CREATE DATABASE {dbname}"))
    print(f"Database {dbname} created successfully.")
except SQLAlchemyError as e:
    print(f"An error occurred: {e}")
finally:
    engine.dispose()
