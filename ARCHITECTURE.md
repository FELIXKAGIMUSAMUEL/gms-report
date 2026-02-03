# Architecture & Feature Matrix

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (Browser)                       │
├─────────────────────────────────────────────────────────────────────┤
│  Dashboard Page                     Update Report Page               │
│  ├── KPI Grid (8 cards)            ├── Period Selection             │
│  ├── Charts (2)                    ├── Tab Interface                │
│  ├── Rankings Table                │   ├── KPI Form                 │
│  ├── Red Issues List               │   ├── P7 Prep Form            │
│  └── Period Filters                │   ├── Events Manager           │
│                                     │   ├── Projects Manager        │
│  Login Page                         │   ├── Issues Manager          │
│  └── Auth Form                      │   └── Scorecard Manager       │
│                                     └── Message Feedback            │
│                       DashboardLayout (Navigation)                  │
│                   (Navbar, Sidebar, Messaging, Notifications)       │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ HTTP/HTTPS
┌──────────────────────────────────▼──────────────────────────────────┐
│                    NEXT.JS SERVER (API Routes)                      │
├─────────────────────────────────────────────────────────────────────┤
│  /api/reports              /api/scorecard       /api/notifications  │
│  ├── GET (filter by year)  ├── GET (filter)     └── GET             │
│  └── POST (create)         └── POST (create)                        │
│                                                                      │
│  /api/p7-prep              /api/issues          /api/messages       │
│  ├── GET (all years)       ├── GET (status)     ├── GET             │
│  ├── POST (create)         ├── POST (create)    └── POST            │
│  ├── PUT (update)          └── DELETE                               │
│  └── DELETE                                                         │
│                                                                      │
│  /api/events               /api/projects        /auth/[...nextauth] │
│  ├── GET                   ├── GET              └── Authentication  │
│  ├── POST                  └── POST             (Login/Logout)      │
│  └── DELETE                                                         │
│                                                                      │
│  /api/enrollment           /api/schools         /api/departments    │
│  └── GET/POST              └── GET              └── GET             │
│                                                                      │
│                    Middleware (Authentication)                      │
│              getServerSession (NextAuth)                            │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ SQL
┌──────────────────────────────────▼──────────────────────────────────┐
│                    PRISMA ORM & DATA LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │    User     │  │WeeklyReport  │  │P7PrepPerf    │                │
│  │  (GM/Trust) │  │   (KPIs)     │  │(Cohort Data) │                │
│  └─────────────┘  └──────────────┘  └──────────────┘                │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │  Scorecard  │  │  RedIssue    │  │    Event     │                │
│  │ (Schools)   │  │  (Problems)  │  │  (Planning)  │                │
│  └─────────────┘  └──────────────┘  └──────────────┘                │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │   Project   │  │  Enrollment  │  │OtherIncome   │                │
│  │ (Tracking)  │  │  (Students)  │  │  (Finance)   │                │
│  └─────────────┘  └──────────────┘  └──────────────┘                │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │   Message   │  │Notification  │  │  Reaction    │                │
│  │  (Chat)     │  │   (Alerts)   │  │(Comments)    │                │
│  └─────────────┘  └──────────────┘  └──────────────┘                │
│                                                                      │
│                    PostgreSQL Database                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INTERACTION                            │
├─────────────────────────────────────────────────────────────────┤
│  1. User logs in with email/password                             │
│     └─> NextAuth validates credentials against User table        │
│     └─> JWT token created, stored in secure cookie              │
│                                                                  │
│  2. Dashboard loads                                              │
│     └─> Page checks for valid session (middleware)              │
│     └─> Fetches data: /api/reports, /api/scorecard, etc.       │
│     └─> useMemo filters data based on selected period           │
│     └─> Charts render with filtered data                        │
│                                                                  │
│  3. User selects different period (Year/Term/Week)             │
│     └─> State updates in React                                  │
│     └─> useMemo recalculates filtered data                      │
│     └─> Components re-render with new data                      │
│                                                                  │
│  4. User enters data in Update Report form                      │
│     └─> Form validates inputs (client-side)                     │
│     └─> POST to /api/{endpoint}                                 │
│     └─> Server validates again (server-side)                    │
│     └─> Prisma creates/updates database record                  │
│     └─> Response sent to client                                 │
│     └─> Success/error message displayed                         │
│                                                                  │
│  5. User navigates to Dashboard                                 │
│     └─> 30-second auto-refresh fetches latest data              │
│     └─> Charts and tables update automatically                  │
│                                                                  │
│  6. User exports data                                           │
│     └─> exportUtils formats data (CSV/Excel/PDF)                │
│     └─> Browser downloads file                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature Matrix

