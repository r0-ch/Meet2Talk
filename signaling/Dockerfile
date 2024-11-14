FROM node:20.9.0-alpine as base

WORKDIR /app

FROM base as deps
ENV DATABASE_URL=file:./dev.db
# Install only production dependencies
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    npm ci --omit=dev \
    npx prisma db push

# Stage for development dependencies (optional)
FROM deps as build

# Install all dependencies (both production and dev)
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    npm ci

COPY tsconfig.json ./
COPY prisma ./prisma


ENV CORS_ORIGIN=pli.ketsuna.com

RUN npm install && npx prisma db push

COPY . .

RUN npx tsc

FROM base as production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./

EXPOSE 8000

CMD ["node", "app.js"]
