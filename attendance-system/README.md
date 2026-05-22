# AttendX — Student Attendance System

A full-stack, production-ready attendance management system built with **Next.js 14 App Router**, **Firebase Authentication**, **Firestore**, and **Tailwind CSS**.

---

## ✨ Features

### Student Portal
- Dropdown-based login (Trade → Semester → Section → Roll Number)
- Dashboard with attendance stats (total present, absent, percentage)
- Circular doughnut attendance chart
- Weekly attendance bar chart
- Subject-wise horizontal bar chart
- Full attendance history table with filters & pagination
- Low attendance warning (below 75%)
- Top students leaderboard
- Auto-generated timetable from teacher schedules

### Teacher Portal
- Sign In / Sign Up
- Weekly timetable setup (period-by-period)
- Dashboard with today's schedule, stats, and charts
- Mark attendance with one-click toggle (Present/Absent)
- Pre-loaded student list per period
- Default all-present, teacher marks absents
- Student management (add/remove)
- Low attendance tracker
- Attendance reports with date range filters
- Export to **CSV**, **Excel**, and **PDF**

### Admin Panel
- Manage trades/branches
- Create, edit, delete subjects per semester
- View system-wide stats (teachers, students, trades, subjects)
- End-of-semester student upgrade (auto-increment semester)

### System
- Firebase Auth + Firestore
- Role-based access (admin / teacher / student)
- Dark mode + Light mode (persisted to Firestore)
- Blue and Ocean color themes
- Fonts: Sora (display) + DM Sans (body) + JetBrains Mono (code)
- Fully responsive (mobile, tablet, desktop)
- Sidebar for teacher/admin, top navbar for students

---

## 📁 Folder Structure

```
attendance-system/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout with fonts & providers
│   │   ├── globals.css                 # Global styles + CSS variables
│   │   ├── student/
│   │   │   ├── login/page.tsx          # Dropdown-based student login
│   │   │   ├── dashboard/page.tsx      # Full student dashboard
│   │   │   ├── attendance/page.tsx     # Detailed attendance view
│   │   │   └── timetable/page.tsx      # Auto-built student timetable
│   │   ├── teacher/
│   │   │   ├── login/page.tsx          # Teacher sign in/up
│   │   │   ├── setup/page.tsx          # Timetable builder
│   │   │   ├── dashboard/page.tsx      # Teacher dashboard
│   │   │   ├── mark-attendance/page.tsx # Attendance marking sheet
│   │   │   ├── students/page.tsx       # Student management
│   │   │   ├── timetable/page.tsx      # Timetable viewer
│   │   │   └── reports/page.tsx        # Reports + export
│   │   └── admin/
│   │       ├── login/page.tsx          # Admin login
│   │       └── dashboard/page.tsx      # Admin panel
│   ├── components/
│   │   ├── ui/
│   │   │   ├── StatCard.tsx            # Reusable stat cards
│   │   │   ├── ThemeToggle.tsx         # Dark/light + color theme
│   │   │   ├── Loading.tsx             # Spinner component
│   │   │   └── Modal.tsx               # Accessible modal
│   │   ├── charts/
│   │   │   ├── CircularChart.tsx       # Doughnut attendance %
│   │   │   ├── WeeklyChart.tsx         # Stacked weekly bar
│   │   │   └── SubjectChart.tsx        # Horizontal subject bars
│   │   ├── shared/
│   │   │   ├── Navbar.tsx              # Top navigation bar
│   │   │   └── Sidebar.tsx             # Collapsible sidebar
│   │   └── student/
│   │       ├── AttendanceHistoryTable.tsx
│   │       └── LowAttendanceWarning.tsx
│   ├── lib/
│   │   ├── firebase.ts                 # Firebase initialization
│   │   ├── auth-context.tsx            # Auth provider & hooks
│   │   ├── db.ts                       # All Firestore operations
│   │   ├── export.ts                   # CSV / Excel / PDF export
│   │   └── utils.ts                    # Helpers, constants, cn()
│   ├── types/
│   │   └── index.ts                    # All TypeScript types
│   └── middleware.ts                   # Next.js middleware
├── scripts/
│   └── seed.js                         # Firestore seed script
├── firestore.rules                     # Security rules
├── firestore.indexes.json              # Composite indexes
├── firebase.json                       # Firebase CLI config
├── tailwind.config.js
├── tsconfig.json
├── next.config.js
└── .env.local.example                  # Environment template
```

---

## 🗄️ Database Schema

### `users` collection
```
{
  uid: string              (document ID = Firebase Auth UID)
  email: string
  displayName: string
  role: "admin" | "teacher" | "student"
  theme: "light" | "dark"
  colorTheme: "blue" | "ocean"
  createdAt: Timestamp
  updatedAt: Timestamp

  // Teacher fields
  teacherId?: string
  department?: string
  subjects?: string[]
  assignedSections?: SectionRef[]
  isTutor?: boolean
  tutorSection?: SectionRef

  // Student fields
  rollNumber?: string
  trade?: string
  semester?: number
  section?: string
  tutorId?: string
  parentEmail?: string
}
```

