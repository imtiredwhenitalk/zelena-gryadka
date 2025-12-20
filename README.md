# Зелена грядка 🌱

Full-stack магазин: **Next.js (React) + FastAPI (Python) + PostgreSQL**  
Функції:
- Реєстрація / логін (JWT)
- Кошик, улюблене, замовлення, профіль користувача
- **Адмінка UI**: CRUD товарів + завантаження фото
- **SSG/SEO**: статична генерація сторінок під кожен товар (800+)

---

## Dev запуск (Podman або Docker)

```bash
podman-compose up --build
# або docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Swagger: http://localhost:8000/docs

### 1) Засіяти товари (один раз)
```bash
podman-compose exec backend python -m app.seed --file /seed/greenahryadka_products_seed.json
```

### 2) Створити адміна
```bash
podman-compose exec backend python -m app.create_admin --email admin@local --nickname admin --password admin12345
```

Потім зайди на:
- http://localhost:3000/login
- http://localhost:3000/admin

---

## Production запуск

1) Скопіюй `.env.example` у `.env` і заміни паролі/секрети:
```bash
cp .env.example .env
nano .env
```

2) Запуск:
```bash
podman-compose -f docker-compose.prod.yml up --build -d
```

3) Seed + admin:
```bash
podman-compose -f docker-compose.prod.yml exec backend python -m app.seed --file /seed/greenahryadka_products_seed.json
podman-compose -f docker-compose.prod.yml exec backend python -m app.create_admin --email admin@local --nickname admin --password admin12345
```

---

## Фото товарів
- Адмінка дозволяє завантажувати **jpg/png/webp**
- Файли зберігаються в volume `media` і доступні як `/media/<filename>`


## Production (Nginx + HTTPS)

1) On VPS open ports **80/443** and point your domain DNS (A-record) to the VPS IP.

2) Create `.env` from example:
```bash
cp .env.example .env
```

Set at minimum:
- `DOMAIN=example.com`
- `LETSENCRYPT_EMAIL=admin@example.com`
- `JWT_SECRET=...strong...`

3) Build & start:
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

4) Issue HTTPS certificate (Let's Encrypt):
```bash
bash scripts/init-letsencrypt.sh
```

Site will be available at:
- https://$DOMAIN

### Notes
- `/api/*` and `/media/*` are proxied to backend.
- Frontend uses same-origin (NEXT_PUBLIC_API_BASE="") in production.
