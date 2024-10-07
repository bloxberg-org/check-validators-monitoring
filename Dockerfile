FROM node:12-alpine
EXPOSE 25

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

COPY package*.json ./
COPY . .
ADD start.sh /

# USER node
RUN npm install

ENTRYPOINT ["/start.sh"]