### `attendance` collection
```
{
  date: string             ("YYYY-MM-DD")
  subjectId: string
  subjectName: string
  teacherId: string
  trade: string
  semester: number
  section: string
  periodId: string
  markedBy: string
  markedAt: Timestamp
  students: [
    {
      studentId: string
      rollNumber: string
      studentName: string
      status: "present" | "absent" | "late"
    }
  ]
}
```

### `subjects` collection
```
{
  name: string
  code: string
  trade: string
  semester: number
  weeklyHours: number
  teacherId?: string
}
```

### `trades` collection
```
{
  name: string
  code: string
  semesters: number
}
```

### `timetables` collection
```
{
  teacherId: string        (document ID = teacher UID)
  semesterType: "odd" | "even"
  effectiveFrom: Timestamp
  schedule: [
    {
      day: "Monday" | "Tuesday" | ...
      periods: [
        {
          id: string
          startTime: string      ("HH:MM")
          endTime: string        ("HH:MM")
          subjectId: string
          subjectName: string
          trade: string
          semester: number
          section: string
          room?: string
        }
      ]
    }
  ]
}
```

### `notifications` collection
```
{
  userId: string
  type: "low_attendance" | "attendance_marked" | "system"
  title: string
  message: string
  read: boolean
  createdAt: Timestamp
}
```

---

## 🚀 Setup Instructions

### 1. Clone & Install
```bash
git clone <your-repo>
cd attendance-system
npm install
```

### 2. Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Sign-in method → **Email/Password**
4. Create **Firestore Database** (start in production mode)
5. Go to Project Settings → Your apps → Add Web App
6. Copy the config

### 3. Configure Environment
```bash
cp .env.local.example .env.local
# Edit .env.local with your Firebase config values
```

### 4. Deploy Firestore Rules & Indexes
```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
firebase deploy --only firestore
```

### 5. Seed Initial Data
```bash
# Download service account from Firebase Console → Project Settings → Service Accounts
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccount.json"
node scripts/seed.js
```

### 6. Create Admin User
1. Go to Firebase Console → Authentication → Add user
2. Enter admin email and password
3. Copy the generated UID
4. Go to Firestore → users collection → Add document with ID = `<uid>`
5. Add fields: `email`, `displayName`, `role: "admin"`, `theme: "light"`, `colorTheme: "blue"`

### 7. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

---

## 👤 User Flows

### Admin Flow
1. Login at `/admin/login`
2. Add trades (e.g. Computer Science, IT)
3. Add subjects per trade+semester
4. Share teacher credentials

### Teacher Flow
1. Sign up at `/teacher/login` (requires Teacher ID from admin)
2. Complete timetable setup at `/teacher/setup`
3. Add students via `/teacher/students`
4. Mark attendance daily via `/teacher/mark-attendance`
5. Download reports via `/teacher/reports`

### Student Flow
1. Login at `/student/login` using dropdowns
2. Roll number is the password (set by teacher on add)
3. View attendance dashboard, charts, history
4. Check timetable at `/student/timetable`

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` 14 | App Router framework |
| `firebase` 10 | Auth + Firestore |
| `chart.js` + `react-chartjs-2` | Charts |
| `tailwindcss` | Styling |
| `react-hot-toast` | Notifications |
| `jspdf` + `jspdf-autotable` | PDF export |
| `xlsx` | Excel export |
| `date-fns` | Date utilities |
| `react-icons` | Icon library |
| `clsx` + `tailwind-merge` | Class utilities |

---

## 🎨 Theme System

Themes are stored per user in Firestore and applied on login.

- **Color themes**: `blue` (default) and `ocean` — switchable via CSS custom properties
- **Mode**: `light` and `dark` — toggleable, persisted

CSS variables are defined in `globals.css` under `:root`, `.dark`, `[data-color-theme="ocean"]`.

---

## 📧 Low Attendance Alert Logic

- Threshold: **75%**
- Calculated from `getAttendanceSummaryForStudent()` in `db.ts`
- Warning shown on student dashboard
- `getLowAttendanceStudents()` provides teacher view
- Email notification: integrate with Firebase Functions + SendGrid/Resend for actual email delivery

---

## 🔐 Security

- Firestore rules enforce role-based access
- Students can only read their own data
- Teachers can read/write attendance, read students
- Admin has full access
- All writes validated server-side via rules

---

## 📱 Responsive Breakpoints

- Mobile: stacked layout, hamburger nav
- Tablet: 2-column grids
- Desktop: sidebar + multi-column dashboards
