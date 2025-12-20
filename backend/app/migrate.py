from sqlalchemy import text, inspect
from .db import engine, Base
from .config import settings

def ensure_column(table: str, column: str, ddl: str):
    with engine.begin() as conn:
        exists = conn.execute(text("""
            SELECT 1 FROM information_schema.columns
            WHERE table_name=:t AND column_name=:c
        """), {"t": table, "c": column}).first()
        if not exists:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {ddl};"))

def run():
    # create tables if missing
    Base.metadata.create_all(bind=engine)

    # products.category
    ensure_column("products", "category", "category VARCHAR(80)")

    # orders extended fields
    ensure_column("orders", "payment_method", "payment_method VARCHAR(30)")
    ensure_column("orders", "delivery_method", "delivery_method VARCHAR(30)")
    ensure_column("orders", "full_name", "full_name VARCHAR(120)")
    ensure_column("orders", "phone", "phone VARCHAR(40)")
    ensure_column("orders", "city", "city VARCHAR(120)")
    ensure_column("orders", "address", "address VARCHAR(200)")
    ensure_column("orders", "comment", "comment TEXT")

if __name__ == "__main__":
    run()
    print("Migration complete")
