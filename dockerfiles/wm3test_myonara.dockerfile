# use fixed version
FROM node:20.12.2 AS ng-build-stage

# how to use this file
# docker build --progress=plain -f wm3.dockerfile -t wm3test .
# docker build --no-cache --progress=plain -f wm3.dockerfile -t wm3test .

# obsolete href repelacement from initial file:
# RUN sed -i 's-%%BASEREF%%-/webmud3test/-' /webmud3/frontend/src/index.html
# RUN sed -i 's-%%ACEREF%%-https://www.unitopia.de/webmud3test/ace/-' /webmud3/frontend/src/index.html

RUN apt-get update -y \
 && apt upgrade -y \
 && apt-get install -y --no-install-recommends bash git \
 && git clone -b dev2_rework https://github.com/myonara/webmud3.git \
 && sed -i 's-%%BASEREF%%-/webmud3test/-' /webmud3/frontend/src/index.html \
 && cd webmud3 \
 && npm install \
 && npm run build

# get fresh deployment
FROM node:20.12.2 AS webmud3

# executable dir...
WORKDIR /app

# copy from build stage
COPY --from=ng-build-stage /webmud3/backend/dist/ /app/

# env variable PORT to be set
ENV PORT=5000

# expose port for application
EXPOSE 5000

# Starte die Anwendung
CMD ["node", "/app/main.js"]
