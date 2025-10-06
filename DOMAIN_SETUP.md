# 🌐 Domain Setup Guide

## Quick Domain Configuration

### Step 1: Point Your Domain to VPS

**In your domain registrar dashboard (GoDaddy, Namecheap, Cloudflare, etc.):**

1. **Login to your domain registrar**
2. **Go to DNS Management** for your domain
3. **Add/Edit A Records:**

```
Type: A
Name: @              (for root domain like yourdomain.com)
Value: YOUR_VPS_IP   (e.g., 192.168.1.100)
TTL: 3600

Type: A  
Name: www            (for www.yourdomain.com)
Value: YOUR_VPS_IP   (same IP as above)
TTL: 3600
```

### Step 2: Wait for DNS Propagation
- **Time:** 5-30 minutes (sometimes up to 24 hours)
- **Test:** Use `nslookup yourdomain.com` or online DNS checkers

### Step 3: Run the Auto-Deployment Script

**On your VPS, run:**
```bash
# Download and run the deployment script
curl -sSL https://raw.githubusercontent.com/sahidx/sa/master/vps-deploy.sh | bash
```

**Or manually:**
```bash
# If you already cloned the repo
cd /opt/sa
./vps-deploy.sh
```

### Step 4: Follow the Script Prompts

The script will ask for:
- ✅ Your domain name
- ✅ Database connection details
- ✅ Email for SSL certificate

### That's it! 🎉

Your SA Student Management System will be live at:
- **https://yourdomain.com**
- **https://www.yourdomain.com**

---

## Common Domain Registrars Setup

### GoDaddy
1. Login → My Products → DNS
2. Add A records as shown above

### Namecheap  
1. Domain List → Manage → Advanced DNS
2. Add A records as shown above

### Cloudflare
1. Login → Select Domain → DNS
2. Add A records (set Proxy status to "DNS only" initially)

### Google Domains
1. My domains → Manage → DNS
2. Custom records → Add A records

---

## Troubleshooting

**Domain not resolving?**
```bash
# Check DNS propagation
nslookup yourdomain.com
dig yourdomain.com

# Test with different DNS servers
nslookup yourdomain.com 8.8.8.8
nslookup yourdomain.com 1.1.1.1
```

**SSL issues?**
```bash
# Manual SSL setup if auto-setup failed
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Need help?** Check the full guide in `VPS_DEPLOYMENT_GUIDE.md`