| Feature | Status | Implementation | Priority |
|---------|--------|-----------------|----------|
| **Dashboard** |
| KPI Metrics Display | ✅ Complete | 8-card grid with values | High |
| Period Filters | ✅ Complete | Year/Term/Week dropdowns | High |
| View Mode Toggle | ✅ Complete | Current/Consolidated switch | High |
| Enrollment Chart | ✅ Complete | LineChart with 2 lines | High |
| P7 Cohort Chart | ✅ Complete | LineChart with 11 colored lines | High |
| School Rankings | ✅ Complete | Top 10 schools sorted by score | High |
| Red Issues List | ✅ Complete | Paginated (8 per page) | High |
| Export Button | ✅ Complete | CSV/Excel/PDF ready | Medium |
| **Update Report** |
| KPI Data Entry | ✅ Complete | 8 input fields | High |
| P7 Prep Entry | ✅ Complete | 12 input fields (year + 11 stages) | High |
| Event Management | ✅ Complete | Add/delete with date, activity, priority | Medium |
| Project Tracking | ✅ Complete | Name, manager, progress bar | Medium |
| Issue Logging | ✅ Complete | Title, description, status, priority | High |
| Scorecard Entry | ✅ Complete | School name + 5 dimension scores | High |
| Tabbed Interface | ✅ Complete | 6 tabs with navigation | High |
| Error Messages | ✅ Complete | Error panel with copy button | High |
| **Authentication** |
| Login Page | ✅ Complete | Email/password form | High |
| Session Management | ✅ Complete | NextAuth JWT | High |
| Role-Based Access | ✅ Complete | GM/TRUSTEE roles | High |
| Protected Routes | ✅ Complete | Redirect to login if not auth | High |
| **APIs** |
| Reports CRUD | ✅ Complete | Get/Post with filtering | High |
| P7 Prep CRUD | ✅ Complete | Get/Post/Put/Delete + error handling | High |
| Scorecard CRUD | ✅ Complete | Get/Post with filtering | High |
| Issues CRUD | ✅ Complete | Get/Post with status filter | High |
| Events CRUD | ✅ Complete | Get/Post/Delete | Medium |
| Projects CRUD | ✅ Complete | Get/Post | Medium |
| **UI/UX** |
| Responsive Design | ✅ Complete | Mobile/Tablet/Desktop | High |
| Color Scheme | ✅ Complete | Blue/Green/Red/Gray | High |
| Loading States | ✅ Complete | Spinners on async operations | Medium |
| Error States | ✅ Complete | Red error panels | High |
| Success States | ✅ Complete | Green success messages | High |
| **Performance** |
| Auto-Refresh | ✅ Complete | 30-second interval | Medium |
| Memoization | ✅ Complete | useMemo for filters | High |
| Pagination | ✅ Complete | 8 items per page | High |
| Data Validation | ✅ Complete | Client & server-side | High |
| **Future Enhancements** |
| Email Notifications | ⏳ Pending | SendGrid integration | Low |
| Real-Time Collaboration | ⏳ Pending | WebSocket/Socket.io | Low |
| Mobile App | ⏳ Pending | React Native | Low |
| PDF Report Generation | ⏳ Pending | jsPDF with charts | Medium |
| Advanced Analytics | ⏳ Pending | Trend analysis, forecasting | Low |

---

## File Size & Performance Metrics

| File | Size | Load Time | Importance |
|------|------|-----------|-----------|
| dashboard/page.tsx | ~6KB | <100ms | Critical |
| update-report/page.tsx | ~12KB | <150ms | Critical |
| DashboardLayout.tsx | ~8KB | <80ms | Critical |
| API Routes (avg) | ~2KB | <50ms | Critical |
| Charts Render | - | <300ms | High |
| Data Fetch | - | <500ms | High |
| Page Load Total | - | ~2-3s | High |

---

## Component Hierarchy

