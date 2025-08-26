# syntax=docker/dockerfile:1

############################################
# Base commun (Node 20 + Java optionnelle)
############################################
ARG NODE_IMAGE=node:20-bullseye

FROM ${NODE_IMAGE} AS base
WORKDIR /opt/docusaurus
ENV FORCE_COLOR=0
# Java utile si tu génères des UML/PlantUML au build
RUN apt-get update \
 && apt-get install -y --no-install-recommends openjdk-17-jre-headless \
 && rm -rf /var/lib/apt/lists/*

############################################
# Dev (local-first : AUCUNE install ici)
############################################
FROM base AS dev
ENV NODE_ENV=development
EXPOSE 3000
# Important : on ne copie rien et on n’installe rien.
# Le code + node_modules viennent du bind-mount via docker-compose.
CMD ["npm","run","start","--","--host","0.0.0.0","--poll","1000"]

############################################
# Prod (build reproductible dans l'image)
############################################
FROM base AS prod
WORKDIR /opt/docusaurus
ENV NODE_ENV=production

# 1) Dépendances (couche cache) — uniquement package*.json
COPY package.json package-lock.json* ./
RUN npm ci

# 2) Code source
COPY . .

# 3) (facultatif) génération d'assets UML si tu en as :
# RUN npm run uml:build

# 4) Build statique
RUN npm run build

############################################
# Serve (utilitaire) avec Docusaurus
############################################
FROM ${NODE_IMAGE} AS serve
WORKDIR /opt/docusaurus
ENV NODE_ENV=production
COPY --from=prod /opt/docusaurus/build ./build
EXPOSE 3000
# Non-root (l’utilisateur "node" existe dans l’image officielle)
USER node
CMD ["npx","docusaurus","serve","build","--host","0.0.0.0","--port","3000","--no-open"]

############################################
# Caddy (recommandé pour la prod)
############################################
FROM caddy:2-alpine AS caddy
# Build statique uniquement
COPY --from=prod /opt/docusaurus/build /var/docusaurus
# Ton Caddyfile (doit exister à la racine du contexte)
COPY Caddyfile /etc/caddy/Caddyfile
