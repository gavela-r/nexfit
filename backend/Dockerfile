# ---------------------------------------------------------------------------
#  Backend NEXFIT · imagen de producción
#  Etapa 1 compila TypeScript; etapa 2 ejecuta solo lo necesario.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Dependencias primero: si el código cambia, esta capa se reutiliza.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Solo dependencias de ejecución (sin tsx, typescript ni tipos).
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node --from=build /app/dist ./dist

USER node

EXPOSE 4000

CMD ["node", "dist/server.js"]
