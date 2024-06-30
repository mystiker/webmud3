FROM node:20.12.2

# docker build --no-cache --progress=plain -f Dockerfile -t myonara/webmud3:local .
# docker build --no-cache --progress=plain -f Dockerfile -t myonara/webmud3:webmud3test .

# Setze das Arbeitsverzeichnis im Container
WORKDIR /usr/src/app

# Kompilat kopieren
COPY backend/dist ./

# Installiere die Abhängigkeiten
RUN npm install --no-package-lock --include=prod

# Setze die Umgebungsvariable PORT
ENV PORT=5000

# Exponiere den Port, auf dem die Anwendung läuft
EXPOSE 5000

# Starte die Anwendung
CMD ["node", "main.js"]