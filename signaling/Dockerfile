FROM node:18

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install && npx prisma db push

COPY . .

RUN npx tsc

EXPOSE 8000
EXPOSE 38000-38010/udp

CMD ["node", "dist/app.js"]
