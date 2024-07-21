# use fixed version
FROM node:20.12.2 AS ng-build-stage

# how to use this file in dir webmud3!:
# docker build --progress=plain -f dockerfiles/wm3local_myonara.dockerfile -t myonara/webmud3:local .
# docker build --no-cache --progress=plain -f dockerfiles/wm3local_myonara.dockerfile -t myonara/webmud3:local .

# run local container:
#  docker run -d --env-file dockerfiles/env-wm3local.list -p 5000:5000 --name wm3local myonara/webmud3:local
# NODE_ENV: 'development'
# HOST: wm3test
# TELNET_HOST: testmud
# TELNET_PORT: '3333'
# docker run -it -p 5000:5000 --env-file dockerfiles/env-wm3local.list --name wm3local --hostname wm3test myonara/webmud3:local


# obsolete href repelacement from initial file:
# RUN sed -i 's-%%BASEREF%%-/webmud3test/-' /webmud3/frontend/src/index.html
# RUN sed -i 's-%%ACEREF%%-https://www.unitopia.de/webmud3test/ace/-' /webmud3/frontend/src/index.html
#  && sed -i 's-%%BASEREF%%-/-' /webmud3/frontend/src/index.html \

RUN apt-get update -y \
 && apt upgrade -y \
 && apt-get install -y --no-install-recommends bash git \
 && npm install -g npm@10.8.2 \
 && git clone -b dev2_rework https://github.com/myonara/webmud3.git \
 && cd webmud3 \
 && npm install \
 && npm run build:dev

# get fresh deployment
FROM node:20.12.2 AS webmud3

# executable dir...
WORKDIR /webmud3

# copy from build stage
COPY --from=ng-build-stage /webmud3/backend/dist/ /webmud3/

RUN npm install -g npm@10.8.2 && npm install

ADD dockerfiles/.bashrc /root

# env variable PORT to be set
ENV PORT=5000

# expose port for application
EXPOSE 5000

# Starte die Anwendung
# CMD ["node", "/webmud3/main.js"]
CMD ["/bin/bash"]

