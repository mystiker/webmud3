FROM node:20.12.2 AS ng-build-stage

# docker build --progress=plain -f wm3.dockerfile -t wm3test .
# docker build --no-cache --progress=plain -f wm3.dockerfile -t wm3test .

RUN apt-get update -y \
 && apt upgrade -y \
 && apt-get install -y --no-install-recommends bash git \
 && npm install --location=global @angular/cli \
 && git clone -b dev2_rework https://github.com/myonara/webmud3.git \
 && cd webmud3/frontend \
 && npm install \
 && npm run build \
 && cd ../backend \
 && npm install \
 && npm run build  \
 && cd .. \
 && npm install \
 && npm run postbuild

# Setze die Umgebungsvariable PORT
ENV PORT=5000

# Exponiere den Port, auf dem die Anwendung läuft
EXPOSE 5000

# Starte die Anwendung
CMD ["node", "webmud3/backend/dist/main.js"]
