# =========================
# STAGE 1: BUILD
# =========================
FROM node:20-alpine AS build
WORKDIR /app

# Copia apenas manifests para cache eficiente
COPY package*.json ./
# Instala TAMBÉM devDependencies para poder compilar
RUN npm ci

# Copia o resto do código
COPY . .

# Compila (ajuste para seu script real)
# Ex.: "build": "tsc" ou "nest build"
RUN npm run build

# =========================
# STAGE 2: RUNTIME (prod)
# =========================
FROM node:20-alpine AS runtime
WORKDIR /app

# Somente dependências de produção
COPY package*.json ./
RUN npm ci --only=production

# Copia artefatos compilados do estágio de build
COPY --from=build /app/dist ./dist

# Se precisar de outras pastas em runtime (ex.: public, prisma schema etc.):
# COPY --from=build /app/public ./public

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Garanta que seu build gerou dist/server.js
CMD ["node", "dist/server.js"]