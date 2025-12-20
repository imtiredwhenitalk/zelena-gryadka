import json
import argparse
import re
from pathlib import Path

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from .db import SessionLocal
from .models import Product


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text or "product"


def parse_price(raw_price) -> float:
    if raw_price is None:
        return 0.0
    try:
        return float(str(raw_price).replace(",", ".").strip())
    except (ValueError, TypeError):
        return 0.0



def infer_category(name: str) -> str:
    n = name.lower()
    if "насіння" in n or "семена" in n:
        return "Насіння"
    if "добрив" in n or "добриво" in n or "fert" in n:
        return "Добрива"
    if "фунгіцид" in n or "фунгицид" in n or "інсектицид" in n or "гербіцид" in n:
        return "ЗЗР"
    if "грунт" in n or "ґрунт" in n or "субстрат" in n:
        return "Ґрунти/Субстрати"
    if "горщик" in n or "кашпо" in n or "лоток" in n:
        return "Інвентар"
    return "Інше"

def run_seed(file_path: str):
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Seed file not found: {file_path}")

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    db: Session = SessionLocal()
    inserted = 0

    for item in data:
        name = (item.get("name") or "").strip()
        if not name:
            continue

        base_slug = slugify(name)
        slug = base_slug
        counter = 2

        while True:
            p = Product(
                name=name,
                slug=slug,
                description=(item.get("description") or "").strip(),
                supplier=(item.get("supplier") or "").strip() if item.get("supplier") else None,
                price=parse_price(item.get("price")),
                category=infer_category(name),
                image_path=item.get("image"),
            )
            try:
                db.add(p)
                db.flush()  # ensures unique checks within same batch
                inserted += 1
                break
            except IntegrityError:
                db.rollback()
                slug = f"{base_slug}-{counter}"
                counter += 1

    db.commit()
    db.close()

    print(f"Inserted {inserted} products")
    print("Done")


def main():
    parser = argparse.ArgumentParser(description="Seed products into database")
    parser.add_argument("--file", required=True, help="Path to products seed JSON file")
    args = parser.parse_args()
    run_seed(args.file)


if __name__ == "__main__":
    main()
