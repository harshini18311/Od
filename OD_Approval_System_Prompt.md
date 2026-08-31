# 🎓 Online OD Approval Management System
## Enhanced Workflow + Complete AI Development Prompt

---

## PART 1 — ENHANCED WORKFLOW ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OD APPROVAL SYSTEM — FULL FLOW                   │
└─────────────────────────────────────────────────────────────────────┘

╔══════════════════╗
║   LANDING PAGE   ║
║  Student | Staff ║
╚════════╤═════════╝
         │
    ┌────┴────┐
    │         │
    ▼         ▼
╔════════╗ ╔════════╗
║STUDENT ║ ║ STAFF  ║
║ LOGIN  ║ ║ LOGIN  ║
╚════╤═══╝ ╚════╤═══╝
     │           │
     ▼           ▼
╔══════════╗  ╔══════════════════════════════════╗
║ STUDENT  ║  ║         STAFF DASHBOARD          ║
║DASHBOARD ║  ║  Mentor | Chair | HOD                ║
╚══════════╝  ║  Admin                           ║
              ╚══════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STUDENT SIDE — OD REQUEST FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Student] → Fills OD Form
             ├── Auto-filled: Name, RegNo, Dept, Mentor
             ├── Manual: Event, Dates, Reason, Brochure
             └── Student Type: Day Scholar / Hosteller

[SUBMIT] → OD_ID Generated → Status: "Pending Mentor Approval"
                ↓
         ┌──────────────────────────────────┐
         │     STEP 1: MENTOR REVIEW        │
         │  View Details + Brochure         │
         │  Add Remarks                     │
         └──────────┬───────────────────────┘
                    │
          ┌─────────┴─────────┐
       APPROVE             REJECT
          │                   │
          ▼                   ▼
   Forward to          Notify Student
   Chairperson         (Rejection Reason)
          │
         ↓
         ┌──────────────────────────────────┐
         │   STEP 2: CHAIRPERSON REVIEW     │
         │  Verify Academic Calendar        │
         │  Check Clashes / Duplicates      │
         └──────────┬───────────────────────┘
                    │
          ┌─────────┴─────────┐
       APPROVE             REJECT
          │                   │
          ▼                   ▼
   Forward to HOD       Notify Student
          │
         ↓
         ┌──────────────────────────────────┐
         │      STEP 3: HOD REVIEW          │
         │  Validate Event Legitimacy       │
         │  Check Student Academic Standing │
         └──────────┬───────────────────────┘
                    │
          ┌─────────┴─────────┐
       APPROVE             REJECT
          │                   │
          ▼                   ▼
   Check Student Type    Notify Student
          │
    ┌─────┴──────┐
    │            │
    ▼            ▼
DAY SCHOLAR   HOSTELLER
    │            │
    ▼            ▼
FINAL         Forward to
APPROVAL      PRINCIPAL
    │            │
    │           ↓
    │    ┌──────────────────────────────────┐
    │    │    STEP 4: PRINCIPAL REVIEW      │
    │    │  (Hostellers Only)               │
    │    └──────────┬───────────────────────┘
    │               │
    │     ┌─────────┴─────────┐
    │  APPROVE             REJECT
    │     │                   │
    │     ▼                   ▼
    │  FINAL              Notify Student
    │  APPROVAL           + Warden
    │     │
    └─────┴──────────────────────────────────┐
                                             ▼
                              ╔══════════════════════════╗
                              ║    OD APPROVED ✓         ║
                              ║  PDF Generated           ║
                              ║  QR Code Created         ║
                              ║  Notifications Sent      ║
                              ╚══════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━
NOTIFICATION MATRIX
━━━━━━━━━━━━━━━━━━━━━━━━━

Event              → Notify
─────────────────────────────────────────────────────
Submitted          → Mentor
Mentor Approved    → Chairperson + Student (update)
Chair Approved     → HOD + Student (update)
HOD Approved       → Student + Admin + Chair
Any Rejection      → Student (with reason) + Previous Approver
```

---

## PART 2 — DATABASE SCHEMA

```sql
-- USERS & ROLES
users           (id, name, email, password_hash, role, dept_id, created_at)
roles           (id, name)  -- student, mentor, chairperson, hod, admin
departments     (id, name, code, hod_id)

