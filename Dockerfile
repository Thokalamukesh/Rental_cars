# Stage 1: Build the Flutter Web App
FROM ghcr.io/cirruslabs/flutter:stable AS build-env

# Set the working directory
WORKDIR /app

# Copy the project files
COPY . .

# Enable web support
RUN flutter config --enable-web

# Get dependencies
RUN flutter pub get

# Build the web app
RUN flutter build web --release

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy the build artifacts from the build stage
COPY --from=build-env /app/build/web /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
