# Tencent Cloud Lighthouse Deployment

This project can be deployed to Tencent Cloud Lighthouse with Docker using:

- `frontend` as a static React app served by Nginx
- `backend` as a Node.js + Express service
- `postgres` as the application database

## Server Assumptions

- Provider: Tencent Cloud Lighthouse
- OS: CentOS 7.6
- Docker: preinstalled
- Public IP: `111.229.239.137`
- Access: `root` over SSH

## Files Added For Deployment

- Root compose file: `docker-compose.prod.yml`
- Production env template: `.env.production.example`
- Frontend Docker image: `frontend/Dockerfile`
- Frontend Nginx config: `frontend/nginx/default.conf`
- Backend Docker image: `real-time-inventory-system-main/backend/Dockerfile`
- Backend startup entrypoint: `real-time-inventory-system-main/backend/docker-entrypoint.sh`

## 1. Prepare Production Env

Copy the env template and update the secrets:

```bash
cp .env.production.example .env.production
```

Recommended values:

```env
POSTGRES_DB=inventory_db
POSTGRES_USER=inventory_admin
POSTGRES_PASSWORD=replace_with_a_strong_password
JWT_SECRET=replace_with_a_long_random_secret
VITE_API_BASE_URL=/api
```

## 2. Upload Project To Server

You can upload the repo with `scp`, `rsync`, or Git.

Example with `rsync` from your Mac:

```bash
rsync -avz --exclude node_modules --exclude dist /Users/liuzeyu/smart-warehouse-system/ root@111.229.239.137:/root/smart-warehouse-system/
```

## 3. SSH Into Server

```bash
ssh root@111.229.239.137
```

Then enter the project:

```bash
cd /root/smart-warehouse-system
```

## 4. Start The Stack

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## 5. Check Services

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs backend --tail 100
docker compose -f docker-compose.prod.yml logs frontend --tail 100
docker compose -f docker-compose.prod.yml logs postgres --tail 100
```

## 6. Access The App

- Frontend: `http://111.229.239.137`
- Login page: `http://111.229.239.137/#/login`
- API docs: `http://111.229.239.137/api-docs/`
- Health check: `http://111.229.239.137/health`

## 7. Initial Admin

Use an account that you already created locally if you restore the same database.

If this is a fresh production database, register a new admin by calling the backend directly from the server or your browser tools after deployment.

Example:

```bash
curl -X POST http://127.0.0.1/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@northline.com","password":"admin123","name":"Northline Admin","role":"ADMIN"}'
```

If you expose this publicly, change the default password immediately after first login.

## 8. Recommended Post-Deployment Hardening

- Change the root SSH password after deployment
- Create a non-root admin user for day-to-day ops
- Enable the Tencent Cloud firewall only for ports `22`, `80`, and later `443`
- Add a domain and HTTPS later through Nginx or a reverse proxy

## 9. Update Workflow

After local changes:

```bash
rsync -avz --exclude node_modules --exclude dist /Users/liuzeyu/smart-warehouse-system/ root@111.229.239.137:/root/smart-warehouse-system/
ssh root@111.229.239.137
cd /root/smart-warehouse-system
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```
