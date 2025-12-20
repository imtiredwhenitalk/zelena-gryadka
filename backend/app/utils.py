import re
def slugify(text: str) -> str:
    t = text.strip().lower()
    t = re.sub(r"[^a-z0-9а-яіїєґ]+", "-", t, flags=re.IGNORECASE)
    t = re.sub(r"-{2,}", "-", t).strip("-")
    return t or "product"
