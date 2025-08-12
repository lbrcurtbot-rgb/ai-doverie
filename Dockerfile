# Fallback root Dockerfile (serves static frontend only)
# Prefer deploying via render.yaml (multi-service backend+frontend).
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/vite.config.js /app/
COPY frontend/src /app/src
COPY frontend/index.html /app/
RUN npm ci || npm i && npm run build

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
