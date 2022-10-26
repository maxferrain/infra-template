FROM node:16-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install --production

COPY . /usr/src/app

RUN npm run build

RUN npm install -g serve

CMD ["serve", "-s", "build"]
