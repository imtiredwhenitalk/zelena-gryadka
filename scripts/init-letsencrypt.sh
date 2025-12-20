#!/usr/bin/env sh
set -e

if [ -z "${DOMAIN}" ]; then
  echo "DOMAIN is not set. Example: DOMAIN=example.com"
  exit 1
fi

if [ -z "${LETSENCRYPT_EMAIL}" ]; then
  echo "LETSENCRYPT_EMAIL is not set. Example: LETSENCRYPT_EMAIL=admin@example.com"
  exit 1
fi

# Create dummy cert to start nginx
mkdir -p "/etc/letsencrypt/live/${DOMAIN}"
if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
  echo "Creating dummy certificate for ${DOMAIN}..."
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" \
    -out "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" \
    -subj "/CN=${DOMAIN}"
fi

echo "Starting nginx..."
docker compose -f docker-compose.prod.yml up -d nginx

echo "Requesting Let's Encrypt certificate for ${DOMAIN}..."
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  --email "${LETSENCRYPT_EMAIL}" --agree-tos --no-eff-email \
  -d "${DOMAIN}"

echo "Reloading nginx..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "Done."
