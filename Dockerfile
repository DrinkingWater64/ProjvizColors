# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY ProjVizColors/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY ProjVizColors/ .

# Build the application
RUN npm run build

# Install serve to run the built application
RUN npm install -g serve

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"] 