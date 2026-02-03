# Quick Start Guide - Testing the System

## 🚀 Starting the System

```bash
cd gms-report
npm run dev
```

Server runs on: **http://localhost:3001**

---

## 🔐 Default Test Credentials

These need to be seeded in the database. First, run:

```bash
npx prisma db seed
```

**Sample Login:**
- Email: `gm@example.com`
- Password: `password123`

---

## 📱 Navigation Guide

### Main Pages

1. **Dashboard** (`/dashboard`)
   - View all KPIs, charts, school rankings, and red issues
   - Toggle between "Current Period" and "Consolidated" views
   - Filter by Year → Term → Week

2. **Update Report** (`/update-report`)
   - Enter/update weekly data
   - Click tabs to switch between: KPI, P7 Prep, Events, Projects, Issues, Scorecard

3. **Login** (`/login`)
   - Authentication required to access dashboard/update-report

---

## 🧪 Manual Testing Scenarios

### Scenario 1: Enter Weekly KPI Data
1. Go to `/update-report`
2. Set Year: 2025, Week: 1
3. Fill in KPI metrics (Fees: 85, Expenditure: 80, etc.)
4. Click "Save KPI Report"
5. ✅ See green success message

### Scenario 2: Add P7 Cohort Data
1. Go to `/update-report`
2. Click "P7 PREP" tab
3. Enter Year: 2025
4. Fill in P6 Promotion: 150, Prep1: 145, ... , PLE: 120
5. Click "Save P7 Data"
6. ✅ Check `/dashboard` → P7 chart shows new year

### Scenario 3: Track Red Issues
1. Go to `/update-report`
2. Click "RED ISSUES" tab
3. Enter:
   - Title: "Staff shortage"
   - Description: "Need 5 more teachers"
   - Status: OPEN
   - Priority: 5
4. Click "Add Issue"
5. ✅ See issue in `/dashboard` → Red Issues section

### Scenario 4: Filter by Period
1. Go to `/dashboard`
2. Click "Current Period" button
3. Select:
   - Year: 2025
   - Term: 2
   - Week: 5
4. ✅ All data updates to show only Week 5 of Term 2
5. Toggle "Consolidated" → see all data for year

### Scenario 5: View School Rankings
1. Go to `/update-report` → Scorecard tab
2. Add multiple schools:
   - School A: Academic 90, Finance 85, Quality 88, Technology 92, Theology 90
   - School B: Academic 80, Finance 75, Quality 80, Technology 85, Theology 88
3. Save scorecards
4. Go to `/dashboard`
5. ✅ School Rankings shows School A ranked #1

### Scenario 6: View P7 Cohort Journey
1. Add P7 data for multiple years (2024, 2025, 2026)
2. Go to `/dashboard`
3. Scroll to "P7 Cohort Journey" chart
4. ✅ See 11 colored lines showing progression over years

---

## 🔍 Troubleshooting

### Issue: "Internal server error" when saving
**Solution:**
1. Check browser console for detailed error
2. Copy error message (use copy button in form)
3. Error typically shows missing field or type mismatch
4. Verify data types match schema (numbers as strings are coerced)

### Issue: Dashboard shows no data
**Solution:**
1. Make sure you've created data in `/update-report` first
2. Check if period filters are too restrictive
3. Go to "Consolidated" view to see all data

### Issue: Charts not rendering
**Solution:**
1. Check if data exists for the selected period
2. Verify browser console for Recharts errors
3. Try refreshing page

### Issue: Authentication fails
**Solution:**
1. Run `npx prisma db seed` to create test user
2. Verify user exists: `npx prisma studio`
3. Check `.env` file has `NEXTAUTH_SECRET` set

---

## 📊 API Testing with cURL

### Get Weekly Reports
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/reports?year=2025&weekNumber=1
```

### Create P7 Prep Data
```bash
curl -X POST http://localhost:3001/api/p7-prep \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2025,
    "p6Promotion": 150,
    "prep1": 145,
    "prep2": 142,
    "prep3": 140,
    "prep4": 138,
    "prep5": 135,
    "prep6": 130,
    "prep7": 125,
    "prep8": 120,
    "prep9": 115,
    "ple": 110
  }'
```

### Get Scorecards
```bash
curl http://localhost:3001/api/scorecard?year=2025&week=1
```

### Get Red Issues
```bash
curl http://localhost:3001/api/issues?status=OPEN
```

---

## 📈 Key Features to Verify

- ✅ **Period Filtering**: Year/Term/Week dropdowns work
- ✅ **View Modes**: "Current Period" vs "Consolidated" toggle
- ✅ **KPI Grid**: 8 metrics display correctly
- ✅ **Charts**: Enrollment trends and P7 journey render
- ✅ **Data Entry**: All form tabs submit successfully
- ✅ **Error Handling**: Server errors display with details
- ✅ **Pagination**: Issues list shows 8 items per page
- ⏳ **Export**: Test CSV/Excel/PDF exports when implemented

---

## 🎯 Success Criteria

System is working correctly when:
1. Dashboard loads dashboard without 404 or 500 errors
2. Can save KPI data and see it reflected immediately
3. P7 chart shows year-over-year cohort progression
4. School rankings calculate correctly from scorecard entries
5. Period filters update all displayed data
6. Red issues paginate properly (8 items/page)
7. Form submissions show success/error messages
8. No console errors in browser DevTools

---

**Current Status**: ✅ System rebuilt and ready for testing
**Next Steps**: Run manual test scenarios above, verify all features work
