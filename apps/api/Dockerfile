FROM node:20-slim

WORKDIR /repo

COPY . .
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm --filter @tender-intel/api prisma:generate
RUN pnpm --filter @tender-intel/api build

WORKDIR /repo/apps/api
CMD ["node", "dist/main.js"]
