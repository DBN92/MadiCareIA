# Etapa 1: Build 
FROM node:20-alpine AS build 

WORKDIR /app 
COPY package*.json ./ 
RUN npm install 
COPY . . 
RUN npm run build 

# Etapa 2: Nginx 
FROM nginx:alpine 

# Instala curl para healthcheck 
RUN apk add --no-cache curl 

# Remove config padrão e adiciona a nossa 
RUN rm /etc/nginx/conf.d/default.conf 
COPY nginx.conf /etc/nginx/conf.d/ 

# Copia build do React/Vite 
COPY --from=build /app/dist /usr/share/nginx/html 

EXPOSE 80 

# Healthcheck explícito 
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost/ || exit 1 

CMD ["nginx", "-g", "daemon off;"]