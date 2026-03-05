# Mini tutorial docker

## Comandos DOCKER importantes

### Parar e remover containers, redes e volumes
```bash
docker compose down -v
```
### Recriar containers sem cache
```bash
docker compose build --no-cache
```

### Iniciar containers
```bash
docker compose up -d
```

### Acompanhar logs de serviços especificos
```bash
docker compose logs -f database backend frontend
```


### Acompanhar logs de serviços especificos
```bash
docker compose logs -f database backend frontend
```


### Listar containers em execução
```bash
docker ps
```

### Listar todos os containers (inclusive parados)
```bash
docker ps -a
```

### Acompanhar logs de serviços especificos
```bash
docker stop <container_id>
```

### Remover uma imagem
```bash
docker rmi <image_id>
```

### Entrar dentro do container (terminal)
```bash
docker exec -it <container_name> bash
```


### Ver logs de um container específico
```bash
docker logs -f <container_name>
```

### Limpar tudo (imagens e volumes não usados)
```bash
docker system prune -a --volumes
```
## Comandos Docker-compose 

```yaml
frontend:
  build:
    significado: "Diretório onde o Dockerfile será usado para gerar a imagem."
    exemplo: "./front_end/aula_front_web"

  container_name:
    significado: "Nome fixo do container."
    exemplo: "frontend"

  ports:
    significado: "Mapeia porta do host → porta do container."
    exemplo: "4200:80"

  depends_on:
    significado: "Define ordem de inicialização."
    detalhe: "backend deve iniciar antes do frontend."

  networks:
    significado: "Rede interna que o serviço usará."
    exemplo: "appnet"

  restart:
    significado: "Reinicia o container automaticamente sob certas condições."
    valores: ["no", "always", "on-failure", "unless-stopped"]
```

```yaml
backend:
  build:
    significado: "Diretório com o Dockerfile do backend."
  
  container_name:
    significado: "Nome do container."

  ports:
    significado: "Expõe a API para o host."
    exemplo: "3000:3000"

  expose:
    significado: "Expõe porta APENAS na rede interna Docker."
    exemplo: "3000"

  env_file:
    significado: "Carrega variáveis de ambiente de um arquivo."
    exemplo: "./.env/backend.env"

  depends_on:
    significado: "Espera database e storage antes de iniciar."
    detalhe:
      condition_service_healthy: "Espera healthcheck do Postgres."
      condition_service_started: "Aguarda o MinIO de pé."

  networks:
    significado: "Rede interna Docker."

  restart:
    significado: "Reinício automático controlado."
    
```


```yaml
database:
  image:
    significado: "Imagem oficial do postgres a ser utilizada."
    exemplo: "postgres:15"

  container_name:
    significado: "Nome do container."

  environment:
    significado: "Variáveis obrigatórias do PostgreSQL."
    itens:
      POSTGRES_USER: "Usuário padrão"
      POSTGRES_PASSWORD: "Senha"
      POSTGRES_DB: "Banco inicial"

  volumes:
    significado: "Persistência dos dados do banco."
    exemplo: "pg_data:/var/lib/postgresql/data"

  expose:
    significado: "Porta visível APENAS para serviços no Docker."

  healthcheck:
    significado: "Verifica se o banco está pronto para conexões."
    parâmetros:
      interval: "Intervalo entre testes"
      timeout: "Tempo máximo por teste"
      retries: "Tentativas antes de marcar como unhealthy"

  networks:
    significado: "Rede interna usada pelo container."

  restart:
    significado: "Reinício automático controlado."
```

```yaml
storage:
  image:
    significado: "Imagem oficial do MinIO."

  container_name:
    significado: "Nome do container."

  ports:
    significado: "Portas expostas no host."
    exemplo:
      9000: "API (S3)"
      9001: "Painel administrativo"

  environment:
    significado: "Credenciais do MinIO."
    itens:
      MINIO_ROOT_USER: "Usuário admin"
      MINIO_ROOT_PASSWORD: "Senha admin"

  command:
    significado: "Comando para inicializar o MinIO."
    exemplo: "server /data --console-address ':9001'"

  volumes:
    significado: "Persistência dos arquivos do MinIO."

  networks:
    significado: "Rede interna docker."

  restart:
    significado: "Reinício automático."
```

```yaml
watchtower:
  image:
    significado: "Imagem oficial do Watchtower."

  volumes:
    significado: "Necessário para que o watchtower leia containers em execução."
    exemplo: "/var/run/docker.sock:/var/run/docker.sock"

  command:
    significado: "Define intervalo de checagem e limpeza."
    exemplo: "--interval 30 --cleanup"

  restart:
    significado: "Reinício automático."
```


```yaml
volumes:
  pg_data:
    significado: "Armazena dados do PostgreSQL."
  minio_data:
    significado: "Armazena arquivos do MinIO."
networks:
  appnet:
    significado: "Rede bridge interna para comunicação entre serviços."
```

## Comandos dockerfile


```dockerfile
FROM node:22-alpine:
  significado: "Imagem base leve com Node.js."

WORKDIR /app:
  significado: "Define diretório padrão de trabalho."

COPY package*.json ./:
  significado: "Copia apenas os manifests para otimizar cache."

RUN npm ci:
  significado: "Instala dependências com reprodutibilidade garantida."

COPY . .:
  significado: "Copia todo o restante do código."

RUN npm run build:
  significado: "Gera build otimizado do Angular."

FROM nginx:alpine:
  significado: "Imagem leve do nginx para servir arquivos estáticos."

RUN rm ... default.conf:
  significado: "Remove configuração padrão do nginx."

printf ... spa.conf:
  significado: "Cria configuração do nginx para SPA + proxy para /api."

COPY --from=build:
  significado: "Puxa o build do Angular do estágio anterior."

EXPOSE 80:
  significado: "Expõe porta HTTP."

CMD ["nginx", "-g", "daemon off;"]:
  significado: "Mantém o nginx rodando em foreground."
```

```dockerfile
FROM node:20-alpine AS build:
  significado: "Stage de build com devDependencies."

RUN npm ci:
  significado: "Instala dependências inclusive de build."

RUN npm run build:
  significado: "Compila o backend para /dist."

FROM node:20-alpine AS runtime:
  significado: "Imagem final apenas para produção."

RUN npm ci --only=production:
  significado: "Instala somente dependências necessárias em prod."

COPY --from=build /app/dist ./dist:
  significado: "Copia arquivos compilados da stage build."

ENV NODE_ENV=production:
  significado: "Define ambiente como produção."

CMD ["node", "dist/server.js"]:
  significado: "Comando para iniciar o backend."
```