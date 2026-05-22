
/**
 * AttendX — Firestore Seed Script
 * Run with: node scripts/seed.js
 * Requires: GOOGLE_APPLICATION_CREDENTIALS env or Firebase Admin SDK service account
 *
 * Usage:
 *   1. Download service account JSON from Firebase Console → Project Settings → Service Accounts
 *   2. Set env: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccount.json"
 *   3. Update PROJECT_ID below
 *   4. Run: node scripts/seed.js
 */

const admin = require('firebase-admin')

const PROJECT_ID = 'your-firebase-project-id' // ← UPDATE THIS

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  })
}

const db = admin.firestore()

async function seed() {
  console.log('🌱 Starting seed...')

  // ─── Trades ────────────────────────────────────────────────────────────────
  const trades = [
    { name: 'Computer Science', code: 'CS', semesters: 6 },
    { name: 'Information Technology', code: 'IT', semesters: 6 },
    { name: 'Electronics', code: 'EC', semesters: 6 },
    { name: 'Mechanical', code: 'ME', semesters: 6 },
    { name: 'Civil Engineering', code: 'CE', semesters: 6 },
    { name: 'Electrical', code: 'EE', semesters: 6 },
  ]

  for (const trade of trades) {
    await db.collection('trades').add(trade)
  }
  console.log(`✅ Added ${trades.length} trades`)

  // ─── Subjects ──────────────────────────────────────────────────────────────
  const subjects = [
    // CS Semester 1
    { name: 'Mathematics I', code: 'CS-101', trade: 'Computer Science', semester: 1, weeklyHours: 4 },
    { name: 'Physics', code: 'CS-102', trade: 'Computer Science', semester: 1, weeklyHours: 3 },
    { name: 'Programming Fundamentals', code: 'CS-103', trade: 'Computer Science', semester: 1, weeklyHours: 5 },
    { name: 'Digital Logic', code: 'CS-104', trade: 'Computer Science', semester: 1, weeklyHours: 3 },
    { name: 'Communication Skills', code: 'CS-105', trade: 'Computer Science', semester: 1, weeklyHours: 2 },
    // CS Semester 2
    { name: 'Mathematics II', code: 'CS-201', trade: 'Computer Science', semester: 2, weeklyHours: 4 },
    { name: 'Data Structures', code: 'CS-202', trade: 'Computer Science', semester: 2, weeklyHours: 5 },
    { name: 'Object Oriented Programming', code: 'CS-203', trade: 'Computer Science', semester: 2, weeklyHours: 4 },
    { name: 'Database Systems', code: 'CS-204', trade: 'Computer Science', semester: 2, weeklyHours: 4 },
    { name: 'Computer Networks', code: 'CS-205', trade: 'Computer Science', semester: 2, weeklyHours: 3 },
    // CS Semester 3
    { name: 'Algorithms', code: 'CS-301', trade: 'Computer Science', semester: 3, weeklyHours: 4 },
    { name: 'Operating Systems', code: 'CS-302', trade: 'Computer Science', semester: 3, weeklyHours: 4 },
    { name: 'Software Engineering', code: 'CS-303', trade: 'Computer Science', semester: 3, weeklyHours: 3 },
    { name: 'Web Development', code: 'CS-304', trade: 'Computer Science', semester: 3, weeklyHours: 4 },
    { name: 'Discrete Mathematics', code: 'CS-305', trade: 'Computer Science', semester: 3, weeklyHours: 3 },
    // IT Semester 1
    { name: 'IT Fundamentals', code: 'IT-101', trade: 'Information Technology', semester: 1, weeklyHours: 4 },
    { name: 'Mathematics I', code: 'IT-102', trade: 'Information Technology', semester: 1, weeklyHours: 4 },
    { name: 'Programming in C', code: 'IT-103', trade: 'Information Technology', semester: 1, weeklyHours: 5 },
    { name: 'Networking Basics', code: 'IT-104', trade: 'Information Technology', semester: 1, weeklyHours: 3 },
  ]

  for (const subject of subjects) {
    await db.collection('subjects').add(subject)
  }
  console.log(`✅ Added ${subjects.length} subjects`)

  // ─── Admin User ────────────────────────────────────────────────────────────
  // NOTE: Create auth user via Firebase Console or Firebase Auth REST API first,
  // then update the uid below.
  console.log('\n⚠️  Admin user: Create via Firebase Console Authentication tab,')
  console.log('   then add Firestore document manually:')
  console.log('   Collection: users | Document ID: <firebase-uid>')
  console.log('   Fields: { email, displayName, role: "admin", theme: "light", colorTheme: "blue" }')

  console.log('\n🎉 Seed complete!')
  console.log('\nNext steps:')
  console.log('  1. Create admin user in Firebase Authentication console')
  console.log('  2. Add admin Firestore document as described above')
  console.log('  3. Teachers can sign up via /teacher/login')
  console.log('  4. Teachers register students via /teacher/students')
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
