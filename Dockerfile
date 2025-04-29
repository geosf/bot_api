FROM node:18

# Instalar Chromium
RUN apt-get update && apt-get install -y chromium

WORKDIR /app
COPY . .

RUN npm install

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PORT=3000

EXPOSE 3000

CMD ["node", "src/server.js"]