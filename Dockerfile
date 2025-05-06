FROM node:20-slim

RUN apt-get update && apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  wget \
  --no-install-recommends && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN npm install

RUN npx puppeteer browsers install chrome

EXPOSE 3000

# 👇 Aqui executa diretamente o processo principal
CMD ["node", "app/server.js"]