-- STUDENT SPECIFIC
students        (id, user_id, reg_no, year, section, type[day/hosteller], mentor_id, dept_id)

-- OD REQUESTS
od_requests     (id, student_id, od_code, event_name, college_name,
                 event_date, from_date, to_date, reason, brochure_url,
                 student_type, current_stage, status, created_at)

-- APPROVAL CHAIN
approval_logs   (id, od_id, approver_id, role, action[approved/rejected],
                 remarks, timestamp)

-- NOTIFICATIONS
notifications   (id, user_id, od_id, message, type, is_read, created_at)
```

---

## PART 3 — API ROUTES STRUCTURE

```
AUTH
  POST /api/auth/login
  POST /api/auth/logout
  GET  /api/auth/me

STUDENT
  GET  /api/student/dashboard
  GET  /api/student/od-requests
  POST /api/student/od-request/new
  GET  /api/student/od-request/:id/status

STAFF (role-gated)
  GET  /api/staff/pending-requests
  POST /api/staff/od-request/:id/approve
  POST /api/staff/od-request/:id/reject

ADMIN
  GET  /api/admin/users
  POST /api/admin/users
  GET  /api/admin/od-requests/all
  GET  /api/admin/reports/export

NOTIFICATIONS
  GET  /api/notifications
  PUT  /api/notifications/:id/read
```

---

## PART 4 — COMPLETE AI DEVELOPMENT PROMPT

> Copy the prompt below and paste it into Bolt.new / Lovable / Cursor / v0 / any AI coding tool.

---

```
SYSTEM ROLE:
You are a senior full-stack developer. Build a complete, production-ready
college OD (On Duty) Approval Management System with real working code —
no placeholders, no TODO comments.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT: Online OD Approval System
COLLEGE USE CASE: Tamil Nadu Engineering College
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TECH STACK:
  Frontend  → React 18 + Vite + Tailwind CSS + shadcn/ui
  Backend   → Node.js + Express.js
  Database  → PostgreSQL with Prisma ORM
  Auth      → JWT + bcrypt (Role-Based Access Control)
  File      → Multer + Cloudinary (brochure uploads)
  PDF       → pdfkit (approved OD letter generation)
  QR Code   → qrcode npm package
  Email     → Nodemailer (SMTP)

━━━━━━━━━━━━━━━━━━━
ROLE SYSTEM (RBAC)
━━━━━━━━━━━━━━━━━━━

7 roles total:
  1. student        → submit OD, track status
  2. mentor         → approve/reject Step 1
  3. chairperson    → approve/reject Step 2
  4. hod            → approve/reject Step 3
  5. admin          → full system access, reports, user management

Each JWT token must encode: userId, role, deptId

━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE MODELS (Prisma)
━━━━━━━━━━━━━━━━━━━━━━━━━

Generate Prisma schema for:

  User          { id, name, email, passwordHash, role, deptId }
  Department    { id, name, code, hodId }
  Student       { id, userId, regNo, year, section, type(DAY_SCHOLAR|HOSTELLER), mentorId, deptId }
  OdRequest     { id, studentId, odCode(auto-gen UUID-short), eventName, collegeName,
                  eventDate, fromDate, toDate, reason, brochureUrl,
                  studentType, currentStage, status, createdAt }
  ApprovalLog   { id, odId, approverId, role, action(APPROVED|REJECTED), remarks, timestamp }
  Notification  { id, userId, odId, message, isRead, createdAt }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPROVAL WORKFLOW LOGIC (BACKEND)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implement this exact multi-stage pipeline:

  STAGE 1: mentor_pending
    → mentor approves → STAGE 2: chairperson_pending
    → mentor rejects  → STATUS: rejected (notify student)

  STAGE 2: chairperson_pending
    → chair approves  → STAGE 3: hod_pending (or STATUS: approved if Internal/Staff applied)
    → chair rejects   → STATUS: rejected

  STAGE 3: hod_pending
    → hod approves → STATUS: approved
                     generate PDF + QR
                     notify student, chair, admin
    → hod rejects → STATUS: rejected

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FRONTEND PAGES TO BUILD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. LANDING PAGE
   - Two animated cards: "Student Login" | "Staff Login"
   - College branding, clean professional look
   - Dark mode support

