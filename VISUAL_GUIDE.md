# Visual Guide - UI Pages & Features

## Page 1: Login Page

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                  GM REPORT SYSTEM               │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Email                                  │ │ │
│  │  [_________________________________]     │ │ │
│  │                                         │ │ │
│  │  Password                              │ │ │
│  │  [_________________________________]     │ │ │
│  │                                         │ │ │
│  │  [ Remember Me ]                        │ │ │
│  │                                         │ │ │
│  │          [ Sign In Button ]             │ │ │
│  │                                         │ │ │
│  │  Don't have an account? Sign up →       │ │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘

Features:
- Email & password input fields
- Remember me checkbox
- Error display for invalid credentials
- Links to password recovery & registration
- Form validation before submission
```

---

## Page 2: Dashboard (Current Period View)

```
┌──────────────────────────────────────────────────────────────────┐
│ ◀ GM Report System                    [Notifications] [Profile ▼] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 Weekly Report Dashboard                                     │
│  Week 5, Term 2, 2025                                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [● Current Period] [○ Consolidated]   Year: [2025 ▼]        ││
│  │                                         Term: [2 ▼]         ││
│  │                                         Week: [5 ▼]         ││
│  │                                            [Export ▼]       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  KPI METRICS (8 Cards in 4x2 grid)                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Fees %   │ │Expendit%│ │Infrast % │ │Enrollment│          │
│  │   85%    │ │   80%   │ │   90%    │ │  2,540   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Theology │ │P7 Prep % │ │Syllabus %│ │Admissions│          │
│  │   450    │ │   88%    │ │   92%    │ │   125    │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                  │
│  CHARTS (2x1 grid)                                             │
│  ┌────────────────────────────────┐ ┌──────────────────────┐  │
│  │ Enrollment Trends              │ │ School Rankings      │  │
│  │ 2500├─────────────────────  T  │ │ 1. School A    87.5 │  │
│  │      │    ╱╲  ╱╲  ╱╲         │ │ 2. School B    85.2 │  │
│  │ 2400├─╱  ╲╱  ╲╱  ╲╱         T │ │ 3. School C    82.1 │  │
│  │      │                        │ │ 4. School D    80.5 │  │
│  │      └────┬────┬────┬────┬─  │ │ 5. School E    78.3 │  │
│  │           W1   W2   W3   W4  │ │ ...                  │  │
│  └────────────────────────────────┘ └──────────────────────┘  │
│                                                                  │
│  P7 COHORT JOURNEY (Multi-line chart)                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 200├        ╱╲      ╱╲                                       ││
│  │    │   P6─╱  ╲Pr1──╱  ╲Pr2────── ... ─────PLE              ││
│  │ 150├──╱─────╲───────────────────────────────                ││
│  │    │ 2024     2025        2026                              ││
│  │ 100├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─              ││
│  │    └────────────────────────────────────────                ││
│  │        P6→Prep1→Prep2→...→Prep9→PLE (11 colored lines)     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  RED ISSUES (Last 8 of N)                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Staff Shortage                             [OPEN]            ││
│  │ Need 5 more teachers by next term                            ││
│  │                                                              ││
│  │ Low Syllabus Coverage                      [IN PROGRESS]     ││
│  │ Only 65% of curriculum completed in Science                  ││
│  │                                                              ││
│  │ Infrastructure Issues                      [OPEN]            ││
│  │ Roof leaking in Block B, needs urgent repairs                ││
│  │                                                              ││
│  │ >> Load More Issues (Showing 8 of 23)                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Page 3: Dashboard (Consolidated View)

```
┌──────────────────────────────────────────────────────────────────┐
│ ◀ GM Report System                    [Notifications] [Profile ▼] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 Weekly Report Dashboard                                     │
│  Consolidated View - All Periods                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [○ Current Period] [● Consolidated]                   [Export ▼]│
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  KPI METRICS (Averages Across All Periods)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Fees %   │ │Expendit%│ │Infrast % │ │Enrollment│          │
│  │   82%    │ │   78%   │ │   85%    │ │  2,380   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                  │
│  CHARTS (Showing all years/periods)                            │
│  ┌────────────────────────────────┐ ┌──────────────────────┐  │
│  │ Enrollment Trends (All Year)   │ │ School Rankings      │  │
│  │ 3000├──────────────────────────│ │ (All Time)           │  │
│  │      │  ╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲  │ │ 1. School X    88.2 │  │
│  │ 2500├─╱  ────────────────────  │ │ 2. School A    87.5 │  │
│  │      │                        │ │ 3. School B    85.2 │  │
│  │ 2000├─                        │ │ ...                  │  │
│  │      └────┬────┬────┬────┬─  │ │                      │  │
│  │        W1-13 W14-26 W27-39    │ │                      │  │
│  └────────────────────────────────┘ └──────────────────────┘  │
│                                                                  │
│  P7 COHORT JOURNEY (4 years of data)                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 250├        ╱╲      ╱╲      ╱╲                              ││
│  │    │       ╱  ╲    ╱  ╲    ╱  ╲                             ││
│  │ 200├─────╱────╲──╱────╲──╱────╲                             ││
│  │    │   2023     2024     2025   2026                         ││
│  │ 150├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─                           ││
│  │    │                                                        ││
│  │ 100├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─                           ││
│  │    └────────────────────────────────────────                ││
│  │        11 lines showing year-over-year trends              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  RED ISSUES (All Open Issues)                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Showing 23 total issues across all periods                   ││
│  │ << Previous | Page 3 of 3 | Next >>                          ││
│  │                                                              ││
│  │ [Issue 1] [Issue 2] [Issue 3] ... [Issue 8]                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Page 4: Update Report - KPI Tab

```
┌──────────────────────────────────────────────────────────────────┐
│ ◀ GM Report System                    [Notifications] [Profile ▼] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Update Weekly Report                                          │
│  Add data for week 5, 2025                                    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Year    Week    Start Date    End Date                       ││
│  │ [2025▼] [5 ▼]  [2025-01-27]  [2025-02-02]                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [● KPI] [○ P7 PREP] [○ EVENTS] [○ PROJECTS] [○ ISSUES] [○ SC] ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  KPI Metrics                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Fees %    │ │Expendit%│ │Infrast % │ │Enrollment│          │
│  │[____85__]│ │[____80__]│ │[____90__]│ │[___2540__]           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Theology  │ │P7 Prep % │ │Syllabus %│ │Admissions│          │
│  │[____450__]│ │[____88__]│ │[____92__]│ │[____125__]           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                  │
│                     [ Save KPI Report ]                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ✓ KPI data saved successfully!                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Page 5: Update Report - P7 Prep Tab

