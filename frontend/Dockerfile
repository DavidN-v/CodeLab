FROM node:24-alpine AS build
WORKDIR /workspace

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build


# Unprivileged image: nginx runs as a non-root user and listens on 8080.
FROM nginxinc/nginx-unprivileged:stable-alpine
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/dist/frontend/browser /usr/share/nginx/html

# Where /api requests are forwarded. Substituted into the template at start-up.
ENV API_UPSTREAM=http://backend:8080
EXPOSE 8080
