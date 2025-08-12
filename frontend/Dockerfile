# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json vite.config.js /app/
COPY src /app/src
COPY index.html /app/
RUN npm install && npm run build

# Run stage
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
