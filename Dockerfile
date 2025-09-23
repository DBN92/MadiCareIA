# Imagem base
FROM node:20-alpine AS build

# Diretório de trabalho
WORKDIR /app

# Copia arquivos de dependência e instala
COPY package*.json ./
RUN npm install

# Copia o resto do projeto e builda
COPY . .
RUN npm run build

# Servidor final (nginx serve arquivos estáticos)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]