2. STUDENT DASHBOARD
   - Greeting with student name
   - Stats: Total OD Requests, Approved, Pending, Rejected
   - Recent requests table with live status badges
   - "New OD Request" floating action button
   - Notification bell with unread count

3. OD REQUEST FORM
   - Auto-filled: Student Name, RegNo, Department, Mentor Name
   - Manual fields: College Name, Event Name, Event Date,
     From Date, To Date, Reason (textarea)
   - File upload: Brochure (PDF or image, max 5MB)
   - Radio: Day Scholar / Hosteller
   - Submit with loading state

4. OD STATUS PAGE (per request)
   - Vertical timeline showing each approval stage
   - Status indicators: pending / approved / rejected / waiting
   - Show remarks from each approver
   - Download PDF button (if approved)
   - QR code display (if approved)

5. STAFF DASHBOARD (role-specific)
   - Pending approvals table
   - Filter by date, department, event
   - Click to open full request detail view
   - Approve / Reject modal with remarks field
   - History of past actions

6. ADMIN PANEL
   - Tabs: Users | Departments | OD Requests | Reports
   - CRUD for users (assign roles, departments, mentors)
   - View all OD requests with filters
   - Export to CSV / PDF report
   - Dashboard analytics with charts (recharts):
     * OD requests per month
     * Approval rate by department
     * Day Scholar vs Hosteller ratio

━━━━━━━━━━━━━━━━━━━━━━━━━
UI / UX REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━

