FROM node:14-alpine

WORKDIR /home/node/app

# copy content 

COPY . .

# USER node 

RUN npm install                                         

RUN chown -R node:node /home/node/app

CMD [ "node", "index.js" ]