```
┌──────────────────────────────────────────────────────────────────┐
│  Update Weekly Report > P7 Cohort Journey                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [○ KPI] [● P7 PREP] [○ EVENTS] [○ PROJECTS] [○ ISSUES] [○ SC] ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  P7 Cohort Journey                                              │
│  Year  P6Promo  Prep1  Prep2  Prep3  Prep4  Prep5  Prep6        │
│  [2025]  [150]  [145]  [142]  [140]  [138]  [135]  [130]       │
│                                                                  │
│  Prep7  Prep8  Prep9  PLE                                       │
│  [125]  [120]  [115]  [110]                                    │
│                                                                  │
│                     [ Save P7 Data ]                            │
│                                                                  │
│  ✓ P7 Prep data saved!                                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Page 6: Update Report - Events Tab

```
┌──────────────────────────────────────────────────────────────────┐
│  Update Weekly Report > Upcoming Events                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [○ KPI] [○ P7 PREP] [● EVENTS] [○ PROJECTS] [○ ISSUES] [○ SC] ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Current Events                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ✓ Staff Meeting                    2025-02-01               ││
│  │   Prepare Q1 report - John Smith                              ││
│  │                                                              ││
│  │ ✓ Parent-Teacher Conference        2025-02-05               ││
│  │   Meet with parents - Management Team                        ││
│  │                                                              ││
│  │ ✓ Exam Invigilation               2025-02-10               ││
│  │   Final exams - Academic Staff                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Add New Event                                                   │
│  Date: [2025-02-08]  Activity: [_____________]                 │
│  In Charge: [_____________]  Priority: [High ▼]                │
│                                                                  │
│                   [ + Add Event ]                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Page 7: Update Report - Issues Tab

```
┌──────────────────────────────────────────────────────────────────┐
│  Update Weekly Report > Red Issues                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [○ KPI] [○ P7 PREP] [○ EVENTS] [○ PROJECTS] [● ISSUES] [○ SC]││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Current Issues                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ⚠ Staff Shortage                [OPEN]                       ││
│  │   Need 5 more teachers by next term                           ││
│  │                                                              ││
│  │ ⚠ Low Syllabus Coverage          [IN PROGRESS]               ││
│  │   Only 65% of curriculum completed in Science                ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Add New Issue                                                   │
│  Title: [_______________________]                               │
│  Description: [_______________________]                        │
│  Status: [OPEN ▼]  Priority: [5/5] ■■■■■                       │
│                                                                  │
│                   [ + Add Issue ]                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Page 8: Update Report - Scorecard Tab

```
┌──────────────────────────────────────────────────────────────────┐
│  Update Weekly Report > School Scorecard                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [○ KPI] [○ P7 PREP] [○ EVENTS] [○ PROJECTS] [○ ISSUES] [● SC]││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Add School Scorecard                                            │
│  School ID: [___]  School Name: [______________]                │
│  Academic: [90]    Finance: [85]    Quality: [88]              │
│  Technology: [92]  Theology: [90]                               │
│                                                                  │
│                   [ + Add Scorecard ]                           │
│                                                                  │
│  School Scores for Week 5, Term 2, 2025                        │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ School A    Academic: 90  Finance: 85  Quality: 88          ││
│  │             Technology: 92  Theology: 90  Avg: 89.0         ││
│  │                                                             ││
│  │ School B    Academic: 80  Finance: 75  Quality: 80          ││
│  │             Technology: 85  Theology: 88  Avg: 81.6         ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Color & Status Indicators

### Status Badges
```
[OPEN]          - Red background, red text      ⚠️ Urgent
[IN_PROGRESS]   - Yellow background, text       ⏳ Working
[RESOLVED]      - Green background, green text  ✓ Complete
```

### Priority Levels
```
Priority 5: ■■■■■ (Red - Critical)
Priority 4: ■■■■□ (Orange - High)
Priority 3: ■■■□□ (Yellow - Medium)
Priority 2: ■■□□□ (Blue - Low)
Priority 1: ■□□□□ (Gray - Minimal)
```

### Messages
```
✓ Success (Green)
  ✓ Data saved successfully!
  
⚠ Error (Red)
  ⚠ Failed to save data
  Error details: [Copy Button]
```

---

## Responsive Behavior

### Mobile (< 640px)
- Single column layout
- Tabs stack vertically
- Charts adjusted for small screen
- Touch-friendly button sizes

### Tablet (640px - 1024px)
- 2-column layout for grids
- Charts still readable
- Tab buttons wrap as needed

### Desktop (1024px+)
- 3-4 column layout
- Full-sized charts
- Horizontal tab navigation
- Optimal spacing

---

**This visual guide shows the complete user interface for the GM Weekly Report System.**
