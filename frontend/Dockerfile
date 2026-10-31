# Stage 1: Build React Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json ./

# Install dependencies cleanly
RUN npm ci

# Copy source code and build
COPY . ./
RUN npm run build

# Stage 2: Serve with Nginx Alpine
FROM nginx:1.27-alpine

# Copy built artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
