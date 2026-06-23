# Cruzen Digital — VPS Deployment Guide

Full-stack MERN application deployed with Docker Compose.  
Stack: **React + Vite → Nginx** | **Node.js / Express** | **MongoDB 7** | **Socket.io** | **PayU / Razorpay**

---

## Table of Contents

1. [VPS Requirements](#1-vps-requirements)
2. [Server Initial Setup](#2-server-initial-setup)
3. [Install Docker](#3-install-docker)
4. [Clone the Repository](#4-clone-the-repository)
5. [Configure Environment Variables](#5-configure-environment-variables)
6. [Configure Domain & SSL](#6-configure-domain--ssl)
7. [Build & Launch](#7-build--launch)
8. [Seed the Database](#8-seed-the-database)
9. [Verify Deployment](#9-verify-deployment)
10. [Maintenance](#10-maintenance)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. VPS Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| OS       | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| CPU      | 1 vCPU  | 2 vCPU |
| RAM      | 2 GB    | 4 GB |
| Disk     | 20 GB SSD | 40 GB SSD |
| Ports    | 22, 80, 443 | 22, 80, 443 |

> Providers: DigitalOcean, Hetzner, AWS Lightsail, Vultr, Linode all work fine.

---

## 2. Server Initial Setup

SSH into your VPS as root, then run:

```bash
# Update packages
apt update && apt upgrade -y

# Create a non-root user
adduser deploy
usermod -aG sudo deploy

# Copy SSH key to new user
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Switch to deploy user
su - deploy
```

**Configure firewall:**

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 3. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Add your user to the docker group (no sudo needed)
sudo usermod -aG docker $USER

# Log out and back in, then verify
docker --version
docker compose version
```

---

## 4. Clone the Repository

```bash
cd /home/deploy

# If using Git
git clone https://github.com/YOUR_USERNAME/cruzenweb.git
cd cruzenweb

# Or upload via SCP from your local machine:
# scp -r C:\Users\yk157\cruzenweb deploy@YOUR_VPS_IP:/home/deploy/cruzenweb
```

---

## 5. Configure Environment Variables

### 5a. Root `.env` (Docker Compose)

Create `/home/deploy/cruzenweb/.env`:

```bash
nano /home/deploy/cruzenweb/.env
```

```env
# MongoDB credentials (used by Docker Compose)
MONGO_ROOT_USER=cruzen_admin
MONGO_ROOT_PASS=CHANGE_THIS_STRONG_PASSWORD
```

### 5b. Backend `.env`

Create `/home/deploy/cruzenweb/backend/.env`:

```bash
nano /home/deploy/cruzenweb/backend/.env
```

```env
# ── App ────────────────────────────────────────────────────────
NODE_ENV=production
PORT=5000

# ── MongoDB ────────────────────────────────────────────────────
# Must match MONGO_ROOT_USER / MONGO_ROOT_PASS above
MONGO_URI=mongodb://cruzen_admin:CHANGE_THIS_STRONG_PASSWORD@mongodb:27017/cruzendigital?authSource=admin

# ── JWT ────────────────────────────────────────────────────────
JWT_SECRET=CHANGE_THIS_RANDOM_64_CHAR_SECRET
JWT_REFRESH_SECRET=CHANGE_THIS_ANOTHER_RANDOM_64_CHAR_SECRET
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# ── URLs ───────────────────────────────────────────────────────
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com/api

# ── Admin seed credentials ─────────────────────────────────────
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=CHANGE_THIS_STRONG_ADMIN_PASSWORD
ADMIN_NOTIFY_EMAIL=info@cruzendigital.com

# ── Google OAuth ───────────────────────────────────────────────
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ── Email (Gmail SMTP) ─────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password

# ── PayU (Primary payment gateway) ────────────────────────────
PAYU_KEY=your_payu_merchant_key
PAYU_SALT=your_payu_salt
PAYU_URL=https://secure.payu.in/_payment

# ── Razorpay (Fallback) ────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_live_your_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# ── SMS OTP (2factor.in) ───────────────────────────────────────
TWOFACTOR_API_KEY=your_2factor_api_key
```

> **Security:** Generate strong secrets with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 5c. Frontend `.env`

Create `/home/deploy/cruzenweb/frontend/.env`:

```bash
nano /home/deploy/cruzenweb/frontend/.env
```

```env
VITE_API_URL=https://yourdomain.com/api
```

> This is baked into the frontend build — make sure the domain is final before building.

---

## 6. Configure Domain & SSL

### 6a. Point your domain

In your domain registrar's DNS, add an **A record**:

```
Type: A
Name: @  (or yourdomain.com)
Value: YOUR_VPS_IP
TTL: 300
```

For `www`:
```
Type: A
Name: www
Value: YOUR_VPS_IP
TTL: 300
```

Wait 5–30 minutes for DNS to propagate. Verify with:
```bash
dig yourdomain.com +short
```

### 6b. Update nginx.conf for HTTPS

Edit `/home/deploy/cruzenweb/frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    root /usr/share/nginx/html;
    index index.html;

    # React SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to backend
    location /api/ {
        proxy_pass http://backend:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://backend:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1024;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

### 6c. Get SSL certificate (Let's Encrypt)

Install Certbot on the VPS host (not inside Docker):

```bash
sudo apt install certbot -y

# Stop any service on port 80 first
sudo docker compose down   # if already running

# Get certificate
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email info@cruzendigital.com \
  --agree-tos --non-interactive

# Certificates are saved to:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

Mount the certificates in `docker-compose.yml` — update the `frontend` service:

```yaml
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: cruzen_frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt/live/yourdomain.com/fullchain.pem:/etc/nginx/ssl/fullchain.pem:ro
      - /etc/letsencrypt/live/yourdomain.com/privkey.pem:/etc/nginx/ssl/privkey.pem:ro
    depends_on:
      - backend
    networks:
      - cruzen_net
```

**Auto-renew SSL** (add to cron):
```bash
sudo crontab -e
# Add this line:
0 3 * * * certbot renew --quiet && docker restart cruzen_frontend
```

---

## 7. Build & Launch

```bash
cd /home/deploy/cruzenweb

# Build all images and start containers in background
docker compose up -d --build

# Watch startup logs
docker compose logs -f
```

All three containers should start:
- `cruzen_mongo` — MongoDB database
- `cruzen_backend` — Node.js API on port 5000
- `cruzen_frontend` — Nginx serving React on ports 80/443

Check status:
```bash
docker compose ps
```

Expected output:
```
NAME               STATUS
cruzen_mongo       Up (healthy)
cruzen_backend     Up
cruzen_frontend    Up
```

---

## 8. Seed the Database

Run the seed script once to create the admin user and default data:

```bash
docker exec -it cruzen_backend node seed.js
```

This creates:
- Admin account (`ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`)
- Default site configuration

Login at: `https://yourdomain.com/admin`

---

## 9. Verify Deployment

```bash
# API health check
curl https://yourdomain.com/api/health

# Expected: {"status":"ok","..."}
```

Then open in browser:
- `https://yourdomain.com` — Frontend homepage
- `https://yourdomain.com/admin` — Admin dashboard
- `https://yourdomain.com/login` — Client login

---

## 10. Maintenance

### View logs

```bash
# All containers
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
```

### Deploy updates

```bash
cd /home/deploy/cruzenweb

# Pull latest code
git pull origin main

# Rebuild and restart (zero-downtime for DB)
docker compose up -d --build backend frontend

# If you changed docker-compose.yml itself:
docker compose down && docker compose up -d --build
```

### Backup MongoDB

```bash
# Create backup
docker exec cruzen_mongo mongodump \
  --username cruzen_admin \
  --password YOUR_MONGO_PASS \
  --authenticationDatabase admin \
  --db cruzendigital \
  --out /tmp/backup_$(date +%Y%m%d)

# Copy backup to host
docker cp cruzen_mongo:/tmp/backup_$(date +%Y%m%d) /home/deploy/backups/

# Automate daily backups (add to cron)
# crontab -e
# 0 2 * * * docker exec cruzen_mongo mongodump --username cruzen_admin --password YOUR_PASS --authenticationDatabase admin --db cruzendigital --archive=/tmp/backup_daily.gz --gzip && docker cp cruzen_mongo:/tmp/backup_daily.gz /home/deploy/backups/backup_$(date +\%Y\%m\%d).gz
```

### Restore MongoDB

```bash
docker exec -i cruzen_mongo mongorestore \
  --username cruzen_admin \
  --password YOUR_MONGO_PASS \
  --authenticationDatabase admin \
  --archive=/tmp/backup.gz --gzip
```

### Restart a container

```bash
docker restart cruzen_backend
docker restart cruzen_frontend
docker restart cruzen_mongo
```

### Stop everything

```bash
docker compose down

# Stop AND remove volumes (⚠️ deletes all DB data)
docker compose down -v
```

---

## 11. Troubleshooting

### Container won't start

```bash
# Check detailed logs
docker compose logs backend
docker compose logs mongodb

# Check if port is already in use
sudo lsof -i :80
sudo lsof -i :5000
sudo lsof -i :27017
```

### Backend can't connect to MongoDB

Make sure `MONGO_URI` in `backend/.env` uses the Docker service name `mongodb` (not `localhost`):
```
MONGO_URI=mongodb://cruzen_admin:PASSWORD@mongodb:27017/cruzendigital?authSource=admin
```

### Frontend shows blank page / 404

```bash
# Check if the build succeeded
docker compose logs frontend | grep error

# Re-build just the frontend
docker compose up -d --build frontend
```

### API requests fail (CORS / 502)

- Confirm `VITE_API_URL` in `frontend/.env` matches your actual domain
- Confirm `FRONTEND_URL` in `backend/.env` matches your actual domain
- Both must be set before running `docker compose build`
- Check nginx proxy config points to `http://backend:5000`

### Socket.io not connecting

Ensure the nginx config has the WebSocket upgrade headers in the `/socket.io/` location block (see Section 6b). Also confirm ports 80/443 are open in the firewall:
```bash
sudo ufw status
```

### SSL certificate errors

```bash
# Test renewal manually
sudo certbot renew --dry-run

# Check cert expiry
sudo certbot certificates
```

### Out of disk space

```bash
# Remove unused Docker images and containers
docker system prune -a

# Check disk usage
df -h
du -sh /var/lib/docker
```

---

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_ROOT_USER` | ✅ | MongoDB root username |
| `MONGO_ROOT_PASS` | ✅ | MongoDB root password |
| `MONGO_URI` | ✅ | Full MongoDB connection string |
| `JWT_SECRET` | ✅ | JWT signing secret (64+ chars) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token secret (64+ chars) |
| `FRONTEND_URL` | ✅ | e.g. `https://yourdomain.com` |
| `BACKEND_URL` | ✅ | e.g. `https://yourdomain.com/api` |
| `VITE_API_URL` | ✅ | Same as BACKEND_URL (frontend build) |
| `ADMIN_EMAIL` | ✅ | Initial admin login email |
| `ADMIN_PASSWORD` | ✅ | Initial admin login password |
| `SMTP_HOST` | ✅ | Email provider SMTP host |
| `SMTP_USER` | ✅ | SMTP username |
| `SMTP_PASS` | ✅ | SMTP app password |
| `PAYU_KEY` | ✅ | PayU merchant key |
| `PAYU_SALT` | ✅ | PayU merchant salt |
| `PAYU_URL` | ✅ | `https://secure.payu.in/_payment` (live) |
| `RAZORPAY_KEY_ID` | ⚠️ | Razorpay fallback key |
| `RAZORPAY_KEY_SECRET` | ⚠️ | Razorpay fallback secret |
| `GOOGLE_CLIENT_ID` | ⚠️ | Google OAuth (for Google login) |
| `GOOGLE_CLIENT_SECRET` | ⚠️ | Google OAuth secret |
| `TWOFACTOR_API_KEY` | ⚠️ | SMS OTP via 2factor.in |

✅ = Required for core functionality  
⚠️ = Required for that specific feature

---

## Quick Reference

```bash
# Start
docker compose up -d --build

# Stop
docker compose down

# Logs
docker compose logs -f

# Restart backend only
docker restart cruzen_backend

# Run seed
docker exec -it cruzen_backend node seed.js

# Backup DB
docker exec cruzen_mongo mongodump --username cruzen_admin --password PASS --authenticationDatabase admin --db cruzendigital --out /tmp/backup && docker cp cruzen_mongo:/tmp/backup ./backups/

# Update deployment
git pull && docker compose up -d --build backend frontend
```
