ARG NODE_VERSION=20.9.0
FROM node:${NODE_VERSION}-alpine as base


WORKDIR /app

# Base stage for dependencies
FROM base as deps

# Install only production dependencies
RUN --mount=type=bind,source=package.json,target=/app/package.json \
    --mount=type=bind,source=package-lock.json,target=/app/package-lock.json \
    npm ci --omit=dev

# Stage for development dependencies (optional)
FROM deps as build

# Install all dependencies (both production and dev)
RUN --mount=type=bind,source=package.json,target=/app/package.json \
    --mount=type=bind,source=package-lock.json,target=/app/package-lock.json \
    npm ci


COPY . .

ENV VITE_REACT_APP_BACKEND=https://pli.ketsuna.com/api

RUN npm run build

FROM nginx:alpine as production

COPY --from=build /app/build /usr/share/nginx/html
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
