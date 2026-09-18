FROM oven/bun:1.3-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN bun install --no-save

COPY . .
RUN bun run build

FROM oven/bun:1.3-alpine

WORKDIR /app
COPY --from=build /app/.output ./.output

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5173

EXPOSE 5173

CMD ["bun", ".output/server/index.mjs"]