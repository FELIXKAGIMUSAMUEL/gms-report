# GMS Report Application - Setup Instructions

## Project Overview
GMS Report is a comprehensive school management system for tracking academic performance, enrollments, P.7 prep exams, scorecards, and financial data across multiple schools.

## Prerequisites
- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- **Git**
- A code editor (VS Code recommended)

## Initial Setup on New Machine

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd gms-report
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/gms_report?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl"

# Generate secret with: openssl rand -base64 32
```

### 4. Database Setup

#### Option A: Create Fresh Database
```bash
# Create PostgreSQL database
createdb gms_report

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# (Optional) Seed initial data
npx prisma db seed
```

#### Option B: Restore from Backup
If you have a database backup file (`database_backup_YYYYMMDD.sql`):

```bash
# Create database
createdb gms_report

# Restore from backup
psql -U your_username -d gms_report < database_backup_20260205.sql

# Generate Prisma Client
npx prisma generate
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Default Login Credentials
After initial setup, you'll need to create admin users. You can:
1. Use Prisma Studio: `npx prisma studio`
2. Create users directly in the database
3. Run the seed script if available

## Database Schema

### Key Models
- **Report** - Weekly school reports with various metrics
- **Scorecard** - Academic, finance, quality, technology, theology scores
- **P7PrepResult** - Detailed prep exam results (Prep 1-9)
- **Enrollment** - Student enrollment by school, class, term, year
- **TheologyEnrollment** - Theology program enrollments
- **OtherIncome** - Income sources and amounts
- **Issue** - Red/Yellow flag issues
- **UpcomingEvent** - Events calendar
- **Project** - Ongoing projects tracking
- **Todo** - Task management

## Database Backup and Restore

### Create Backup
```bash
# Using pg_dump
pg_dump -U username -d gms_report > backup_$(date +%Y%m%d).sql

# Or using Prisma Studio
npx prisma studio
# Export data manually
```

### Restore Backup
```bash
psql -U username -d gms_report < backup_YYYYMMDD.sql
npx prisma generate
```

## Project Structure
```
gms-report/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── dashboard/        # Main dashboard
│   │   ├── p7-prep-entry/    # P.7 exam entry
│   │   ├── p7-prep-analysis/ # P.7 exam analysis
│   │   ├── enrollment-entry/ # Enrollment data entry
│   │   ├── enrollment-analysis/ # Enrollment analysis
│   │   ├── scorecard-entry/  # Scorecard entry
│   │   ├── income-entry/     # Income data entry
│   │   ├── theology-*/       # Theology-related pages
│   │   └── ...
│   ├── components/           # Reusable components
│   ├── lib/                  # Utilities and Prisma client
│   └── types/                # TypeScript types
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Database migrations
│   └── seed.ts              # Seed data
├── public/                   # Static assets
└── package.json

```

## Key Features

### 1. P.7 Prep Exam Tracking
- Entry page: `/p7-prep-entry`
- Analysis page: `/p7-prep-analysis`
- Import from Excel
- Track Preps 1-9 across 3 terms
- Division tracking (Div I, II, III, IV)
- Automatic average score calculation
- DIV AVG % column showing Division I percentage

### 2. Enrollment Management
- Entry page: `/enrollment-entry`
- Analysis page: `/enrollment-analysis`
- Track by school, class, term, year
- YoY comparisons
- Theology enrollment tracking

### 3. Scorecard System
- Weekly scorecards per school
- 5 components: Academic, Finance, Quality, Technology, Theology
- Performance tracking and trends

### 4. Income Tracking
- Multiple income sources
- Amounts and percentages
- Monthly and yearly tracking
- Filtering by year and source

### 5. Dashboard
- KPI summary cards
- P.7 prep performance chart with year filtering
- Enrollment trends by school and class
- Other income chart with amount/percentage toggle
- Red/Yellow issues tracking
- Upcoming events
- Active projects

## Development Workflow

### Running Migrations
```bash
# Create new migration
npx prisma migrate dev --name description_of_changes

# Apply migrations
npx prisma migrate deploy

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset
```

### Database Management
```bash
# Open Prisma Studio (GUI for database)
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

### Building for Production
```bash
npm run build
npm start
```

## Troubleshooting

### Database Connection Issues
1. Check PostgreSQL is running: `psql -U username -d gms_report`
2. Verify DATABASE_URL in `.env`
3. Ensure database exists: `psql -l`

### Migration Issues
```bash
# If migrations are out of sync
npx prisma migrate resolve --rolled-back "migration_name"
npx prisma migrate deploy
```

### Prisma Client Issues
```bash
# Regenerate Prisma Client
npx prisma generate

# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

## Important Notes

### Year Dropdowns
All year dropdowns dynamically generate from 2023 to the current year. The system will automatically include new years as time progresses.

### P.7 Prep Data Structure
- **Term 1**: Preps 1-3
- **Term 2**: Preps 4-6
- **Term 3**: Preps 7-9

### Data Integrity
- Always backup database before major changes
- Use transactions for bulk operations
- Validate data before deleting

## Utility Scripts

### Check P.7 Prep Data
```bash
node check-prep-data.js
```

### Fix/Delete Prep Data
```bash
node fix-2026-prep-data.js
```

## Contact & Support
For questions or issues during setup, refer to the project documentation or contact the development team.

---

**Last Updated:** February 9, 2026
**Version:** 1.0
