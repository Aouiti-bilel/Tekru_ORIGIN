# This file is a template, and might need editing before it works on your project.
FROM node:12.13-slim

WORKDIR /usr/src/app

#ARG NODE=staging
ENV NODE_ENV $NODE

COPY $CI_PROJECT_DIR/package.json /usr/src/app/
COPY $CI_PROJECT_DIR/config.json /usr/src/app/
COPY $CI_PROJECT_DIR/. /usr/src/app


RUN npm install
RUN npm run build

# replace this with your application's default port
EXPOSE 8880
CMD [ "node", "build/app.js" ]