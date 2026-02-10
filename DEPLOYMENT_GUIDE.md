# 🚀 Deployment Guide - GMS Report Portal

## Pre-Deployment Checklist

### ✅ Code Quality
- [x] All TypeScript errors resolved
- [x] All linting errors fixed
- [x] All components tested locally
- [x] Database migrations applied
- [x] Environment variables configured

### ✅ Features Completed
- [x] Income Entry with duplicate prevention & bulk delete
- [x] Dashboard with enhanced charts (term filters, percentages, term-based bars)
- [x] Comments Report with improved visibility
- [x] Analytics page updated
- [x] **NEW**: Records Archive (Past Reports) with multi-category viewing & export
- [x] **ALL** Trustee Hub pages functional:
  - Executive Dashboard
  - School Performance Scorecard
  - Financial Overview
  - Board Meeting Reports
  - Comparative Analysis
  - Goals & Targets
  - Issues Dashboard
  - Export Center

---

## 📋 Deployment Options

### Option 1: Vercel (Recommended for Next.js)

#### Prerequisites
- Vercel account
- GitHub repository linked
- PostgreSQL database (remote)

#### Steps

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Production ready: All features complete"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the project

3. **Configure Environment Variables in Vercel**
   
   Go to Project Settings → Environment Variables and add:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
   
   # NextAuth
   NEXTAUTH_SECRET="your-production-secret-here"  # Generate: openssl rand -base64 32
   NEXTAUTH_URL="https://your-domain.vercel.app"
   
   # Email (Optional)
   EMAIL_SERVER="smtp://username:password@smtp.example.com:587"
   EMAIL_FROM="noreply@yourdomain.com"
   
   # Push Notifications (Optional)
   NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
   VAPID_PRIVATE_KEY="your-vapid-private-key"
   ```

4. **Database Setup**
   
   Run migrations on production database:
   ```bash
   # Install Prisma CLI if not already
   npm install -g prisma
   
   # Generate Prisma Client
   npx prisma generate
   
   # Push schema to production DB
   npx prisma db push
   
   # Seed initial data (optional)
   npx prisma db seed
   ```

5. **Deploy**
   - Vercel will automatically build and deploy
   - Monitor build logs for any issues
   - Visit your deployment URL

6. **Post-Deployment**
   - Test all authentication flows
   - Verify database connections
   - Check all trustee pages load correctly
   - Test data exports (Archive page Export button)

---

### Option 2: VPS/Cloud Server (Ubuntu/Debian)

#### Prerequisites
- VPS with Ubuntu 20.04+ or Debian 11+
- Minimum 2GB RAM, 2 CPU cores
- PostgreSQL installed
- Node.js 18+ installed
- nginx or Apache for reverse proxy

#### Steps

1. **Setup Server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PostgreSQL
   sudo apt install -y postgresql postgresql-contrib
   
   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Setup Database**
   ```bash
   sudo -u postgres psql
   
   # In PostgreSQL shell:
   CREATE DATABASE gms_report;
   CREATE USER gms_user WITH PASSWORD 'your-secure-password';
   GRANT ALL PRIVILEGES ON DATABASE gms_report TO gms_user;
   \q
   ```

3. **Clone and Build**
   ```bash
   cd /var/www
   git clone https://github.com/your-username/gms-report.git
   cd gms-report
   
   # Install dependencies
   npm install --production
   
   # Copy environment file
   cp .env.example .env
   nano .env  # Edit with your production values
   
   # Setup database
   npx prisma generate
   npx prisma db push
   
   # Build Next.js app
   npm run build
   ```

4. **Configure Environment**
   
   Edit `/var/www/gms-report/.env`:
   ```env
   DATABASE_URL="postgresql://gms_user:your-secure-password@localhost:5432/gms_report"
   NEXTAUTH_SECRET="your-production-secret"
   NEXTAUTH_URL="https://yourdomain.com"
   ```

5. **Start with PM2**
   ```bash
   pm2 start npm --name "gms-report" -- start
   pm2 save
   pm2 startup
   ```

6. **Setup Nginx Reverse Proxy**
   ```bash
   sudo nano /etc/nginx/sites-available/gms-report
   ```
   
   Add:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
   
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
   
   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/gms-report /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

7. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

---

### Option 3: Docker Deployment

#### Prerequisites
- Docker and Docker Compose installed
- PostgreSQL database (can be in same Docker network)

#### Steps

1. **Create Dockerfile** (Already exists if needed)
   ```bash
   # Check if Dockerfile exists, if not create:
   touch Dockerfile
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=postgresql://postgres:password@db:5432/gms_report
         - NEXTAUTH_SECRET=your-secret-here
         - NEXTAUTH_URL=https://yourdomain.com
       depends_on:
         - db
       restart: unless-stopped
   
     db:
       image: postgres:15-alpine
       environment:
         - POSTGRES_DB=gms_report
         - POSTGRES_USER=postgres
         - POSTGRES_PASSWORD=password
       volumes:
         - postgres_data:/var/lib/postgresql/data
       restart: unless-stopped
   
   volumes:
     postgres_data:
   ```

3. **Deploy**
   ```bash
   docker-compose up -d
   
   # Run migrations
   docker-compose exec app npx prisma db push
   
   # Check logs
   docker-compose logs -f
   ```

---

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Use strong NEXTAUTH_SECRET (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS if needed
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Review user permissions

---

## 📊 Post-Deployment Monitoring

### Health Checks
```bash
# Check if app is running
curl https://yourdomain.com/api/health

