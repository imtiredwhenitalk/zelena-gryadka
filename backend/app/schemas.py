from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

class RegisterIn(BaseModel):
    nickname: str = Field(min_length=3, max_length=40)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    nickname: str
    is_admin: bool


class ProductOut(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    supplier: Optional[str] = None
    category: Optional[str] = None
    price: float
    image_url: Optional[str] = None


class ProductCreate(BaseModel):
    name: str
    slug: str
    description: str = ""
    supplier: Optional[str] = None
    category: Optional[str] = None
    price: float

class CheckoutIn(BaseModel):
    payment_method: str = Field(default="cod")  # cod | card
    delivery_method: str = Field(default="nova_poshta")  # nova_poshta | ukrposhta | courier
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=5, max_length=40)
    city: str = Field(min_length=2, max_length=120)
    address: str = Field(min_length=2, max_length=200)
    comment: str = ""
class CartItemOut(BaseModel):
    product: ProductOut
    qty: int


class OrderItemOut(BaseModel):
    name: str
    price: float
    qty: int


class OrderOut(BaseModel):
    id: int
    status: str
    payment_method: Optional[str] = None
    delivery_method: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    comment: Optional[str] = None
    items: List[OrderItemOut]
