# CruzenWeb — Claude Code Context

## Project
MERN stack CRM/client portal for Cruzen Digital (digital marketing agency).
Live at: **https://cruzendigital.us.cc**
VPS: **103.118.183.166** (Ubuntu 22.04, Docker Compose)

## Stack
- **Frontend**: React + Vite, nginx, Docker
- **Backend**: Node.js + Express, Docker
- **DB**: MongoDB 7 (Docker, `cruzen_mongo`)
- **Reverse proxy**: nginx inside `cruzen_frontend` container (ports 80+443)
- **SSL**: Let's Encrypt, certs at `/etc/letsencrypt/live/cruzendigital.us.cc/`

## VPS Access
```
ssh root@103.118.183.166   # password in memory
cd /opt/cruzenweb
docker compose ps
docker logs cruzen_backend --tail 50
```

## Deploying Changes
Backend file change (no npm change):
```bash
# Upload file via paramiko SFTP, then:
docker compose build backend && docker compose up -d backend
```
Frontend change:
```bash
# Upload via tar SFTP, then:
docker compose build frontend && docker compose up -d frontend
```
Env var change only (no code change):
```bash
# Edit /opt/cruzenweb/backend/.env, then:
docker compose up -d backend   # no build needed — env_file is read at start
```

## Key Files
| File | Purpose |
|------|---------|
| `docker-compose.yml` | Orchestration — backend uses `env_file: ./backend/.env` |
| `backend/.env` | All production secrets (PayU, Google OAuth, Brevo SMTP) |
| `frontend/nginx.conf` | HTTP→HTTPS redirect, API proxy, Socket.io proxy |
| `backend/controllers/payuController.js` | PayU hash gen + success/failure callbacks |
| `backend/controllers/orderController.js` | Order creation, Razorpay fallback logic |
| `backend/services/emailService.js` | Nodemailer via Brevo SMTP |

## Environment Variables (backend/.env)
```
NODE_ENV=production
FRONTEND_URL=https://cruzendigital.us.cc
BACKEND_URL=https://cruzendigital.us.cc
GOOGLE_CLIENT_ID=977722113414-c4igp3t7bcp3clh57fn8o6kdr3scmk0v.apps.googleusercontent.com
PAYU_KEY=hLtZOH
PAYU_URL=https://secure.payu.in/_payment
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=afbce5001@smtp-brevo.com
SMTP_FROM=noreply@cruzendigital.us.cc
```
Secrets (PAYU_SALT, GOOGLE_CLIENT_SECRET, SMTP_PASS, JWT_SECRET, MONGO creds) — in the actual file on VPS, not committed to git.

## User Roles
| Role | Login | Notes |
|------|-------|-------|
| Admin | admin@cruzendigital.com | Full CRM access |
| POS Head | poshead@cruzendigital.com | Manage assigned orders/team |
| Team Member | teammember@cruzendigital.com | Project work view |
| Client | any registered user | Services, dashboard, payments |

## Payment Flow (PayU)
1. `POST /api/orders/create` → creates DB order, skips Razorpay (placeholder keys)
2. `POST /api/orders/payu/init` → generates SHA512 hash, returns form params
3. Frontend posts HTML form to `https://secure.payu.in/_payment`
4. PayU redirects to `BACKEND_URL/api/orders/payu/success` or `/failure`
5. Success handler verifies reverse hash, activates order, creates tracker

**Hash formula**: `sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)`
**Critical**: `udf1` = orderId must be in BOTH the hash AND the form POST params.

## Known Issues / History
- `crypto.randomUUID()` crashes on HTTP — fixed with Math.random fallback in axios.js + Chatbot.jsx
- `body { opacity: 0 }` in style.css caused blank page — fixed to `opacity: 1`
- Razorpay keys are placeholders — `isRazorpayConfigured()` now also checks for 'placeholder'
- PayU hash had `udf1` in hash but NOT in form params — fixed June 2026
- Root `.env` only has Mongo creds; all app secrets are in `backend/.env` (docker-compose uses `env_file: ./backend/.env`)
- Google OAuth redirect callback: `https://cruzendigital.us.cc/api/auth/google/callback` — must be in Google Cloud Console

## Email (Brevo)
- Provider: Brevo (smtp-relay.brevo.com:587)
- Previous Gmail SMTP caused spam — switched to Brevo June 2026
- `SMTP_FROM=noreply@cruzendigital.us.cc` — add as verified sender in Brevo dashboard for cleaner display
- Domain DKIM verification in Brevo is optional but improves deliverability

## DNS (indiahost.co nameservers)
```
@ A 103.118.183.166
www A 103.118.183.166
```
Note: Do NOT add both A record and CNAME for same hostname — caused SERVFAIL previously.

## Git
Remote: https://github.com/yash1577711/cruzen.git
`.gitignore` must exclude: `backend/.env`, `node_modules/`, `dist/`, `.env`