# Check database connection
npm run db:health

# View logs
pm2 logs gms-report  # For PM2
docker-compose logs  # For Docker
```

### Performance Monitoring
- Setup error tracking (Sentry, LogRocket)
- Monitor database performance
- Track API response times
- Monitor memory usage

---

## 🔄 Updating the Application

### Vercel
```bash
git add .
git commit -m "Update: Description of changes"
git push origin main
# Vercel auto-deploys
```

### VPS
```bash
cd /var/www/gms-report
git pull origin main
npm install
npm run build
pm2 restart gms-report
```

### Docker
```bash
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d
```

---

## 🆘 Troubleshooting

### Build Fails
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Database Connection Issues
```bash
# Test connection
npx prisma db pull

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset
```

### Port Already in Use
```bash
# Find process on port 3000
lsof -i :3000
# or
netstat -nlp | grep :3000

# Kill process
kill -9 <PID>
```

---

## 📝 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Yes | Secret for NextAuth.js | Generated with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Public URL of your app | `https://yourdomain.com` |
| `EMAIL_SERVER` | No | SMTP server for emails | `smtp://user:pass@smtp.gmail.com:587` |
| `EMAIL_FROM` | No | From email address | `noreply@yourdomain.com` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | Push notification public key | Generated VAPID key |
| `VAPID_PRIVATE_KEY` | No | Push notification private key | Generated VAPID key |

---

## ✅ Final Checklist

- [ ] All environment variables set
- [ ] Database migrated and seeded
- [ ] Application builds successfully
- [ ] SSL certificate configured
- [ ] DNS records updated
- [ ] First admin user created
- [ ] Backup strategy in place
- [ ] Monitoring tools configured
- [ ] Documentation updated
- [ ] Team trained on new features

---

## 📞 Support

For deployment issues:
1. Check logs first (`pm2 logs` or `docker-compose logs`)
2. Verify environment variables
3. Test database connectivity
4. Review nginx/proxy configuration

---

## 🎉 New Features Deployed

### GM Portal
- ✅ Income Entry with duplicate prevention
- ✅ Bulk delete for periods
- ✅ Dashboard term filtering
- ✅ Percentage-based charts by default
- ✅ Term-based bar charts (2026 T1, T2, T3, etc.)
- ✅ Comments Report enhanced visibility

### Records Archive (Past Reports)
- ✅ Multi-category viewing (Reports, Scorecards, Issues, Projects, Events, Comments)
- ✅ Advanced filtering (Year, Term, Status, Search)
- ✅ Excel export for all data
- ✅ Summary statistics
- ✅ Responsive tables

### Trustee Hub (Complete)
- ✅ Executive Dashboard - KPI overview with trends
- ✅ School Performance Scorecard - Rankings and metrics
- ✅ Financial Overview - Revenue and expenditure charts
- ✅ Board Meeting Reports - Professional report generator
- ✅ Comparative Analysis - School-to-school comparison
- ✅ Goals & Targets - Track institutional goals
- ✅ Issues Dashboard - Monitor critical issues
- ✅ Export Center - Download data in multiple formats

---

**Last Updated:** February 10, 2026
**Version:** 2.0.0 - Production Ready
