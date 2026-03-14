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

## 2. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # should show v20.x
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

## 5. Create Application User

```bash
sudo useradd -r -m -s /bin/bash mattrmindr
sudo mkdir -p /opt/mattrmindr /var/log/mattrmindr
sudo chown mattrmindr:mattrmindr /opt/mattrmindr /var/log/mattrmindr
```

## 6. Deploy the Code

```bash
# As ubuntu user, clone/copy your repo
sudo -u mattrmindr bash -c 'cd /opt/mattrmindr && git clone YOUR_REPO_URL .'

# Or upload via scp:
# scp -r -i your-key.pem ./mattrmindr ubuntu@YOUR_EC2_IP:/tmp/mattrmindr
# sudo cp -r /tmp/mattrmindr/* /opt/mattrmindr/
# sudo chown -R mattrmindr:mattrmindr /opt/mattrmindr
```

## 7. Install Dependencies & Build

```bash
sudo -u mattrmindr bash -c '
  cd /opt/mattrmindr
  npm install
  cd server && npm install && cd ..
  cd lextrack && npm install && CI=false npm run build && cd ..
'
```

## 8. Configure Environment Variables

```bash
sudo -u mattrmindr cp /opt/mattrmindr/deploy/.env.example /opt/mattrmindr/.env
sudo -u mattrmindr nano /opt/mattrmindr/.env
```

Fill in all values. At minimum you need:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Random 64-char hex string (`openssl rand -hex 32`) |
| `APP_URL` | Your full domain URL, e.g. `https://mattrmindr.com` |
| `SENDGRID_API_KEY` | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Verified sender email |
| `ADMIN_DEFAULT_PASSWORD` | Initial admin password |

## 9. Initialize the Database

The app auto-creates tables on first startup via `server/schema.js`. Just start the app and it will set up the schema:

```bash
sudo -u mattrmindr bash -c 'cd /opt/mattrmindr && set -a && source .env && set +a && node server/schema.js'
```

## 10. Configure Nginx

```bash
sudo cp /opt/mattrmindr/deploy/nginx.conf /etc/nginx/sites-available/mattrmindr
sudo ln -s /etc/nginx/sites-available/mattrmindr /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Edit the config to replace YOUR_DOMAIN.com with your actual domain
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
sudo -u mattrmindr bash -c '
  cd /opt/mattrmindr
  pm2 start deploy/ecosystem.config.js
  pm2 save
'
```

Useful PM2 commands:
```bash
sudo -u mattrmindr pm2 status
sudo -u mattrmindr pm2 logs mattrmindr
sudo -u mattrmindr pm2 restart mattrmindr
sudo -u mattrmindr pm2 stop mattrmindr
```

### Option B: systemd

```bash
sudo cp /opt/mattrmindr/deploy/mattrmindr.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mattrmindr
sudo systemctl start mattrmindr
sudo systemctl status mattrmindr
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

## Updating the Application

```bash
sudo -u mattrmindr bash -c '
  cd /opt/mattrmindr
  git pull origin main
  npm install
  cd server && npm install && cd ..
  cd lextrack && npm install && CI=false npm run build && cd ..
'

# Restart
sudo -u mattrmindr pm2 restart mattrmindr
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
- [ ] Log rotation configured for `/var/log/mattrmindr/`

---

## Troubleshooting

**App won't start:**
```bash
sudo -u mattrmindr pm2 logs mattrmindr --lines 50
# Check for missing env vars or DB connection issues
```

**502 Bad Gateway from Nginx:**
```bash
# Ensure the app is running on port 5000
curl http://127.0.0.1:5000/api/auth/me
```

**Database connection errors:**
```bash
# Test the connection string
sudo -u mattrmindr bash -c 'source /opt/mattrmindr/.env && psql "$DATABASE_URL" -c "SELECT 1"'
```

**SSL issues:**
```bash
sudo certbot certificates
sudo nginx -t
```
