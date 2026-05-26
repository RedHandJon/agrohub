FROM node:20-alpine AS builder

WORKDIR /app

ENV NPM_CONFIG_LEGACY_PEER_DEPS=true

COPY package.json ./
RUN npm install

COPY . .

# VITE_API_URL передаётся как build arg (Railway подставит URL бэкенда)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Production: serve with nginx ──────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /nginx.conf.template

EXPOSE 80
ENV PORT=80
# envsubst '${PORT}' — заменяем только PORT, не трогаем nginx-переменные $uri
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
