# Stage base
FROM node:20 AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Stage build
FROM base AS build
ARG VITE_API_URL
RUN echo "VITE_API_URL=$VITE_API_URL" > .env.production
RUN npm run build

# Stage prod
FROM nginx:alpine AS production
# Vite genera "dist" y no "build"
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
