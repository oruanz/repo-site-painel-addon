# Stremio Addon - Biblioteca Compartilhada com RealDebrid

Addon para Stremio que permite gerenciar uma biblioteca centralizada de torrents e distribuir para múltiplos usuários usando RealDebrid individual.

## Funcionalidades

- Painel administrativo web para gerenciar biblioteca
- Suporte a filmes e séries
- Integração com RealDebrid (cada usuário usa seu próprio token)
- Sistema de Setup Code para proteger tokens sensíveis
- Suporte a legendas externas
- Busca no catálogo

## Estrutura

```
/server          - Backend Node.js com Express e Stremio SDK
  /server.js     - Servidor principal
  /db.js         - Gerenciamento do banco SQLite
  /realdebrid.js - Integração com API do RealDebrid
  /package.json  - Dependências do servidor

/src             - Frontend React (painel admin)
  /components    - Componentes do painel
  /App.tsx       - Aplicação principal
```

## Instalação e Uso

### 1. Instalar dependências do servidor

```bash
cd server
npm install
```

### 2. Instalar dependências do frontend

```bash
npm install
```

### 3. Buildar o frontend

```bash
npm run build
```

### 4. Iniciar o servidor

```bash
cd server
node server.js
```

O servidor irá iniciar na porta 7000 (configurável via PORT).

Na primeira execução, será gerada uma ADMIN_KEY no console. Salve essa chave!

### 5. Acessar o painel

Abra `http://localhost:7000/panel` e entre com a ADMIN_KEY.

### 6. Configurar usuários

Cada usuário deve:
1. Acessar `http://localhost:7000/setup`
2. Colar seu token RealDebrid
3. Copiar o Setup Code gerado
4. Instalar o addon no Stremio usando a URL do manifest configurado

## Variáveis de Ambiente

Crie um arquivo `.env` no diretório `server/`:

```bash
PORT=7000
BASE_URL=http://seu-dominio.com
ADMIN_KEY=sua_chave_admin_secreta
DB_PATH=./data.sqlite
JWT_SECRET=seu_jwt_secret
SYSTEM_EMAIL=family@local
```

## Como Adicionar Conteúdo

### Via Painel Web

1. Clique em "Adicionar Item"
2. Preencha os dados (ID Stremio, nome, poster, descrição)
3. Após criar, clique em "Adicionar Stream/Legenda"
4. Adicione o hash do torrent (infohash)
5. Opcionalmente adicione legendas

### Formato do Hash do Torrent

Use apenas o infohash (sem `magnet:?xt=urn:btih:`):
```
abc123def456...
```

## Fluxo de Funcionamento

1. **Admin** gerencia biblioteca (adiciona filmes/séries com hashes de torrent)
2. **Usuário** acessa `/setup` e insere token RealDebrid
3. Sistema gera **Setup Code** único
4. **Usuário** instala addon no Stremio com URL configurada
5. Quando usuário assiste conteúdo:
   - Addon consulta biblioteca
   - Usa RealDebrid do usuário para converter torrent em stream
   - Retorna URL de stream direta

## API Endpoints

### Addon (público)
- `GET /manifest.json` - Manifest do addon
- `GET /catalog/:type/:id.json` - Catálogo de itens
- `GET /meta/:type/:id.json` - Metadados de um item
- `GET /stream/:type/:id.json` - Streams disponíveis
- `GET /subtitles/:type/:id.json` - Legendas disponíveis

### Setup (público)
- `GET /setup` - Página para gerar Setup Code
- `POST /setup` - Processa token e gera código

### Admin (requer X-Admin-Key)
- `GET /api/items` - Lista todos os itens
- `POST /api/items` - Adiciona novo item
- `DELETE /api/items/:id` - Remove item
- `POST /api/items/:id/streams` - Adiciona stream
- `DELETE /api/streams/:id` - Remove stream
- `POST /api/items/:id/subtitles` - Adiciona legenda
- `DELETE /api/subtitles/:id` - Remove legenda

## Segurança

- Admin Key protege painel de gerenciamento
- Tokens RealDebrid ficam isolados por Setup Code
- Cada usuário usa apenas seu próprio token
- Tokens nunca aparecem no URL do manifest compartilhável

## Deploy em Produção

### Configurar variáveis de ambiente
```bash
BASE_URL=https://seu-dominio.com
ADMIN_KEY=chave_super_secreta
PORT=7000
```

### Usar processo persistente
```bash
# Com PM2
pm2 start server/server.js --name stremio-addon

# Ou com screen/tmux
screen -S stremio
node server/server.js
```

### Proxy reverso (nginx)
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:7000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Notas Legais

Este addon é para uso pessoal e compartilhamento familiar de conteúdo que você possui direitos legais de acesso. Não use para distribuição não autorizada de material protegido por direitos autorais.

## Licença

MIT
