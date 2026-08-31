# Use Node.js Alpine image for smaller size
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy backend package files and install dependencies.
# Per ADR 0001 the SPA is published as static assets to a CDN, not served by this
# container, so only the backend is built here.
COPY backend/package*.json ./backend/
RUN cd backend && npm ci && npm cache clean --force

# Copy backend source code
COPY backend ./backend

# Change ownership of files to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the API port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))" || exit 1

# Start the API only
CMD ["node", "backend/server.js"]
