# GMS Report - Testing Guide

This guide will walk you through testing the GMS Report application to ensure it works correctly.

## Prerequisites for Testing

Before starting, ensure you have:
- PostgreSQL installed and running
- Node.js 18.x or later installed
- The repository cloned to your local machine

## Step-by-Step Testing Instructions

### 1. Environment Setup

First, set up your environment variables:

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and update with your PostgreSQL credentials
# Example:
# DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/gms_report?schema=public"
# NEXTAUTH_SECRET="generate-using-openssl-rand-base64-32"
# NEXTAUTH_URL="http://localhost:3000"
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### 2. Install Dependencies

```bash
npm install
```

Expected output: Dependencies installed successfully without critical errors.

### 3. Database Setup

```bash
# Create the database (if it doesn't exist)
createdb gms_report

# Or using psql:
psql -U postgres
CREATE DATABASE gms_report;
\q

# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Seed the database with test data
npm run db:seed
```

Expected output:
- Prisma Client generated
- Database migrations applied
- Message: "Database seeded successfully!"
- Message: "Default user: admin@gms.com / admin123"

### 4. Verify Build

```bash
npm run build
```

Expected output:
- ✓ Compiled successfully
- ✓ Linting and checking validity of types
- Build completed with route information displayed

### 5. Start Development Server

```bash
npm run dev
```

Expected output:
- "ready - started server on 0.0.0.0:3000"
- "compiled client and server successfully"

Open your browser to: http://localhost:3000

## Manual Testing Checklist

### Test 1: Authentication Flow

1. **Navigate to Home Page**
   - URL: http://localhost:3000
   - ✅ Should redirect to login page

2. **Test Login Page**
   - URL: http://localhost:3000/login
   - ✅ Login form should be visible
   - ✅ Try invalid credentials:
     - Email: test@test.com
     - Password: wrongpassword
     - Expected: Error message "Invalid email or password"
   - ✅ Try valid credentials:
     - Email: admin@gms.com
     - Password: admin123
     - Expected: Redirect to dashboard

3. **Test Protected Routes**
   - Try accessing http://localhost:3000/dashboard without login
   - ✅ Should redirect to login page

### Test 2: Dashboard Functionality

After logging in, you should see:

1. **Header**
   - ✅ Title: "GMS Report Dashboard"
   - ✅ Welcome message with user email
   - ✅ "Update Report" button
   - ✅ "Sign Out" button

2. **KPI Cards** (6 cards total)
   - ✅ Total Baptisms (with trend indicator)
   - ✅ Profession of Faith (with trend indicator)
   - ✅ Current Membership (with trend indicator)
   - ✅ SS Attendance (with trend indicator)
   - ✅ Quarterly Tithes (with dollar amount)
   - ✅ Combined Offerings (with dollar amount)
   
   Each card should show:
   - Icon emoji
   - Value
   - Trend percentage (↑ or ↓) vs previous quarter

3. **Trends Chart**
   - ✅ Line chart with title "Trends Over Time"
   - ✅ Shows last 12 quarters of data
   - ✅ Multiple colored lines:
     - Blue: Baptisms
     - Green: Profession of Faith
     - Orange: Membership
   - ✅ X-axis shows quarters (e.g., Q1 2024, Q2 2024)
   - ✅ Y-axis shows values
   - ✅ Hover over lines shows tooltips with exact values

4. **Quarterly Table**
   - ✅ Shows last 8 quarterly reports
   - ✅ Columns: Period, Baptisms, Profession of Faith, Tithes, Offerings, Membership, SS Attendance
   - ✅ Data is sorted by most recent first
   - ✅ Dollar amounts formatted with 2 decimal places
   - ✅ Rows highlight on hover

### Test 3: Update Report Functionality

1. **Navigate to Update Report**
   - Click "Update Report" button from dashboard
   - URL: http://localhost:3000/update-report

2. **Test Form Fields**
   - ✅ Year dropdown (shows years 2020-2026)
   - ✅ Quarter dropdown (Q1-Q4 with month labels)
   - ✅ Baptisms input (numeric)
   - ✅ Profession of Faith input (numeric)
   - ✅ Tithes input (accepts decimals)
   - ✅ Combined Offerings input (accepts decimals)
   - ✅ Total Membership input (numeric)
   - ✅ Sabbath School Attendance input (numeric)

3. **Test Auto-Load Existing Data**
   - Select Year: 2024, Quarter: Q1
   - ✅ Form should populate with existing data
   - Select Year: 2026, Quarter: Q4
   - ✅ Form should populate with existing data

4. **Test Creating New Report**
   - Select Year: 2027, Quarter: Q1
   - Enter test data:
     - Baptisms: 25
     - Profession of Faith: 18
     - Tithes: 8500.50
     - Combined Offerings: 5200.75
     - Membership: 620
     - SS Attendance: 415
   - Click "Save Report"
   - ✅ Success message: "Report updated successfully! Redirecting..."
   - ✅ Redirects to dashboard after 1.5 seconds
   - ✅ New data appears in dashboard

5. **Test Updating Existing Report**
   - Go back to Update Report
   - Select Year: 2024, Quarter: Q1
   - Modify some values (e.g., increase Baptisms by 5)
   - Click "Save Report"
   - ✅ Success message appears
   - ✅ Dashboard reflects updated values

