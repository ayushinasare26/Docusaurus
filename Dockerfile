# Multi-stage build for Next.js application
FROM node:20 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--expose-gc --max-old-space-size=1536"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install Google Chrome Stable (required for Puppeteer PDF generation)
RUN apt-get update && apt-get install -y wget gnupg ca-certificates \
    fonts-liberation libatk1.0-0 libatk-bridge2.0-0 libcups2 libdbus-1-3 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 \
    libpangocairo-1.0-0 libgtk-3-0 --no-install-recommends \
 && wget -q -O /tmp/google.asc https://dl.google.com/linux/linux_signing_key.pub \
 && gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg /tmp/google.asc \
 && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
    > /etc/apt/sources.list.d/google-chrome.list \
 && apt-get update \
 && apt-get install -y google-chrome-stable \
 && rm -rf /var/lib/apt/lists/* /tmp/google.asc

# Puppeteer: use system Chrome and writable cache dir
ENV PUPPETEER_EXEC_PATH=/usr/bin/google-chrome-stable
ENV PUPPETEER_CACHE_DIR=/tmp/.cache/puppeteer
RUN mkdir -p /tmp/.cache/puppeteer && chmod 1777 /tmp/.cache/puppeteer

# Chrome writes profile/crashpad data to HOME — set to /tmp so nextjs user can write
ENV HOME=/tmp

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN mkdir -p public/cdrOutputs uploads \
 && chown -R nextjs:nodejs public/cdrOutputs uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
