# Database Information and Backup Instructions

## Current Database Details

**Database Name:** gms_report
**Database User:** mustafa
**Database Password:** mustafa123
**Host:** localhost
**Port:** 5432
**Database System:** PostgreSQL 15

## Backup Files Included

1. `database_backup_20260205.sql` - Full SQL dump (text format)
2. `database_backup_20260205.backup` - Binary backup format

## Database Schema Overview

### Main Tables:

1. **User** - User accounts (GM and Trustee roles)
2. **WeeklyReport** - Weekly KPI reports
3. **Enrollment** - Student enrollment tracking by school/class/term
4. **TheologyEnrollment** - Theology student tracking
5. **P7PrepResult** - P.7 exam results (9 preps per term)
6. **Event** - School events management
7. **Project** - Project tracking
8. **Issue** - Issues and action items
9. **Reaction** - Comments and reactions from trustees
10. **Comment** - Detailed comments on reports
11. **OrganizationalGoal** - Goals and targets tracking
12. **AlertConfig** - Alert configuration for thresholds
13. **AlertHistory** - Historical alerts
14. **IncomeSource** - Income source types
15. **OtherIncome** - Other income tracking
16. **Scorecard** - School scorecard data
17. **Notification** - System notifications
18. **Message** - Internal messaging system
19. **Department** - Department management
20. **TermConfig** - Academic term configuration

## How to Restore Database

### On Linux/Ubuntu:
```bash
# Method 1: Using SQL dump
PGPASSWORD=mustafa123 psql -h localhost -U mustafa -d gms_report < database_backup_20260205.sql

# Method 2: Using binary backup
PGPASSWORD=mustafa123 pg_restore -h localhost -U mustafa -d gms_report database_backup_20260205.backup
```

### On Mac:
```bash
# First install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Create database and user
psql postgres
CREATE USER mustafa WITH PASSWORD 'mustafa123';
CREATE DATABASE gms_report OWNER mustafa;
\q

# Restore from backup
PGPASSWORD=mustafa123 psql -h localhost -U mustafa -d gms_report < database_backup_20260205.sql
```

### On Windows:
```cmd
# Using Command Prompt or PowerShell
set PGPASSWORD=mustafa123
psql -h localhost -U mustafa -d gms_report < database_backup_20260205.sql
```

## Creating New Backups

### SQL Dump (recommended for version control):
```bash
PGPASSWORD=mustafa123 pg_dump -h localhost -U mustafa -d gms_report > backup_$(date +%Y%m%d).sql
```

### Binary Backup (faster for large databases):
```bash
PGPASSWORD=mustafa123 pg_dump -h localhost -U mustafa -Fc -d gms_report > backup_$(date +%Y%m%d).backup
```

### Schema Only (no data):
```bash
PGPASSWORD=mustafa123 pg_dump -h localhost -U mustafa -s -d gms_report > schema_only.sql
```

### Data Only (no schema):
```bash
PGPASSWORD=mustafa123 pg_dump -h localhost -U mustafa -a -d gms_report > data_only.sql
```

## Database Size and Statistics

Check current database size:
```sql
SELECT pg_size_pretty(pg_database_size('gms_report'));
```

Check table sizes:
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Important Notes

1. **Security**: Change database password in production
2. **Backups**: Set up automated daily backups
3. **Migrations**: Run `npx prisma migrate deploy` after restoring
4. **Users**: Default users are in the database - check with:
   ```sql
   SELECT id, email, name, role FROM "User";
   ```

## Sample Data Overview

The backup includes:
- ✅ User accounts (GM and Trustee)
- ✅ 2025 and 2026 enrollment data
- ✅ P.7 prep results (196 records)
- ✅ Weekly report templates
- ✅ School configurations
- ✅ Term configurations
- ✅ Sample events, projects, and issues

## Troubleshooting

### "Permission denied" error:
```bash
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE gms_report TO mustafa;
```

### "Database does not exist":
```bash
psql postgres
CREATE DATABASE gms_report OWNER mustafa;
\q
```

### "Role does not exist":
```bash
psql postgres
CREATE USER mustafa WITH PASSWORD 'mustafa123';
\q
```

### Import errors:
```bash
# Drop and recreate database
psql postgres
DROP DATABASE IF EXISTS gms_report;
CREATE DATABASE gms_report OWNER mustafa;
\q

# Then restore
PGPASSWORD=mustafa123 psql -h localhost -U mustafa -d gms_report < database_backup_20260205.sql
```

## Accessing Database

### Command Line:
```bash
PGPASSWORD=mustafa123 psql -h localhost -U mustafa -d gms_report
```

### GUI Tools:
- **pgAdmin** (Windows/Mac/Linux): https://www.pgadmin.org/
- **DBeaver** (Universal): https://dbeaver.io/
- **Postico** (Mac): https://eggerapps.at/postico/
- **TablePlus** (Mac/Windows): https://tableplus.com/

## Database Connection String

For application configuration (`.env` file):
```
DATABASE_URL="postgresql://mustafa:mustafa123@localhost:5432/gms_report"
```

For production (example with SSL):
```
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
```
