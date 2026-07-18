FROM node:20-bullseye AS builder
WORKDIR /app

# Install OS-level build dependencies required by native modules
RUN apt-get update && apt-get install -y \
	build-essential \
	python3 \
	pkg-config \
	libcairo2-dev \
	libpango1.0-dev \
	libjpeg-dev \
	libgif-dev \
	libpng-dev \
	&& rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy only production artifacts and compiled native modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
