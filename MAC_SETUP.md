# Mac M1 Pro Setup Guide
> Migrating from Windows 11 — everything needed to match your current dev environment.

---

## 1. Homebrew (package manager — install this first)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# After install, follow the instructions to add brew to PATH for Apple Silicon:
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

---

## 2. Core CLI Tools
```bash
brew install git node python@3.13 openjdk@21 php@8.2 composer rustup
```

Verify:
```bash
git --version        # 2.52+
node --version       # v24+
python3 --version    # 3.13+
java --version       # 21+
php --version        # 8.2+
composer --version   # 2.8+
```

**Java PATH** (Apple Silicon):
```bash
echo 'export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"' >> ~/.zprofile
```

**Rust** (after installing rustup):
```bash
rustup-init
# Current version: 1.94.0
```

---

## 3. Node.js — Global npm Packages
```bash
npm install -g @anthropic-ai/claude-code @google/gemini-cli opencode-ai @railway/cli @shopify/cli @shopify/theme npm
```

---

## 4. Docker Desktop for Mac (Apple Silicon)
Download from: https://www.docker.com/products/docker-desktop/
- Choose **Apple Silicon** build
- Current version on Windows: Docker 29.1.3
- After install, open Docker Desktop and enable it in menu bar

Verify:
```bash
docker --version
docker compose version
```

---

## 5. Python Packages
```bash
# Install all at once
pip3 install \
  paramiko \
  requests \
  flask \
  django \
  djangorestframework \
  django-cors-headers \
  django-environ \
  python-dotenv \
  python-decouple \
  pydantic \
  fastapi \
  uvicorn \
  gunicorn \
  sqlalchemy \
  psycopg2-binary \
  pymongo \
  supabase \
  pandas \
  numpy \
  matplotlib \
  plotly \
  scikit-learn \
  scipy \
  catboost \
  jupyter \
  jupyterlab \
  notebook \
  ipython \
  pillow \
  opencv-python-headless \
  beautifulsoup4 \
  httpx \
  aiohttp \
  stripe \
  razorpay \
  google-auth \
  google-auth-oauthlib \
  PyJWT \
  bcrypt \
  cryptography \
  paramiko \
  PyYAML \
  python-multipart \
  reportlab \
  pypdf \
  pytz \
  virtualenv \
  uv \
  pytest \
  black \
  isort \
  mypy
```

---

## 6. VS Code
Download from: https://code.visualstudio.com/ (Universal / Apple Silicon build)

**Extensions — install all:**
```bash
code --install-extension anthropic.claude-code
code --install-extension ms-python.python
code --install-extension ms-python.vscode-pylance
code --install-extension ms-python.debugpy
code --install-extension ms-azuretools.vscode-containers
code --install-extension ms-vscode-remote.remote-containers
code --install-extension ritwickdey.liveserver
code --install-extension bmewburn.vscode-intelephense-client
code --install-extension devsense.composer-php-vscode
code --install-extension devsense.phptools-vscode
code --install-extension batisteo.vscode-django
code --install-extension ecmel.vscode-html-css
code --install-extension mohd-akram.vscode-html-format
code --install-extension mechatroner.rainbow-csv
code --install-extension tomoki1207.pdf
code --install-extension ms-vsliveshare.vsliveshare
code --install-extension github.codespaces
```

---

## 7. MongoDB Tools (optional — for local dev)
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0 mongosh
brew services start mongodb-community@7.0
```
> Note: For CruzenWeb the DB runs in Docker, so local MongoDB is only needed for standalone dev work.

---

## 8. SSH Setup
```bash
# Generate SSH key for GitHub
ssh-keygen -t ed25519 -C "artithapacruzen@gmail.com"
# Add to GitHub: https://github.com/settings/keys
cat ~/.ssh/id_ed25519.pub

# Clone CruzenWeb project
git clone https://github.com/yash1577711/cruzen.git
```

---

## 9. CruzenWeb Project Setup (after cloning)
```bash
cd cruzen

# Create backend/.env (copy values from VPS — DO NOT commit this file)
cp backend/.env.example backend/.env   # or create manually
# Fill in: PAYU_KEY, PAYU_SALT, GOOGLE_CLIENT_ID/SECRET, SMTP creds, JWT secrets, Mongo creds

# Build and start all containers
docker compose up -d --build

# Site runs at http://localhost (port 80)
```

---

## 10. VPS SSH Access
```bash
# Connect to production server
ssh root@103.118.183.166
# Password: stored separately (not in this file)

# Deploy backend change:
cd /opt/cruzenweb && docker compose build backend && docker compose up -d backend

# Deploy frontend change:
cd /opt/cruzenweb && docker compose build frontend && docker compose up -d frontend
```

---

## 11. Other Tools (install as needed)

| Tool | Install | Used for |
|------|---------|----------|
| `gh` (GitHub CLI) | `brew install gh` | PRs, issues from terminal |
| `mongosh` | included above | MongoDB shell |
| `railway` | included in npm globals | Railway deploys |
| Postman | https://www.postman.com/downloads/ | API testing |
| TablePlus | https://tableplus.com/ | MongoDB/Postgres GUI |

---

## Quick Version Reference (Windows baseline)
| Tool | Windows version |
|------|----------------|
| Node.js | v24.11.1 |
| npm | 11.14.1 |
| Python | 3.13.14 |
| Docker | 29.1.3 |
| Git | 2.52.0 |
| VS Code | 1.125.1 |
| Java | 21 LTS |
| PHP | 8.2.12 |
| Composer | 2.8.12 |
| Rust | 1.94.0 |

---

## Apple Silicon Notes
- All brew packages install as ARM64 natively — no Rosetta needed for any of these
- Docker Desktop on M1 runs Linux containers via Apple's Virtualization Framework
- `psycopg2-binary` works natively; if you install from source use `brew install postgresql` first
- OpenCV: use `opencv-python-headless` (no display dependency issues)
