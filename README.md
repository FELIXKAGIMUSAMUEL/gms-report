# 📊 General Manager's Report Portal

A modern, real-time web application for non-profit/educational organizations to manage and view weekly performance reports. Features executive-grade design, role-based access, live updates, and trustee reactions.

## ✨ Features

### 🎭 User Roles
- **General Manager (GM)** - Full access to create/update/delete weekly reports
- **Trustees/Directors** - View dashboard + add reactions (👍 👎 💬) and comments

### 📈 Dashboard Highlights
- **6 Key Metric Cards** with trend indicators (↑ ↓)
  - Fees Collection %
  - Schools Expenditure %
  - Infrastructure Expenditure %
  - Total Enrollment (with previous comparison)
  - Theology Enrollment
  - P.7 Preparation Exams %

### 📊 Interactive Charts
- **Enrollment Trends** - Line chart (2020-2026+)
- **Other Income Performance** - Grouped bar chart by source
- **P.7 Prep Performance** - Multi-year comparison (9 prep schools)

### 📋 Data Tables
- **Upcoming Events** - Date, Activity, In-Charge, Priority
- **GM Projects** - Progress bars, Project Managers
- **School Scorecard** - Color-coded performance metrics
- **Red Flag Issues** - Status tracking (Open/In Progress/Resolved)

### 💬 Trustee Engagement
- React to any section with thumbs up/down
- Add comments to specific cards
- View all reactions and discussions
- Real-time updates every 30 seconds

### 🎨 Modern Design
- Clean, professional interface
- Soft blues, whites, grays color scheme
- Smooth animations and transitions
- Card-based responsive layout
- Executive dashboard polish

### 📱 Fully Responsive
- Perfect on mobile phones
- Optimized for tablets
- Beautiful on desktop
- Mobile-first data entry

## 🚀 Quick Start

### Application is Ready!

**Open**: http://localhost:3000

## 👤 Login Credentials

### General Manager
- **Email**: `gm@g`
- **Password**: `gm13`
- **Access**: Create/edit weekly reports, all data

### Board Trustee
- **Email**: `t`
- **Password**: ``
- **Access**: View dashboard, add reactions/comments

## 📖 How to Use

### As General Manager

1. **Login** with `grg / 3`
2. **Navigate** using the sidebar:
   - 🏠 Dashboard - View current week's report
   - ✏️ Update Report - Enter this week's data
   - 🕐 Past Reports - View/edit historical data
3. **Update Report**:
   - Enter all metrics for the week
   - Add/edit events, projects, issues
   - Save as draft or publish immediately
   - Data appears instantly for trustees

### As Trustee

1. **Login** with `trg / t23`
2. **View Dashboard** - See latest weekly report
3. **React to Sections**:
   - Click 👍 for approval
   - Click 👎 for concerns
   - Click 💬 to add comments
4. **Dashboard Auto-Refreshes** every 30 seconds

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (role-based)
- **Charts**: Recharts
- **Icons**: Hero Icons
- **Styling**: Tailwind CSS

### Key Features
- **Weekly Snapshots** - Historical data preserved
- **Real-time Updates** - 30-second polling
- **Reaction System** - Trustee engagement tracking
- **Sidebar Navigation** - Modern, clean UI
- **Auto-save** - Draft mode for GM entries
- **Mobile-optimized** - Touch-friendly forms

## 📊 Database Models

- `User` - Accounts (GM/TRUSTEE roles)
- `WeeklyReport` - Weekly performance snapshots
- `Reaction` - Trustee feedback (thumbs/comments)
- `Enrollment` - Historical enrollment data
- `OtherIncome` - Income by category/year
- `P7PrepPerformance` - Exam results
- `UpcomingEvent` - Scheduled activities
- `GMProject` - Project tracking
- `WeeklyScorecard` - School performance
- `RedIssue` - Issues tracker

## 🎯 What's New

### Compared to Previous Version

✅ **Weekly Snapshots** - Historical tracking  
✅ **Reaction System** - Trustee engagement  
✅ **Sidebar Navigation** - Modern layout  
✅ **Real-time Polling** - Auto-refresh data  
✅ **Updated Emails** - @sak.org domain  
✅ **Modern Design** - Executive-grade UI  
✅ **Better Mobile UX** - Optimized forms  
✅ **Comment Threads** - Discussion on cards  

## 🛠️ Development Commands

```bash
# Already running at http://localhost:3000

# To restart server
pkill -f "next dev"
npm run dev

# Database management
npx prisma studio      # Visual database editor
npx prisma generate    # Regenerate Prisma client
npm run db:seed        # Reseed database

# Build for production
npm run build
npm run start
```

## 📱 Mobile Experience

- **Touch-optimized** buttons and inputs
- **Large forms** for easy data entry
- **Swipe-friendly** tables
- **Hamburger menu** for navigation
- **Responsive charts** that scale
- **Fast loading** on mobile networks

## 🎨 Design System

### Colors
- **Primary**: Blue (#3b82f6)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Danger**: Red (#ef4444)
- **Purple**: (#8b5cf6)

### Components
- **Cards**: Rounded corners, subtle shadows
- **Buttons**: Smooth transitions
- **Forms**: Large, accessible inputs
- **Tables**: Clean, readable
- **Charts**: Professional, interactive

## 🔄 Real-time Features

- Dashboard **auto-refreshes** every 30 seconds
- Reactions appear **instantly** for all users
- GM updates are **immediately** visible
- No manual page refresh needed
- Live **comment threads** on sections

## ✅ Testing Checklist

### GM Workflow
- [ ] Login as GM
- [ ] Navigate to "Update Report"
- [ ] Enter weekly metrics
- [ ] Add an event
- [ ] Create a project
- [ ] Publish report
- [ ] View dashboard updates

### Trustee Workflow
- [ ] Login as Trustee
- [ ] View current week's report
- [ ] Click 👍 on a metric card
- [ ] Add comment to a chart
- [ ] See reaction count update
- [ ] Wait 30s for auto-refresh

### Mobile Testing
- [ ] Open on phone browser
- [ ] Test hamburger menu
- [ ] Enter data as GM
- [ ] View charts on mobile
- [ ] React as trustee on phone

## 🚀 Production Ready

The app is ready to deploy to:
- **Vercel** (recommended)
- **Railway**
- **Render**
- Any Node.js + PostgreSQL host

### Environment Variables
```env
DATABASE_URL="your-production-postgresql-url"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-domain.com"
```

## 📞 Support

**Application Status**: ✅ Running at http://localhost:3000

**Quick Links**:
- Dashboard: http://localhost:3000/dashboard
- Login: http://localhost:3000/login

**Test Accounts**:
- GM: `gm@sak.org` / `gm123`
- Trustee: `trustee@sak.org` / `trustee123`

---

## 📄 License & Copyright

**© 2026 Mustafa - Sir Apollo Kaggwa Schools. All rights reserved.**

This software is proprietary and confidential. Unauthorized copying, distribution, 
or use of this software, via any medium, is strictly prohibited.

---

**Built with ❤️ for executive-level reporting**
