# -----------------------------
# Etapa 1: Build Angular
# -----------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Otimiza cache de dependências
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# Copia o restante do projeto
COPY . .

# Ajuste conforme seu script de build (Angular 17+)
RUN npm run build -- --configuration production

# Debug: mostre o que foi gerado no dist
RUN echo ">>> Conteúdo de /app/dist:" && ls -la /app/dist || true \
 && echo ">>> Recursivo /app/dist:" && ls -R /app/dist || true

# -----------------------------
# Etapa 2: Nginx para servir SPA
# -----------------------------
FROM nginx:alpine

# Remove configs default e cria uma config enxuta para SPA
RUN rm -f /etc/nginx/conf.d/default.conf

# Remove configs default e cria uma config enxuta para SPA + proxy /api
RUN rm -f /etc/nginx/conf.d/default.conf

RUN printf '%s\n' \
"upstream backend_upstream {" \
"    server backend:3000;  # nome do serviço no docker-compose" \
"}" \
"" \
"server {" \
"    listen 80;" \
"    server_name _;" \
"    root /usr/share/nginx/html;" \
"    index index.html;" \
"" \
"    # SPA fallback" \
"    location / {" \
"        try_files \$uri \$uri/ /index.html;" \
"    }" \
"" \
"    # Proxy para o backend (evita CORS)" \
"    location /api/ {" \
"        proxy_pass http://backend_upstream;  # NB: mantém /api/ na URL final" \
"        proxy_http_version 1.1;" \
"        proxy_set_header Host \$host;" \
"        proxy_set_header X-Real-IP \$remote_addr;" \
"        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;" \
"        proxy_set_header X-Forwarded-Proto \$scheme;" \
"    }" \
"" \
"    # Cache para assets" \
"    location ~* \.(?:js|css|png|jpg|jpeg|gif|svg|ico|webp)$ {" \
"        try_files \$uri =404;" \
"        access_log off;" \
"        add_header Cache-Control \"public, max-age=31536000, immutable\";" \
"    }" \
"" \
"    # Segurança básica" \
"    add_header X-Content-Type-Options nosniff;" \
"    add_header X-Frame-Options SAMEORIGIN;" \
"    add_header X-XSS-Protection \"1; mode=block\";" \
"}" \
> /etc/nginx/conf.d/spa.conf


# Limpa o docroot
RUN rm -rf /usr/share/nginx/html/*

# Copia o /dist inteiro para /tmp (para detectar <app>/browser)
COPY --from=build /app/dist /tmp/dist

# 1) Descobre a pasta <app>/browser e copia p/ docroot
RUN set -eux; \
    browser_dir="$(find /tmp/dist -maxdepth 2 -type d -name browser | head -n 1)"; \
    if [ -z "$browser_dir" ]; then \
      echo "ERRO: Não encontrei diretório 'browser' em /tmp/dist. Verifique seu angular.json e o comando de build."; \
      echo "Conteúdo detectado em /tmp/dist:"; ls -R /tmp/dist || true; \
      exit 1; \
    fi; \
    echo "Usando browser_dir: $browser_dir"; \
    cp -r "$browser_dir"/* /usr/share/nginx/html/

# 2) Se for build com SSR, renomeia index.csr.html -> index.html
RUN set -eux; \
    if [ ! -f /usr/share/nginx/html/index.html ] && [ -f /usr/share/nginx/html/index.csr.html ]; then \
      echo "Renomeando index.csr.html -> index.html para deploy estático"; \
      mv /usr/share/nginx/html/index.csr.html /usr/share/nginx/html/index.html; \
    fi

# (Opcional) Debug final do docroot
RUN echo ">>> Conteúdo final em /usr/share/nginx/html:" \
 && ls -la /usr/share/nginx/html \
 && echo ">>> Recursivo final:" \
 && ls -R /usr/share/nginx/html || true

# 3) Permissões: diretórios 755, arquivos 644; ownership nginx
RUN find /usr/share/nginx/html -type d -exec chmod 755 {} \; \
 && find /usr/share/nginx/html -type f -exec chmod 644 {} \; \
 && chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]