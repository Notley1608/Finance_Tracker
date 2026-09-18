FROM node:26.5.1-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install --global pnpm@10 && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:26.5.1-alpine

WORKDIR /app
COPY --from=build /app/.output ./.output

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5173

EXPOSE 5173

CMD ["node", ".output/server/index.mjs"]