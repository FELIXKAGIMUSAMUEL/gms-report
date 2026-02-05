# SAK GM Report System - Mac Setup Guide

## Prerequisites for Mac

### 1. Install Homebrew (if not already installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js and npm
```bash
brew install node
node --version  # Should be v18 or higher
npm --version
```

### 3. Install PostgreSQL
```bash
brew install postgresql@15
brew services start postgresql@15

# Add to PATH (add to ~/.zshrc or ~/.bash_profile)
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 4. Install Git (if not already installed)
```bash
brew install git
```

## Setup Instructions

### Step 1: Clone Repository
```bash
cd ~/Projects  # or your preferred directory
git clone https://github.com/mayegamustafa/gms-report.git
cd gms-report/gms-report
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Setup PostgreSQL Database

#### Create Database and User
```bash
# Start PostgreSQL service
brew services start postgresql@15

# Connect to PostgreSQL
psql postgres

# In PostgreSQL shell:
CREATE USER mustafa WITH PASSWORD 'mustafa123';
CREATE DATABASE gms_report OWNER mustafa;
GRANT ALL PRIVILEGES ON DATABASE gms_report TO mustafa;
\q
```

#### Restore Database from Backup
```bash
# Navigate to project directory
cd ~/Projects/gms-report/gms-report

# Restore the database
PGPASSWORD=mustafa123 psql -h localhost -U mustafa -d gms_report < database_backup_20260205.sql
```

### Step 4: Environment Variables

Create `.env` file in the project root:
```bash
# Database
DATABASE_URL="postgresql://mustafa:mustafa123@localhost:5432/gms_report"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-new-one"

# Generate new secret with:
# openssl rand -base64 32
```

### Step 5: Run Database Migrations
```bash
npx prisma generate
npx prisma migrate deploy
```

### Step 6: Start Development Server
```bash
npm run dev
```

The application should now be running at: http://localhost:3000

## Default Login Credentials

Ask the admin for credentials or check the database:
```sql
SELECT email, role FROM "User";
```

## Troubleshooting on Mac

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
brew services list

# Restart PostgreSQL
brew services restart postgresql@15

# Check PostgreSQL logs
tail -f /opt/homebrew/var/log/postgresql@15.log
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Node Modules Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Prisma Issues
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

## Mac-Specific Notes

1. **Use Command (⌘) instead of Ctrl** for most shortcuts
2. **Terminal App**: Use iTerm2 or native Terminal
3. **VS Code**: Install from https://code.visualstudio.com/
4. **PostgreSQL GUI**: Use Postico or pgAdmin for Mac

## Regular Backups

Create a backup script `backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="$HOME/Backups/gms-report"
mkdir -p $BACKUP_DIR
PGPASSWORD=mustafa123 pg_dump -h localhost -U mustafa -d gms_report > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
echo "Backup created: $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
```

Make executable and run:
```bash
chmod +x backup.sh
./backup.sh
```

## Git Workflow

```bash
# Get latest changes
git pull origin copilot/build-gms-report-application

# Make changes and commit
git add -A
git commit -m "Your message"
git push origin copilot/build-gms-report-application
```

## Production Deployment (Future)

When ready for production:
1. Update `NEXTAUTH_URL` in `.env`
2. Use a strong `NEXTAUTH_SECRET`
3. Update database credentials
4. Configure SSL for PostgreSQL
5. Set up proper hosting (Vercel, AWS, or Azure)

## Support

Repository: https://github.com/mayegamustafa/gms-report
Branch: copilot/build-gms-report-application

## System Requirements - Mac

- **OS**: macOS 11 (Big Sur) or later
- **RAM**: 8GB minimum (16GB recommended)
- **Disk**: 2GB free space
- **Processor**: Intel or Apple Silicon (M1/M2/M3)
