# MattrMindr — AWS EC2 Deployment Guide

## Prerequisites

- AWS account with an EC2 instance (Ubuntu 22.04+ recommended, t3.small or larger)
- A domain name pointed at the EC2 instance's public IP (A record)
- PostgreSQL database (RDS or self-hosted)
- SendGrid account with API key
- SSH access to the instance

---

## 1. EC2 Instance Setup

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Update system
sudo apt update && sudo apt upgrade -y
```

## 2. Install System Dependencies

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# ffmpeg (required for audio transcription)
sudo apt install -y ffmpeg

# Verify
node -v   # should show v20.x
ffmpeg -version
```

## 3. Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

## 4. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
pm2 startup  # follow the output to enable auto-start on reboot
```

## 5. Deploy the Code

Clone the repository to your preferred location (e.g. your home directory):

```bash
cd ~
git clone YOUR_REPO_URL MattrMindr-Demo
cd ~/MattrMindr-Demo
```

## 6. Install Dependencies & Build

```bash
cd ~/MattrMindr-Demo
npm install
cd server && npm install && cd ..
cd lextrack && npm install && CI=false npm run build && cd ..
```

> **Note:** `CI=false` is required because `react-scripts build` treats warnings as errors when `CI=true`.

## 7. Configure Environment Variables

```bash
cp deploy/.env.example .env
nano .env
```

Fill in all values. See `.env.example` for the full list with descriptions.

> **Important:** If a value contains special characters (`&`, `!`, `$`, `#`, spaces), wrap it in **single quotes**:
> ```
> ONLYOFFICE_PASSWORD='Kizzie&Ben6615'
> DATABASE_URL='postgresql://user:p@ss&word@host:5432/db'
> ```

At minimum you need:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Random 64-char hex string (`openssl rand -hex 32`) |
| `APP_URL` | Your full domain URL, e.g. `https://demo.mattrmindr.com` |
| `SENDGRID_API_KEY` | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Verified sender email |
| `ADMIN_DEFAULT_PASSWORD` | Initial admin password |

The server loads `.env` automatically via dotenv — **no need to `source` the file**.

## 8. Create Log Directory

```bash
mkdir -p ~/MattrMindr-Demo/logs
```

## 9. Initialize the Database

Migrations run automatically at startup, but you can also run them manually:

```bash
cd ~/MattrMindr-Demo/server
node -e "require('dotenv').config({path:'../.env'})" && npm run migrate:up
```

Or run the legacy schema.js for a fresh database:

```bash
cd ~/MattrMindr-Demo
node server/schema.js
```

## 10. Configure Nginx

```bash
sudo cp ~/MattrMindr-Demo/deploy/nginx.conf /etc/nginx/sites-available/mattrmindr
sudo ln -s /etc/nginx/sites-available/mattrmindr /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Edit the config — replace YOUR_DOMAIN.com with your actual domain
sudo nano /etc/nginx/sites-available/mattrmindr

sudo nginx -t        # test config
sudo systemctl reload nginx
```

## 11. SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN.com
sudo systemctl reload nginx

# Auto-renewal is set up automatically; verify with:
sudo certbot renew --dry-run
```

## 12. Start the Application

### Option A: PM2 (Recommended)

```bash
cd ~/MattrMindr-Demo
pm2 start deploy/ecosystem.config.js
pm2 save
```

The ecosystem config automatically resolves paths relative to the project root, so it works from any install location.

Useful PM2 commands:
```bash
pm2 status
pm2 logs mattrmindr
pm2 restart mattrmindr
pm2 stop mattrmindr
```

### Option B: systemd

First update the paths in the service file to match your install location:

```bash
# Edit the service file if your install path differs from ~/MattrMindr-Demo
nano ~/MattrMindr-Demo/deploy/mattrmindr.service

sudo cp ~/MattrMindr-Demo/deploy/mattrmindr.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mattrmindr
sudo systemctl start mattrmindr
sudo systemctl status mattrmindr
```

### Option C: Direct (for testing)

```bash
cd ~/MattrMindr-Demo
NODE_ENV=production node server/index.js
```

## 13. Verify

Open `https://YOUR_DOMAIN.com` in a browser. You should see the MattrMindr login page.

