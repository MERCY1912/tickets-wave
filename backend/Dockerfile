# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all files (since we're in backend/ context)
COPY . .

# Install dependencies
RUN npm ci

# Generate Prisma Client before build
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Generate Prisma Client for production
RUN npx prisma generate

# Create database directory
RUN mkdir -p /app/db

EXPOSE 3001

CMD ["npm", "start"]
