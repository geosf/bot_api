FROM node:18.16-slim

USER root
RUN useradd -ms /bin/bash crawler

COPY package*.json /home/crawler/

RUN apt-get update

RUN apt-get install -y \
    awscli \
    ca-certificates \
    fonts-liberation \
    gconf-service \
    libappindicator1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    zip

RUN cd /home/crawler/ && yarn

COPY ./app /home/crawler/app
RUN mkdir -p /home/crawler/app/downloads

COPY ./bin/crawl /home/crawler/

RUN chown -R crawler:crawler /home/crawler/

RUN chmod -R a+rw /home/crawler/
RUN chmod +x /home/crawler/crawl

USER crawler
WORKDIR /home/crawler

ENTRYPOINT ["/home/crawler/crawl"]
