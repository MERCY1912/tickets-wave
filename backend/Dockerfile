# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy built app from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

CMD ["npm", "start"]
