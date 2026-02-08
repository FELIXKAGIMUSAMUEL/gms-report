# 🚀 Quick Start - New Machine Setup

## Step 1: Clone Repository
```bash
git clone https://github.com/mayegamustafa/gms-report.git
cd gms-report
git checkout copilot/build-gms-report-application
```

## Step 2: Install Dependencies
```bash
npm install
```

## Step 3: Setup Environment
Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Edit `.env` and add your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/gms_report?schema=public"
NEXTAUTH_SECRET="your-generated-secret"  # Generate: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
```

## Step 4: Setup Database

### Option A: Restore from Backup (Recommended - includes all existing data)
```bash
# Create database
createdb gms_report

# Restore backup
psql -U your_username -d gms_report < database_backup_20260205.sql

# Generate Prisma Client
npx prisma generate
```

### Option B: Start Fresh
```bash
# Create database
createdb gms_report

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Optional: Seed initial data
npx prisma db seed
```

## Step 5: Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ✅ What's Included in This Push

### Features
- ✅ P.7 Prep tracking with DIV AVG % column
- ✅ Delete all prep results button
- ✅ Dashboard with enrollment and income filters
- ✅ Income entry with dual input (amount + percentage)
- ✅ Dynamic year dropdowns (2023 to current year)
- ✅ Excel import for prep exams
- ✅ Complete database with 2023-2025 data

### Database Backup
- **File**: `database_backup_20260205.sql` (135KB)
- **Contains**: 
  - P.7 Prep Results (286 records for 2023-2025)
  - Enrollment data
  - Scorecard data
  - Income sources and entries
  - School information
  - Users and authentication

### Utility Scripts
- `check-prep-data.js` - View all prep data in database
- `fix-2026-prep-data.js` - Delete or fix prep data issues
- `check-p7-data.js` - Check P.7 performance data

## 📋 Next Steps for Development

1. **PLE Results Tracking** (Next major feature)
   - Create PLE entry page
   - Add PLE to dashboard chart
   - PLE analysis and rankings

2. **Trustee Dashboard** (TODO in list)
   - Executive overview
   - KPI summary cards
   - Red/yellow/green indicators

## 🔧 Troubleshooting

### If database connection fails:
```bash
# Check PostgreSQL is running
psql -l

# Test connection
psql -U your_username -d gms_report
```

### If Prisma Client errors:
```bash
npx prisma generate
npm run dev
```

### If migrations fail:
```bash
npx prisma migrate reset  # WARNING: Deletes all data
# Then restore from backup
```

## 📖 Documentation
See **SETUP.md** for comprehensive instructions and project structure.

---
**Repository**: https://github.com/mayegamustafa/gms-report.git
**Branch**: copilot/build-gms-report-application
**Last Updated**: February 9, 2026
