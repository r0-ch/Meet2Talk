FROM node:20.9.0-alpine as base

WORKDIR /app

FROM base as deps
ENV DATABASE_URL=file:./dev.db
# Install only production dependencies
COPY package.json package-lock.json prisma/schema.prisma ./
RUN npm ci --omit=dev && npx prisma db push

# Stage for development dependencies (optional)
FROM deps as build

COPY tsconfig.json ./
ARG CORS_ORIGIN=pli.ketsuna.com
# Install all dependencies (both production and dev)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx tsc

FROM base as production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./
COPY --from=deps /app/dev.db ./
EXPOSE 8000

CMD ["node", "app.js"]
