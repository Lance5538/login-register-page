FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci && npx prisma generate

COPY openapi.yaml ./openapi.yaml
COPY tsconfig.json ./tsconfig.json
COPY src ./src
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh && npm run build

EXPOSE 4000

CMD ["./docker-entrypoint.sh"]
