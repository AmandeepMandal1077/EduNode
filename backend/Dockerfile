FROM oven/bun:1-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY . .

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
