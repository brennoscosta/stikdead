# STIKDEAD — Deploy no VPS (Ubuntu 24.04)

Guia completo para colocar o jogo no ar em stikdead.com. Tempo estimado: 30-60 min.
Execute como root (ou com sudo).

## 1. Dependências do sistema

```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs postgresql nginx certbot python3-certbot-nginx unzip
node -v   # deve mostrar v22.x
```

## 2. Banco de dados

```bash
sudo -u postgres psql -c "CREATE USER stikdead WITH PASSWORD 'TROQUE_ESTA_SENHA'"
sudo -u postgres createdb -O stikdead stikdead
```

## 3. Código

Envie o zip do projeto para o servidor (do seu computador):

```bash
scp stikdead-fase4.zip root@SEU_IP:/opt/
```

No servidor:

```bash
cd /opt && unzip stikdead-fase4.zip -d stikdead && cd stikdead

# Servidor
cd server
cp .env.example .env
nano .env
#   DATABASE_URL=postgres://stikdead:TROQUE_ESTA_SENHA@localhost:5432/stikdead
#   JWT_SECRET=  → gere um: openssl rand -hex 32
#   CORS_ORIGIN=https://stikdead.com,https://www.stikdead.com
#   GOOGLE_CLIENT_ID= (se já configurou)
npm install --omit=dev
npm run migrate

# Cliente (build de produção)
cd ../client
npm install
npm run build   # gera client/dist servido pelo Nginx
```

## 4. Processo com PM2

```bash
npm install -g pm2
cd /opt/stikdead
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup   # execute o comando que ele imprimir (inicia no boot)
pm2 logs stikdead --lines 20   # deve mostrar "API + game server na porta 3001"
```

## 5. Nginx + domínio

Aponte o DNS de stikdead.com (registro A) para o IP do VPS antes deste passo.

```bash
cp /opt/stikdead/deploy/nginx.conf /etc/nginx/sites-available/stikdead.com
ln -s /etc/nginx/sites-available/stikdead.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

## 6. SSL (HTTPS)

```bash
certbot --nginx -d stikdead.com -d www.stikdead.com
```

O Certbot edita o Nginx sozinho e renova automaticamente. HTTPS é obrigatório:
fullscreen, gamepad e Google login exigem contexto seguro.

## 7. Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

Postgres (5432) e Node (3001) ficam acessíveis apenas em localhost — não abra essas portas.

## 8. Backup diário do banco

```bash
mkdir -p /opt/backups
crontab -e
# adicione:
# 0 4 * * * pg_dump -U stikdead stikdead | gzip > /opt/backups/stikdead-$(date +\%u).sql.gz
```

(Guarda 7 dias em rotação, um arquivo por dia da semana.)

## 9. Teste final

1. Abra https://stikdead.com no PC → crie conta → Lobby online
2. Abra no celular (outra conta) → Lobby online
3. Desafie do PC → aceite no celular → **lutem pela internet de verdade**
4. Observe o ping no canto e a fluidez — me relate os números

## Convivendo com outros serviços no VPS

Se o VPS roda outros projetos (n8n, ffmpeg etc.), proteja o jogo de picos de CPU:

```bash
# limita processos pesados existentes (exemplo com systemd):
systemctl set-property NOME_DO_SERVICO.service CPUQuota=400%   # máx 4 dos 8 cores
```

Qualquer travada de CPU no servidor vira lag para todos os jogadores em luta.

## Atualizações futuras

```bash
cd /opt/stikdead
# substitua os arquivos pela nova versão, depois:
cd server && npm install --omit=dev && npm run migrate
cd ../client && npm install && npm run build
pm2 restart stikdead
```
