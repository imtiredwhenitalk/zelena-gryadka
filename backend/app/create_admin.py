import argparse
from sqlalchemy import select
from .db import SessionLocal
from .models import User
from .auth import hash_password


def main():
    p = argparse.ArgumentParser(description="Create or promote admin user")
    p.add_argument("--email", required=True)
    p.add_argument("--nickname", required=True)
    p.add_argument("--password", required=True)
    args = p.parse_args()

    db = SessionLocal()
    u = db.scalar(select(User).where(User.email == args.email))
    if u:
        u.is_admin = True
        if args.password:
            u.password_hash = hash_password(args.password)
        u.nickname = args.nickname
        db.commit()
        print("Updated existing user to admin ✅")
    else:
        u = User(
            email=args.email,
            nickname=args.nickname,
            password_hash=hash_password(args.password),
            is_admin=True,
        )
        db.add(u)
        db.commit()
        print("Created admin user ✅")
    db.close()


if __name__ == "__main__":
    main()
