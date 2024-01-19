# base
# ------------------------------------------------
FROM node:18-bookworm-slim as base

RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

USER node
WORKDIR /home/node/app

COPY --chown=node:node .yarn/plugins .yarn/plugins
COPY --chown=node:node .yarn/releases .yarn/releases
COPY --chown=node:node .yarnrc.yml .
COPY --chown=node:node package.json .
COPY --chown=node:node api/package.json api/
COPY --chown=node:node web/package.json web/
COPY --chown=node:node yarn.lock .
COPY --chown=node:node .env.defaults .

RUN --mount=type=cache,target=/home/node/.yarn/berry/cache,uid=1000 \
    --mount=type=cache,target=/home/node/.cache,uid=1000 \
    CI=1 yarn install

COPY --chown=node:node redwood.toml .
COPY --chown=node:node graphql.config.js .

# api build
# ------------------------------------------------
FROM base as api_build

COPY --chown=node:node api api
RUN yarn redwood build api

# web build
# ------------------------------------------------
FROM base as web_build

COPY --chown=node:node web web
RUN yarn redwood build web --no-prerender

# DB and data migrations
# ------------------------------------------------
# ideal place for `prisma migrate` and `@redwood/data-migrate`

# web prerender build
# ------------------------------------------------
# FROM api_build as web_build_with_prerender

# COPY --chown=node:node web web
# RUN yarn redwood build web

# serve api and fe
# ------------------------------------------------
FROM node:18-bookworm-slim as api_fe_serve

RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

USER node
WORKDIR /home/node/app

COPY --chown=node:node .yarn/plugins .yarn/plugins
COPY --chown=node:node .yarn/releases .yarn/releases
COPY --chown=node:node .yarnrc.yml .
COPY --chown=node:node api/package.json api/package.json
COPY --chown=node:node web/package.json web/package.json
COPY --chown=node:node package.json .
COPY --chown=node:node yarn.lock .

RUN yarn plugin import workspace-tools
RUN --mount=type=cache,target=/home/node/.yarn/berry/cache,uid=1000 \
    --mount=type=cache,target=/home/node/.cache,uid=1000 \
    CI=1 yarn workspaces focus api web --production

COPY --chown=node:node redwood.toml .
COPY --chown=node:node graphql.config.js .

COPY --chown=node:node --from=api_build /home/node/app/api/dist /home/node/app/api/dist
COPY --chown=node:node --from=api_build /home/node/app/api/db /home/node/app/api/db
COPY --chown=node:node --from=api_build /home/node/app/node_modules/.prisma /home/node/app/node_modules/.prisma

COPY --chown=node:node --from=web_build /home/node/app/web/dist /home/node/app/web/dist

ENV NODE_ENV=production
ENV PRISMA_HIDE_UPDATE_MESSAGE=true

COPY --chown=node:node .fly .fly

ENTRYPOINT ["sh"]
CMD [".fly/start.sh"]
