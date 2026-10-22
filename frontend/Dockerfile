# ---------------------------------------------------------------------------
#  Frontend NEXFIT · imagen de producción
#  Etapa 1 compila con Vite; etapa 2 sirve los estáticos con Nginx y hace de
#  proxy de /api hacia el contenedor del backend (mismo origen: sin CORS).
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
