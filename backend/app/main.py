import os
import shutil
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import select, or_

from .db import Base, engine, get_db
from .models import User, Product, Favorite, CartItem, Order, OrderItem
from .schemas import (
    RegisterIn, LoginIn, TokenOut,
    ProductOut, ProductCreate,
    CartItemOut, OrderOut, CheckoutIn,
)
from .auth import (
    hash_password, verify_password,
    create_token, get_current_user,
    require_admin,
)
from .config import settings

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Zelena Gryadka API", version="1.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for prod you can restrict
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.MEDIA_DIR, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.MEDIA_DIR), name="media")


def product_to_out(p: Product) -> ProductOut:
    return ProductOut(
        id=p.id,
        name=p.name,
        slug=p.slug,
        description=p.description or "",
        supplier=p.supplier,
        category=getattr(p,'category',None),
        price=float(p.price),
        image_url=f"/media/{p.image_path}" if p.image_path else None,
    )


@app.get("/api/health")
def health():
    return {"ok": True}


# ---------- AUTH ----------
@app.post("/api/auth/register", response_model=TokenOut)
def register(inp: RegisterIn, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(or_(User.email == inp.email, User.nickname == inp.nickname))):
        raise HTTPException(400, "Email або nickname вже зайняті")
    user = User(
        nickname=inp.nickname,
        email=inp.email,
        password_hash=hash_password(inp.password),
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_token(user)
    return TokenOut(access_token=token, nickname=user.nickname, is_admin=user.is_admin)


@app.post("/api/auth/login", response_model=TokenOut)
def login(inp: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == inp.email))
    if not user or not verify_password(inp.password, user.password_hash):
        raise HTTPException(401, "Невірний email або пароль")
    token = create_token(user)
    return TokenOut(access_token=token, nickname=user.nickname, is_admin=user.is_admin)


@app.get("/api/me")
def me(user: User = Depends(get_current_user)):
    return {"nickname": user.nickname, "email": user.email, "is_admin": user.is_admin}


# ---------- PRODUCTS ----------
@app.get("/api/products", response_model=list[ProductOut])
def list_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    supplier: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: str = "new",  # new | price_asc | price_desc | name_asc
    skip: int = Query(0, ge=0),
    limit: int = Query(24, ge=1, le=200),
    db: Session = Depends(get_db),
):
    stmt = select(Product)

    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Product.name.ilike(like), Product.description.ilike(like)))

    if category:
        stmt = stmt.where(Product.category == category)

    if supplier:
        stmt = stmt.where(Product.supplier == supplier)

    if min_price is not None:
        stmt = stmt.where(Product.price >= min_price)

    if max_price is not None:
        stmt = stmt.where(Product.price <= max_price)

    if sort == "price_asc":
        stmt = stmt.order_by(Product.price.asc(), Product.id.desc())
    elif sort == "price_desc":
        stmt = stmt.order_by(Product.price.desc(), Product.id.desc())
    elif sort == "name_asc":
        stmt = stmt.order_by(Product.name.asc(), Product.id.desc())
    else:
        stmt = stmt.order_by(Product.id.desc())

    items = db.scalars(stmt.offset(skip).limit(limit)).all()
    return [product_to_out(p) for p in items]


@app.get("/api/products/filters")
def product_filters(db: Session = Depends(get_db)):
    cats = db.scalars(select(Product.category).where(Product.category.is_not(None)).distinct()).all()
    sups = db.scalars(select(Product.supplier).where(Product.supplier.is_not(None)).distinct()).all()
    cats = sorted([c for c in cats if c])
    sups = sorted([s for s in sups if s])
    return {"categories": cats, "suppliers": sups}

@app.get("/api/products/slugs")
def list_product_slugs(db: Session = Depends(get_db)):
    slugs = db.scalars(select(Product.slug).order_by(Product.id.asc())).all()
    return {"slugs": slugs}


