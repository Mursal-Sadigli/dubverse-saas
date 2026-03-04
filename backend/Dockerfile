# Use a Node base image
FROM node:20-slim

# Install FFmpeg and other dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the project (if using TypeScript)
RUN npm run build

# Expose the port
EXPOSE 4000

# Start the application
CMD ["npm", "start"]
