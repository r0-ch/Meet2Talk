FROM node:18

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma

ENV DATABASE_URL=file:./dev.db

RUN npm install && npx prisma db push

COPY . .

RUN npx tsc

EXPOSE 8000

CMD ["node", "dist/app.js"]
