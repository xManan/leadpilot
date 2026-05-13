# LeadPilot — Deployment Handoff

## Prerequisites
- Vultr VPS ($5/month, Mumbai region, Ubuntu 22.04)
- Domain or public IP pointing to the server
- Meta Developer account with WhatsApp Cloud API access

---

## Step 1 — Server setup

```bash
# SSH into your VPS
ssh root@YOUR_SERVER_IP

# Update packages
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Nginx
apt install -y nginx
```

---

## Step 2 — Deploy the app

```bash
# Clone or copy your project to the server
git clone https://github.com/YOUR_USERNAME/leadpilot.git /var/www/leadpilot
cd /var/www/leadpilot

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
nano .env
# Fill in all values — see .env.example for keys
```

---

## Step 3 — Start with PM2

```bash
cd /var/www/leadpilot
pm2 start server.js --name leadpilot
pm2 save
pm2 startup   # follow the command it prints to auto-start on reboot
```

---

## Step 4 — Nginx reverse proxy

```bash
nano /etc/nginx/sites-available/leadpilot
```

Paste this config (replace `yourdomain.com` with your domain or IP):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/leadpilot /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## Step 5 — HTTPS (recommended)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

---

## Step 6 — Register Meta webhook

1. Go to **Meta Developer Console → Your App → WhatsApp → Configuration**
2. Set **Webhook URL**: `https://yourdomain.com/webhook`
3. Set **Verify Token**: `leadpilot123` (or whatever you set in `.env`)
4. Subscribe to the **messages** field
5. Click **Verify and Save**

---

## Step 7 — Update landing page WhatsApp link

In `public/index.html`, replace both instances of `YOURNUMBERHERE` with your
WhatsApp Business phone number in international format, e.g. `919876543210`.

```html
href="https://wa.me/919876543210?text=..."
```

---

## Useful PM2 commands

```bash
pm2 logs leadpilot       # live logs
pm2 restart leadpilot    # restart after code changes
pm2 status               # check running processes
```

---

## Environment variables reference

| Key | Description |
|-----|-------------|
| `PHONE_NUMBER_ID` | From Meta API → WhatsApp → Getting Started |
| `ACCESS_TOKEN` | Permanent system user token from Meta Business Suite |
| `BROKER_WHATSAPP` | Broker's number in full format e.g. `919876543210` |
| `VERIFY_TOKEN` | Any secret string — must match what you enter in Meta console |
| `PORT` | Default `3000` — leave as is unless there's a conflict |

---

## Testing the bot

Send **any message** to your WhatsApp Business number.
The bot will walk through 5 questions and then:
- Save the lead to `leads.json`
- Send the broker a formatted summary on WhatsApp