Default admin login:
- Email: `admin@mattrmindr.com`
- Password: whatever you set as `ADMIN_DEFAULT_PASSWORD`

### Post-Deploy Smoke Tests

```bash
# API is responding
curl -s https://YOUR_DOMAIN.com/api/auth/me | head

# Login works
curl -s -X POST https://YOUR_DOMAIN.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@mattrmindr.com","password":"YOUR_ADMIN_PASSWORD"}' \
  -c /tmp/cookies.txt | head

# Authenticated API call
curl -s -b /tmp/cookies.txt https://YOUR_DOMAIN.com/api/cases | head
```

---

## 14. Configure Automated Backups

MattrMindr includes a backup script at `deploy/backup.sh` that manages pg_dump backups with a retention policy of 7 daily, 4 weekly, and 6 monthly backups.

### Setup

```bash
mkdir -p ~/MattrMindr-Demo/backups/{daily,weekly,monthly}

# Test the backup script manually
cd ~/MattrMindr-Demo
node -e "require('dotenv').config()" && bash deploy/backup.sh

# Add to cron (runs daily at 2:00 AM)
crontab -e
```

Add this line to the crontab:
```
0 2 * * * cd ~/MattrMindr-Demo && node -e "const d=require('dotenv');d.config();" && bash deploy/backup.sh >> logs/backup.log 2>&1
```

### Optional: S3 off-site backup

Set the `S3_BUCKET` environment variable in `.env` to enable automatic S3 sync:

```
S3_BUCKET=mattrmindr-backups
```

### Monitoring

```bash
ls -lh ~/MattrMindr-Demo/backups/daily/
tail -20 ~/MattrMindr-Demo/logs/backup.log
```

---

## Updating the Application

```bash
cd ~/MattrMindr-Demo
git pull origin main
npm install
cd server && npm install && cd ..
cd lextrack && npm install && CI=false npm run build && cd ..

# Restart
pm2 restart mattrmindr
# or: sudo systemctl restart mattrmindr
```

---

## Security Checklist

- [ ] SSH key-only auth (disable password login)
- [ ] EC2 security group: allow only ports 22, 80, 443
- [ ] Strong `SESSION_SECRET` (64+ random characters)
- [ ] Strong `ADMIN_DEFAULT_PASSWORD` (change after first login)
- [ ] PostgreSQL not publicly accessible (use private subnet or security group)
- [ ] Firewall configured (`sudo ufw allow 22,80,443/tcp && sudo ufw enable`)
- [ ] SSL certificate installed and auto-renewing
- [ ] Log rotation configured for `~/MattrMindr-Demo/logs/`
- [ ] `.env` file permissions restricted (`chmod 600 .env`)

---

## Troubleshooting

**App won't start:**
```bash
pm2 logs mattrmindr --lines 50
# Check for missing env vars or DB connection issues
```

**502 Bad Gateway from Nginx:**
```bash
# Ensure the app is running on port 5000
curl http://127.0.0.1:5000/api/auth/me
```

**DATABASE_URL not set:**
```bash
# The server loads .env automatically. Verify your .env file exists and has DATABASE_URL:
cat .env | grep DATABASE_URL

# If using special characters in the connection string, wrap in single quotes:
# DATABASE_URL='postgresql://user:p@ss&word@host:5432/mattrmindr'
```

**Database connection errors:**
```bash
# Test the connection string directly
psql "YOUR_DATABASE_URL" -c "SELECT 1"
```

**SSL issues:**
```bash
sudo certbot certificates
sudo nginx -t
```

**`npm start` vs production:**
`npm start` (root) runs both dev servers (Express + React dev server) — this is for development only. In production, build the React app first (`cd lextrack && CI=false npm run build`) and then run `node server/index.js` or use PM2. The Express server serves the built React files as static assets.
