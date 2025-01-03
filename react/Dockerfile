# Frontend Dockerfile
# frontend/Dockerfile
FROM node:20-alpine as builder

WORKDIR /app

# Package files kopyala ve bağımlılıkları yükle
COPY package*.json ./
RUN npm install

# Kaynak kodları kopyala
COPY . .

# Production build oluştur
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Build stage'den sadece gerekli dosyaları kopyala
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
COPY --from=builder /app/vite.config.js ./vite.config.js
COPY --from=builder /app/index.html ./index.html

# Development server'ı başlat
EXPOSE 5173
ENV HOST=0.0.0.0

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]