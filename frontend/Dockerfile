FROM oven/bun:latest

WORKDIR /app

COPY package.json ./
COPY bun.lock ./

RUN bun install

COPY . .

CMD ["bun", "run", "dev", "--host", "0.0.0.0"]