@app.get("/api/products/{slug}", response_model=ProductOut)
def get_product(slug: str, db: Session = Depends(get_db)):
    p = db.scalar(select(Product).where(Product.slug == slug))
    if not p:
        raise HTTPException(404, "Товар не знайдено")
    return product_to_out(p)


# ---------- ADMIN PRODUCTS ----------
@app.post("/api/admin/products", response_model=ProductOut)
def admin_create_product(
    inp: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if db.scalar(select(Product).where(Product.slug == inp.slug)):
        raise HTTPException(400, "Slug вже існує")
    p = Product(
        name=inp.name,
        slug=inp.slug,
        description=inp.description,
        supplier=inp.supplier,
        category=inp.category,
        price=inp.price,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return product_to_out(p)


@app.put("/api/admin/products/{product_id}", response_model=ProductOut)
def admin_update_product(
    product_id: int,
    inp: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    p = db.get(Product, product_id)
    if not p:
        raise HTTPException(404, "Не знайдено")
    # slug uniqueness
    other = db.scalar(select(Product).where(Product.slug == inp.slug, Product.id != product_id))
    if other:
        raise HTTPException(400, "Slug вже існує")
    p.name = inp.name
    p.slug = inp.slug
    p.description = inp.description
    p.supplier = inp.supplier
    p.category = inp.category
    p.price = inp.price
    db.commit()
    db.refresh(p)
    return product_to_out(p)


@app.delete("/api/admin/products/{product_id}")
def admin_delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    p = db.get(Product, product_id)
    if not p:
        raise HTTPException(404, "Не знайдено")
    if p.image_path:
        try:
            os.remove(os.path.join(settings.MEDIA_DIR, p.image_path))
        except FileNotFoundError:
            pass
    db.delete(p)
    db.commit()
    return {"deleted": True}


@app.post("/api/admin/products/{product_id}/image", response_model=ProductOut)
def admin_upload_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    p = db.get(Product, product_id)
    if not p:
        raise HTTPException(404, "Не знайдено")
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(400, "Підтримуються лише jpg/png/webp")
    fname = f"p{product_id}{ext}"
    dest = os.path.join(settings.MEDIA_DIR, fname)
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    p.image_path = fname
    db.commit()
    db.refresh(p)
    return product_to_out(p)


# ---------- FAVORITES ----------
@app.get("/api/favorites", response_model=list[ProductOut])
def list_favorites(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    favs = db.scalars(select(Favorite).where(Favorite.user_id == user.id)).all()
    products = [db.get(Product, f.product_id) for f in favs]
    return [product_to_out(p) for p in products if p]


@app.post("/api/favorites/{product_id}")
def add_favorite(product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.get(Product, product_id):
        raise HTTPException(404, "Товар не знайдено")
    if db.scalar(select(Favorite).where(Favorite.user_id == user.id, Favorite.product_id == product_id)):
        return {"ok": True}
    db.add(Favorite(user_id=user.id, product_id=product_id))
    db.commit()
    return {"ok": True}


@app.delete("/api/favorites/{product_id}")
def remove_favorite(product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    f = db.scalar(select(Favorite).where(Favorite.user_id == user.id, Favorite.product_id == product_id))
    if f:
        db.delete(f)
        db.commit()
    return {"ok": True}


# ---------- CART ----------
@app.get("/api/cart", response_model=list[CartItemOut])
def get_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.scalars(select(CartItem).where(CartItem.user_id == user.id)).all()
    out: list[CartItemOut] = []
    for it in items:
        p = db.get(Product, it.product_id)
        if p:
            out.append(CartItemOut(product=product_to_out(p), qty=it.qty))
    return out


@app.post("/api/cart/{product_id}")
def cart_add(product_id: int, qty: int = 1, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if qty < 1:
        qty = 1
    if not db.get(Product, product_id):
        raise HTTPException(404, "Товар не знайдено")
    it = db.scalar(select(CartItem).where(CartItem.user_id == user.id, CartItem.product_id == product_id))
    if it:
        it.qty += qty
    else:
        db.add(CartItem(user_id=user.id, product_id=product_id, qty=qty))
    db.commit()
    return {"ok": True}


@app.patch("/api/cart/{product_id}")
def cart_set_qty(product_id: int, qty: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    it = db.scalar(select(CartItem).where(CartItem.user_id == user.id, CartItem.product_id == product_id))
    if not it:
        raise HTTPException(404, "Немає в кошику")
    if qty <= 0:
        db.delete(it)
    else:
        it.qty = qty
    db.commit()
    return {"ok": True}


@app.delete("/api/cart/{product_id}")
def cart_remove(product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    it = db.scalar(select(CartItem).where(CartItem.user_id == user.id, CartItem.product_id == product_id))
    if it:
        db.delete(it)
        db.commit()
    return {"ok": True}


# ---------- ORDERS ----------
@app.post("/api/orders")
def create_order(inp: CheckoutIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.scalars(select(CartItem).where(CartItem.user_id == user.id)).all()
    if not cart:
        raise HTTPException(400, "Кошик порожній")
    order = Order(user_id=user.id, status="created", payment_method=inp.payment_method, delivery_method=inp.delivery_method, full_name=inp.full_name, phone=inp.phone, city=inp.city, address=inp.address, comment=inp.comment)
    db.add(order)
    if inp.payment_method == "card":
        order.status = "paid"
    db.flush()
    for it in cart:
        p = db.get(Product, it.product_id)
        if not p:
            continue
        db.add(OrderItem(order_id=order.id, product_id=p.id, name=p.name, price=float(p.price), qty=it.qty))
    for it in cart:
        db.delete(it)
    db.commit()
    return {"order_id": order.id}


@app.get("/api/orders", response_model=list[OrderOut])
def list_orders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.scalars(
        select(Order).where(Order.user_id == user.id).order_by(Order.id.desc())
    ).all()
    out: list[OrderOut] = []
    for o in orders:
        items = db.scalars(select(OrderItem).where(OrderItem.order_id == o.id)).all()
        out.append(
            OrderOut(
                id=o.id,
                status=o.status,
                payment_method=o.payment_method,
                delivery_method=o.delivery_method,
                full_name=o.full_name,
                phone=o.phone,
                city=o.city,
                address=o.address,
                comment=o.comment,
                items=[{"name": it.name, "price": float(it.price), "qty": it.qty} for it in items],
            )
        )
    return out

# ---------- ADMIN: ORDERS ----------
@app.get("/api/admin/orders", response_model=list[OrderOut])
def admin_list_orders(user: User = Depends(require_admin), db: Session = Depends(get_db)):
    orders = db.scalars(select(Order).order_by(Order.id.desc()).limit(200)).all()
    out = []
    for o in orders:
        items = db.scalars(select(OrderItem).where(OrderItem.order_id == o.id)).all()
        out.append(OrderOut(
            id=o.id,
            status=o.status,
            payment_method=o.payment_method,
            delivery_method=o.delivery_method,
            full_name=o.full_name,
            phone=o.phone,
            city=o.city,
            address=o.address,
            comment=o.comment,
            items=[{"name": i.name, "price": float(i.price), "qty": i.qty} for i in items],
        ))
    return out


@app.patch("/api/admin/orders/{order_id}", response_model=OrderOut)
def admin_update_order_status(order_id: int, status: str, user: User = Depends(require_admin), db: Session = Depends(get_db)):
    o = db.get(Order, order_id)
    if not o:
        raise HTTPException(404, "Order not found")
    o.status = status
    db.commit()
    items = db.scalars(select(OrderItem).where(OrderItem.order_id == o.id)).all()
    return OrderOut(
        id=o.id,
        status=o.status,
        payment_method=o.payment_method,
        delivery_method=o.delivery_method,
        full_name=o.full_name,
        phone=o.phone,
        city=o.city,
        address=o.address,
        comment=o.comment,
        items=[{"name": i.name, "price": float(i.price), "qty": i.qty} for i in items],
    )

