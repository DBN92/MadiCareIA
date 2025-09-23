# Etapa 1: Build do projeto 
FROM node:20-alpine AS build 

WORKDIR /app 

COPY package*.json ./ 
RUN npm install 

COPY . . 
RUN npm run build 

# Etapa 2: Servidor Nginx 
FROM nginx:alpine 

RUN apk add --no-cache curl

# Remove a config padrão e adiciona a nossa 
RUN rm /etc/nginx/conf.d/default.conf 
COPY nginx.conf /etc/nginx/conf.d/ 

# Copia o build para o Nginx 
COPY --from=build /app/dist /usr/share/nginx/html 

# Adiciona healthcheck usando curl
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost/ || exit 1

EXPOSE 80 
CMD ["nginx", "-g", "daemon off;"]