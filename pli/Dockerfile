ARG NODE_VERSION=20.9.0
FROM node:${NODE_VERSION}-alpine as base


WORKDIR /app

# Base stage for dependencies
FROM base as build

# Install only production dependencies (Using copy to cache)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_REACT_APP_BACKEND=http://localhost:8000
ARG VITE_REACT_APP_WHISPER=http://localhost:5000

RUN npm run build

FROM nginx:alpine as production

COPY --from=build /app/build /usr/share/nginx/html
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
