# ===== STIKDEAD :: build único para CapRover =====
# Estágio 1: builda o client (Vite → client/dist)
FROM node:22-slim AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Estágio 2: server + dist do client, imagem final enxuta
FROM node:22-slim
WORKDIR /app

# dependências do server (só produção)
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# código do server e migrações
COPY server/ ./server/

# client buildado (o Express serve /app/client/dist)
COPY --from=client-build /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=80
EXPOSE 80

WORKDIR /app/server
CMD ["node", "src/index.js"]
