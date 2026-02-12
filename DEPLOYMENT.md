# Deployment Guide - GMS Report System

## Copyright
© 2026 Mustafa - Sir Apollo Kaggwa Schools. All rights reserved.

## Overview
This guide covers deploying the GMS Report System to production.

## Pre-Deployment Checklist

### 1. Database Backup
Always backup the database before deployment:
```bash
pg_dump -U username -d gms_report -F p -f database_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Environment Variables
Copy `.env.example` to `.env.production` and configure:

- `DATABASE_URL`: PostgreSQL connection string with pooling
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your production domain (e.g., https://report.sirapollokaggwa.com)
- `VAPID_PUBLIC_KEY` & `VAPID_PRIVATE_KEY`: Web push notification keys
- `VAPID_SUBJECT`: Admin contact email

### 3. Database Migration
Run Prisma migrations on production database:
```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Build Application
```bash
npm run build
```

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables:**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all variables from `.env.production`

5. **Database:** Use Vercel Postgres or external PostgreSQL with connection pooling

### Option 2: Docker Deployment

1. **Build Docker Image:**
   ```bash
   docker build -t gms-report:latest .
   ```

2. **Run Container:**
   ```bash
   docker run -d \
     -p 3000:3000 \
     --env-file .env.production \
     --name gms-report \
     gms-report:latest
   ```

### Option 3: Traditional VPS (Ubuntu/Linux)

1. **Install Dependencies:**
   ```bash
   sudo apt update
   sudo apt install nodejs npm postgresql nginx
   ```

2. **Clone Repository:**
   ```bash
   git clone https://github.com/yourusername/gms-report.git
   cd gms-report
   npm install
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env.production
   nano .env.production  # Edit with production values
   ```

4. **Build Application:**
   ```bash
   npm run build
   ```

5. **Run with PM2:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "gms-report" -- start
   pm2 save
   pm2 startup  # Follow instructions to enable startup on boot
   ```

6. **Configure Nginx:**
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

7. **SSL Certificate:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

## Post-Deployment

### 1. Verify Deployment
- Test login functionality
- Verify database connections
- Check all dashboard pages load correctly
- Test report generation and printing
- Verify CSV exports work
- Test goal creation and management

### 2. Monitor Application
- Check application logs: `pm2 logs gms-report` (if using PM2)
- Monitor database connections
- Check error rates
- Monitor performance metrics

### 3. Database Maintenance
Schedule regular backups:
```bash
# Add to crontab (daily backup at 2 AM)
0 2 * * * pg_dump -U username -d gms_report -F p -f /backups/db_$(date +\%Y\%m\%d).sql
```

## Security Recommendations

1. **Database:**
   - Use strong passwords
   - Enable connection pooling
   - Restrict database access to application server only
   - Regular security updates

2. **Application:**
   - Keep dependencies updated: `npm audit`
   - Use HTTPS in production
   - Set secure cookies (secure: true in NextAuth)
   - Implement rate limiting

3. **Environment Variables:**
   - Never commit `.env` files
   - Use secret management services for sensitive data
   - Rotate secrets periodically

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check PostgreSQL is running and accessible
- Verify connection pooling settings
- Check firewall rules

### Build Failures
- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version compatibility (v18+ recommended)

### Performance Issues
- Enable caching in Vercel/CDN
- Optimize database queries
- Use connection pooling
- Consider Redis for session storage

## Rollback Procedure

If deployment fails:

1. **Restore Database:**
   ```bash
   psql -U username -d gms_report < database_backup_YYYYMMDD.sql
   ```

2. **Revert Code:**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Redeploy Previous Version:**
   ```bash
   vercel --prod  # or your deployment method
   ```

## Support

For deployment assistance, contact the development team.

---
**Copyright © 2026 Mustafa - Sir Apollo Kaggwa Schools**
