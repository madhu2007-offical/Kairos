# ==========================================
# STAGE 1: Build the Vite React Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:frontend

# ==========================================
# STAGE 2: Build the Express Backend
# ==========================================
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Generate prisma bindings so typescript compiles cleanly
RUN npx prisma generate --schema=server/prisma/schema.prisma
RUN npm run build:backend

# ==========================================
# STAGE 3: Final Production Runner
# ==========================================
FROM node:20-alpine
WORKDIR /app

# Copy dependency configs
COPY package*.json ./
COPY server/package.json ./server/

# Install only production dependencies
RUN npm install --omit=dev

# Copy compiled assets from build stages
COPY --from=frontend-builder /app/dist ./dist
COPY --from=backend-builder /app/server/dist ./server/dist
COPY --from=backend-builder /app/server/prisma ./server/prisma
COPY --from=backend-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-builder /app/node_modules/@prisma ./node_modules/@prisma

# Deploy schema locally to SQLite for instant functionality
RUN npx prisma db push --schema=server/prisma/schema.prisma --accept-data-loss

# Expose server port (Cloud Run defaults to 8080)
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server/dist/index.js"]