- Mobile-first responsive design
- Dark mode toggle (persist in localStorage)
- Color palette: Deep Navy (#0F172A) + Amber (#F59E0B) accent
- Status badges:
    Pending    → yellow
    Approved   → green
    Rejected   → red
    Forwarded  → blue
- Role-colored sidebar icons
- Smooth page transitions (Framer Motion or CSS)
- Toast notifications for all actions
- Form validation with inline error messages
- Loading skeletons for data fetches

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API ENDPOINTS TO IMPLEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AUTH
  POST   /api/auth/login         → returns JWT + user profile
  GET    /api/auth/me            → returns current user (validate token)

STUDENT
  GET    /api/student/dashboard  → stats + recent requests
  GET    /api/student/requests   → paginated OD history
  POST   /api/student/request    → submit new OD (multipart/form-data)
  GET    /api/student/request/:id → single OD with full timeline

STAFF (all require auth + role check)
  GET    /api/staff/queue        → pending requests for this role
  POST   /api/staff/approve/:id  → approve with optional remarks
  POST   /api/staff/reject/:id   → reject with required remarks
  GET    /api/staff/history      → past actions by this staff

NOTIFICATIONS
  GET    /api/notifications      → user's notifications (unread first)
  PUT    /api/notifications/read → mark all as read

ADMIN
  GET    /api/admin/users        → all users
  POST   /api/admin/users        → create user
  PUT    /api/admin/users/:id    → edit user / change role
  DELETE /api/admin/users/:id    → deactivate user
  GET    /api/admin/requests     → all OD requests with filters
  GET    /api/admin/report       → aggregated stats JSON
  GET    /api/admin/export       → CSV download

━━━━━━━━━━━━━━━━━━━━━━━━━━
SMART FEATURES TO INCLUDE
━━━━━━━━━━━━━━━━━━━━━━━━━━

1. OD_ID Generation
   Format: OD-YYYY-DEPT-XXXX (e.g. OD-2025-CSE-0042)

2. Approved OD PDF Letter
   - College header / logo
   - Student details
   - Event details
   - All approval signatures (names + timestamps)
   - QR code embedded in bottom-right corner

3. QR Code Verification
   - Each approved OD gets a unique QR
   - QR links to: /verify/:odCode
   - Public verification page (no login needed)
   - Shows: Student Name, Event, Dates, Status

4. Duplicate Prevention
   - Block students from submitting overlapping date ODs
   - Show warning if similar event already submitted

5. Deadline Logic
   - OD must be submitted at least 3 days before event
   - Show countdown on dashboard for pending approvals
   - Auto-flag if pending > 48 hours without action (alert admin)

6. Academic Year Scoping
   - All data scoped to current academic year
   - Admin can set/close academic year

━━━━━━━━━━━━━━━━━━━
SEED DATA TO CREATE
━━━━━━━━━━━━━━━━━━━

Do not create seeded login accounts or default passwords.
If sample data is required, keep it non-authenticated and user-created only.

━━━━━━━━━━━━━━━━━━━━━
FOLDER STRUCTURE
━━━━━━━━━━━━━━━━━━━━━

od-system/
├── client/                  ← React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── NewOdRequest.jsx
│   │   │   ├── OdStatus.jsx
│   │   │   ├── StaffDashboard.jsx
│   │   │   └── AdminPanel.jsx
│   │   ├── components/
│   │   │   ├── ApprovalTimeline.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── OdCard.jsx
│   │   │   └── RoleGuard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── lib/
│   │       └── api.js
├── server/                  ← Node.js + Express backend
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── student.js
│   │   ├── staff.js
│   │   ├── admin.js
│   │   └── notifications.js
│   ├── middleware/
│   │   ├── auth.js          ← JWT verify
│   │   └── roleGuard.js     ← RBAC check
│   ├── services/
│   │   ├── approvalEngine.js
│   │   ├── pdfGenerator.js
│   │   ├── qrService.js
│   │   └── notificationService.js
│   └── index.js
└── README.md

━━━━━━━━━━━━━━━━━━━━━━━━━━
DELIVERABLES CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━

[ ] Working login for all 5 roles
[ ] Student can submit OD with file upload
[ ] Mentor → Chair → HOD approval chain works
[ ] OD requests are fully approved after HOD (or Chairperson if Internal/Staff applied)
[ ] PDF generated on final approval
[ ] QR code verifiable via public URL
[ ] Real-time notification count in navbar
[ ] Admin can export OD report as CSV
[ ] Mobile responsive on all pages
[ ] Dark mode toggle works
[ ] Seed data populates correctly
[ ] .env.example file included

Build the complete working system now. Start with
the backend schema + approval engine, then the
frontend with all pages connected to real APIs.
```

---

## PART 5 — QUICK SETUP COMMANDS

```bash
# Clone / init project
mkdir od-approval-system && cd od-approval-system

# Backend
mkdir server && cd server
npm init -y
npm install express prisma @prisma/client bcryptjs jsonwebtoken
npm install multer cloudinary nodemailer pdfkit qrcode cors dotenv
npm install -D nodemon
npx prisma init

# Frontend
cd ..
npm create vite@latest client -- --template react
cd client
npm install
npm install axios react-router-dom
npm install tailwindcss @tailwindcss/forms shadcn-ui
npm install recharts framer-motion react-hot-toast

# ENV variables needed
# server/.env:
DATABASE_URL=postgresql://user:pass@localhost:5432/od_system
JWT_SECRET=your_super_secret_key
CLOUDINARY_URL=cloudinary://...
SMTP_HOST=smtp.gmail.com
SMTP_USER=your@gmail.com
SMTP_PASS=app_password
CLIENT_URL=http://localhost:5173
```

---

## PART 6 — DEPLOYMENT STACK RECOMMENDATION

| Layer | Free Option | Paid Option |
|-------|-------------|-------------|
| Frontend | Vercel | Vercel Pro |
| Backend | Render | Railway |
| Database | Supabase (Postgres) | PlanetScale |
| File Storage | Cloudinary (free tier) | AWS S3 |
| Email | Gmail SMTP | SendGrid |

---

*Prompt crafted for: Bolt.new / Lovable / Cursor / Windsurf / v0.dev*
*Project: OD Approval System — Tamil Nadu Engineering College Context*
*Stack: React + Node.js + PostgreSQL + Prisma*
