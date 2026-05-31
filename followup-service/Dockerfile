FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

COPY tsconfig.json ./
COPY src ./src/

RUN npm run prisma:generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev
RUN npm install prisma --save-dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3005

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