6. **Test Form Validation**
   - Try entering negative numbers
   - ✅ Should not allow negative values (min="0")
   - Try submitting empty form
   - ✅ Browser validation should prevent submission

### Test 4: Navigation

1. **Test "Back to Dashboard" Button**
   - From Update Report page, click "Back to Dashboard"
   - ✅ Should navigate to dashboard

2. **Test "Update Report" Button**
   - From Dashboard, click "Update Report"
   - ✅ Should navigate to update-report page

3. **Test "Sign Out" Button**
   - From Dashboard, click "Sign Out"
   - ✅ Should redirect to login page
   - ✅ Trying to access /dashboard should redirect to login

### Test 5: API Endpoints (Optional - Using Browser DevTools or Postman)

1. **Test GET /api/reports**
   - After logging in, open browser DevTools → Network tab
   - Refresh dashboard
   - ✅ Should see successful API call to /api/reports
   - ✅ Returns array of report objects

2. **Test POST /api/reports**
   - Update a report from the UI
   - Check Network tab
   - ✅ Should see POST request to /api/reports
   - ✅ Returns updated report object

3. **Test GET /api/historical**
   - Dashboard loads this automatically
   - ✅ Should see successful API call to /api/historical?groupBy=quarter
   - ✅ Returns array with label field (e.g., "Q1 2024")

### Test 6: Responsive Design

1. **Test Mobile View**
   - Open browser DevTools
   - Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
   - Select mobile device (e.g., iPhone 12)
   - ✅ Login page should be mobile-friendly
   - ✅ Dashboard cards should stack vertically
   - ✅ Charts should be responsive
   - ✅ Table should be scrollable horizontally

2. **Test Tablet View**
   - Select tablet device (e.g., iPad)
   - ✅ Dashboard should adapt to medium screen size
   - ✅ Cards should display in 2 columns

### Test 7: Data Integrity

1. **Verify Historical Data**
   - Check that dashboard shows data from 2020-2026
   - ✅ Trends chart should show historical progression
   - ✅ Table should show recent quarters

2. **Verify Calculations**
   - Compare trend percentages with actual data
   - ✅ Positive trends should show ↑ in green
   - ✅ Negative trends should show ↓ in red
   - ✅ Percentages should be accurate

## Testing with Prisma Studio (Database GUI)

You can visually inspect the database:

```bash
npx prisma studio
```

This opens a web interface at http://localhost:5555 where you can:
- ✅ View all User records
- ✅ View all Report records
- ✅ Verify data is being saved correctly
- ✅ Manually edit records if needed

## Common Issues and Solutions

### Issue 1: Database Connection Error
**Error**: "Can't reach database server"
**Solution**: 
- Verify PostgreSQL is running: `sudo service postgresql status`
- Check DATABASE_URL in .env file
- Ensure database exists: `psql -U postgres -l`

### Issue 2: Build Errors
**Error**: TypeScript compilation errors
**Solution**:
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Issue 3: Login Not Working
**Error**: "Invalid email or password"
**Solution**:
- Verify database was seeded: `npx prisma studio` and check Users table
- Re-run seed: `npm run db:seed`
- Check NEXTAUTH_SECRET is set in .env

### Issue 4: Charts Not Displaying
**Error**: Blank chart area
**Solution**:
- Check browser console for JavaScript errors
- Verify historical data exists in database
- Refresh the page

## Performance Testing

1. **Load Time**
   - Dashboard should load within 2-3 seconds
   - Charts should render smoothly

2. **API Response Time**
   - Check Network tab in DevTools
   - API calls should complete within 500ms

## Security Testing

1. **Test Session Expiration**
   - Log in, wait 24 hours
   - ✅ Should be logged out automatically

2. **Test Direct URL Access**
   - Without logging in, try: http://localhost:3000/dashboard
   - ✅ Should redirect to login

3. **Verify Password Security**
   - Open Prisma Studio
   - Check User table
   - ✅ Password should be hashed (long string), not plain text

## Success Criteria

Your application is working correctly if:

✅ All authentication tests pass
✅ Dashboard displays all KPIs, charts, and tables
✅ Reports can be created and updated
✅ Data persists across sessions
✅ Navigation works smoothly
✅ No console errors in browser
✅ Responsive design works on mobile/tablet
✅ Database contains seeded data
✅ Build completes without errors

## Next Steps After Testing

Once testing is complete and everything works:

1. **For Development**:
   - Keep using `npm run dev` for hot reloading
   - Make changes to code and test iteratively

2. **For Production Deployment**:
   - Update environment variables for production
   - Change default admin password
   - Use production PostgreSQL database
   - Deploy to platforms like Vercel, Railway, or similar

3. **Optional Enhancements**:
   - Add more user accounts
   - Create additional reports for more years
   - Customize the dashboard layout
   - Add export functionality (PDF, Excel)
   - Add more detailed analytics

## Getting Help

If you encounter issues:
1. Check the console logs (both terminal and browser DevTools)
2. Review the README.md for setup instructions
3. Verify all prerequisites are met
4. Check the .env file configuration
5. Ensure PostgreSQL is running and accessible