```
App (Root Layout)
├── Providers (NextAuth, Tailwind)
│   ├── Login Page
│   │   └── Email/Password Form
│   ├── Dashboard Page
│   │   ├── DashboardLayout
│   │   │   ├── Navbar
│   │   │   │   ├── Logo/Title
│   │   │   │   ├── Period Filters
│   │   │   │   ├── User Profile
│   │   │   │   └── Sign Out
│   │   │   ├── Sidebar
│   │   │   ├── MessagingDrawer
│   │   │   └── NotificationBell
│   │   └── Dashboard Content
│   │       ├── Header
│   │       ├── Control Section
│   │       ├── KPI Grid
│   │       │   ├── KPICard x 8
│   │       │   └── KPICard x 8
│   │       ├── Charts Section
│   │       │   ├── EnrollmentChart
│   │       │   └── P7CohortChart
│   │       ├── School Rankings
│   │       │   └── RankingRow x N
│   │       └── Red Issues
│   │           └── IssueCard x N
│   └── Update Report Page
│       ├── DashboardLayout
│       ├── Period Selection
│       ├── Tab Navigation
│       │   ├── KPI Tab
│       │   ├── P7 Prep Tab
│       │   ├── Events Tab
│       │   ├── Projects Tab
│       │   ├── Issues Tab
│       │   └── Scorecard Tab
│       ├── Form Content
│       │   ├── Input Fields x N
│       │   └── Submit Button
│       └── Message Panel
│           ├── Success/Error Message
│           └── Copy Button
```

---

## Database Relationships

```
User (1) ──────────────────── (N) WeeklyReport
   │                               ├─ (N) Reaction
   │                               └─ (N) Comment
   │
   ├──────────────────────── (N) Message
   │
   ├──────────────────────── (N) Notification
   │
   └──────────────────────── (N) Reaction


WeeklyReport (1) ──── (N) Reaction
WeeklyReport (1) ──── (N) Comment


School (1) ──────────────────── (N) WeeklyScorecard
Department (1) ──────────────── (N) School
P7PrepPerformance (unique year key)
RedIssue (filters by year/term/week)
UpcomingEvent (filters by year/week)
GMProject (filters by year/week)
Enrollment (filters by year/month)
OtherIncome (filters by year)
Message (between Users)
Notification (triggered by events)
Reaction (on any section with sectionId)
```

---

## State Management Pattern

### React Hooks Usage

```javascript
// Global/Context State
- useSession() from NextAuth (authentication)
- useRouter() for navigation
- useSearchParams() for query parameters

// Component State
- useState() for local form data
- useState() for loading states
- useState() for error/success messages
- useState() for UI toggles (tabs, modals, etc.)

// Performance Optimization
- useMemo() for expensive filters and calculations
- useCallback() for event handlers (optional)
- useEffect() for data fetching and auto-refresh

// Data Fetching Pattern
useEffect(() => {
  if (status === "authenticated") {
    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 30000); // Auto-refresh
    return () => clearInterval(interval); // Cleanup
  }
}, [status]);
```

---

## API Response Format

All successful API responses follow this format:

```javascript
{
  "data": {
    "id": "...",
    "field1": value1,
    "field2": value2,
    ...
  }
}

// GET Multiple
{
  "data": [
    { "id": "1", ... },
    { "id": "2", ... }
  ]
}

// Errors
{
  "error": "Error message describing what went wrong"
}
```

---

## Security Considerations

```
┌─────────────────────────────────────────────┐
│         Security Layers                     │
├─────────────────────────────────────────────┤
│                                             │
│  Layer 1: Transport                         │
│  └─ HTTPS/TLS for all traffic              │
│                                             │
│  Layer 2: Authentication                    │
│  └─ NextAuth with JWT tokens               │
│  └─ 30-day session expiry                  │
│  └─ Secure HTTP-only cookies               │
│                                             │
│  Layer 3: Authorization                     │
│  └─ Route-level checks (middleware)         │
│  └─ API-level checks (getServerSession)    │
│  └─ Role-based access control              │
│                                             │
│  Layer 4: Input Validation                  │
│  └─ Client-side (form validation)          │
│  └─ Server-side (Prisma + zod)             │
│  └─ SQL injection prevention (ORM)         │
│                                             │
│  Layer 5: Data Protection                   │
│  └─ Password hashing (bcryptjs)            │
│  └─ No sensitive data in URLs              │
│  └─ Data isolation per organization        │
│                                             │
│  Layer 6: Error Handling                    │
│  └─ Generic error messages to user         │
│  └─ Detailed logs for debugging            │
│                                             │
└─────────────────────────────────────────────┘
```

---

**Architecture & Feature Matrix** - Comprehensive system overview for developers and stakeholders.
