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
 && apt-get install -y --no-install-recommends \
	 openjdk-17-jre-headless \
	 git \
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
# Dev image with deps preinstalled (for docker-compose dev service)
############################################
FROM base AS devimage
WORKDIR /opt/docusaurus
ENV NODE_ENV=development
# Copy only package files to leverage cache
COPY package.json package-lock.json* ./
# Install dev dependencies inside the image so compose doesn't need to run npm ci each start
RUN npm ci --no-audit --no-fund --include=dev
# Mark the working dir as safe for git (avoids dubious ownership errors when mounting)
RUN git config --global --add safe.directory /opt/docusaurus
EXPOSE 3000
CMD ["npm","run","start","--","--host","0.0.0.0","--poll","1000"]
 
 # Snapshot installed modules to a location outside the project dir so bind-mounts don't hide it
 RUN mkdir -p /usr/local/.image_node_modules && cp -a node_modules/. /usr/local/.image_node_modules/ || true
 RUN chown -R node:node /usr/local/.image_node_modules || true

 # Copy entrypoint into image and make executable
 COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
 RUN chmod +x /usr/local/bin/docker-entrypoint.sh
 ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

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
