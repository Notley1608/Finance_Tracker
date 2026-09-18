FROM oven/bun:1.3-alpine

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/data/database.sqlite.db

RUN mkdir -p /data

EXPOSE 3000

CMD ["sh", "-c", "bun run migrate && bun run start"]