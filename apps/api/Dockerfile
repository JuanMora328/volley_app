FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile
COPY apps/api apps/api
COPY packages/shared packages/shared
RUN pnpm --filter @volleyflow/api build && pnpm prune --prod

FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=3001
WORKDIR /app
RUN addgroup -S volleyflow && adduser -S volleyflow -G volleyflow
COPY --from=build --chown=volleyflow:volleyflow /app/node_modules ./node_modules
COPY --from=build --chown=volleyflow:volleyflow /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=volleyflow:volleyflow /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=volleyflow:volleyflow /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=volleyflow:volleyflow /app/packages/shared/dist ./packages/shared/dist
COPY --from=build --chown=volleyflow:volleyflow /app/packages/shared/package.json ./packages/shared/package.json
COPY --chown=volleyflow:volleyflow apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh
RUN chmod +x ./apps/api/docker-entrypoint.sh
USER volleyflow
EXPOSE 3001
ENTRYPOINT ["./apps/api/docker-entrypoint.sh"]
