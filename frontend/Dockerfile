# Stage base
FROM node:20 AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Development stage
FROM base AS development
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Stage build
FROM base AS build
ARG VITE_API_URL
RUN echo "VITE_API_URL=$VITE_API_URL" > .env.production
RUN npm run build

# Stage final
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
