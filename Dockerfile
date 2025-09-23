# Etapa 1: Build do projeto 
FROM node:20-alpine AS build 

WORKDIR /app 

# Copia arquivos de dependência e instala 
COPY package*.json ./ 
RUN npm install 

# Copia o resto do código e faz o build 
COPY . . 
RUN npm run build 

# Etapa 2: Servidor Nginx para servir o build 
FROM nginx:alpine 

# Copia os arquivos buildados para o Nginx 
COPY --from=build /app/dist /usr/share/nginx/html 

# Copia configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 
CMD ["nginx", "-g", "daemon off;"]