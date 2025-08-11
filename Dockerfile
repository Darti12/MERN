# Use Node.js Alpine image for smaller size
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install all dependencies (including dev dependencies needed for running)
RUN npm ci && npm cache clean --force
RUN cd frontend && npm ci && npm cache clean --force  
RUN cd backend && npm ci && npm cache clean --force

# Copy all source code
COPY . .

# Build frontend for production
RUN npm run build-frontend

# Copy built frontend package.json for runtime
COPY frontend/package*.json ./frontend/

# Change ownership of files to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose ports (3000 for frontend, 4000 for backend - adjust as needed)
EXPOSE 3000 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))" || exit 1

# Start both frontend and backend
CMD ["npm", "start"]