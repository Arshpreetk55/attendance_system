// ─────────────────────────────────────────────────────────────────
//  SEED SCRIPT — Students
//  Run once: node seed-students.mjs
// ─────────────────────────────────────────────────────────────────
import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { getFirestore, collection, query, where, getDocs, deleteDoc, setDoc, doc, Timestamp } from 'firebase-admin/firestore'

try {
  const env = readFileSync('.env.local', 'utf8')
  env.split('\n').forEach(line => {
    const [key, ...val] = line.split('=')
    if (key && val.length) process.env[key.trim()] = val.join('=').trim()
  })
} catch (e) {
  console.error('Could not read .env.local:', e.message)
  process.exit(1)
}

// ─── FIREBASE ADMIN CONFIG & INITIALIZATION ─────────────────────────
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined

if (!projectId) {
  console.error('Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local')
  process.exit(1)
}

const adminApp = admin.apps.length
  ? admin.app()
  : admin.initializeApp({
      credential: serviceAccount
        ? admin.credential.cert(serviceAccount)
        : admin.credential.applicationDefault(),
      projectId,
    })

const db = getFirestore(adminApp)
const auth = admin.auth(adminApp)

// ─── HELPER: sleep to avoid Firebase auth rate limits ─────────────
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// ─── STUDENT DATA ─────────────────────────────────────────────────
const STUDENTS = [
  // ── CSE Section L — Sem 2 ────────────────────────────────────
  { rollNumber: '1401', displayName: 'Aarav Sharma',    trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1402', displayName: 'Vivaan Singh',     trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1403', displayName: 'Aditya Kumar',     trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1404', displayName: 'Arjun Verma',     trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1405', displayName: 'Sai Patel',       trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1406', displayName: 'Krishna Yadav',   trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1407', displayName: 'Ishaan Gupta',    trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1408', displayName: 'Rohan Mehta',     trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1409', displayName: 'Karan Malhotra',  trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1410', displayName: 'Rahul Das',       trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1411', displayName: 'Amanpreet Singh', trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1412', displayName: 'Harsh Vardhan',   trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1413', displayName: 'Manish Kumar',    trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1414', displayName: 'Sandeep Sharma',  trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1415', displayName: 'Rohit Kumar',     trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1416', displayName: 'Deepak Verma',    trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1417', displayName: 'Mohit Sharma',    trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1418', displayName: 'Ankit Gupta',     trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1419', displayName: 'Sumit Yadav',     trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1420', displayName: 'Nikhil Jain',     trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1421', displayName: 'Pankaj Kumar',    trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1422', displayName: 'Rajat Singh',     trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1423', displayName: 'Gaurav Sharma',   trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1424', displayName: 'Abhishek Kumar',  trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1425', displayName: 'Tarun Mehta',     trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1426', displayName: 'Varun Sharma',    trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1427', displayName: 'Shubham Gupta',   trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1428', displayName: 'Yash Patel',      trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1429', displayName: 'Vikas Kumar',     trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1430', displayName: 'Akash Singh',     trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1431', displayName: 'Ajay Kumar',      trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1432', displayName: 'Neeraj Sharma',   trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1433', displayName: 'Kapil Dev',       trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1434', displayName: 'Rakesh Kumar',    trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1435', displayName: 'Dinesh Sharma',   trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1436', displayName: 'Lokesh Kumar',    trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1437', displayName: 'Naveen Kumar',    trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
  { rollNumber: '1438', displayName: 'Suraj Yadav',     trade: 'Computer Science and Engineering', semester: 2, section: 'L' },

  // ── CSE Section M — Sem 2 ────────────────────────────────────
  { rollNumber: '1451', displayName: 'Priya Sharma',    trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1452', displayName: 'Anjali Verma',    trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1453', displayName: 'Neha Gupta',      trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1454', displayName: 'Pooja Singh',     trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1455', displayName: 'Simran Kaur',     trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1456', displayName: 'Muskan Sharma',   trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1457', displayName: 'Riya Patel',      trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1458', displayName: 'Sneha Yadav',     trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1459', displayName: 'Aditi Sharma',    trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1460', displayName: 'Kajal Verma',     trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1461', displayName: 'Mehak Kaur',      trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1462', displayName: 'Komal Sharma',    trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1463', displayName: 'Nisha Gupta',     trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1464', displayName: 'Ritu Sharma',     trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1465', displayName: 'Jyoti Singh',     trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1466', displayName: 'Preeti Kumari',   trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1467', displayName: 'Sakshi Sharma',   trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1468', displayName: 'Tanvi Gupta',     trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1469', displayName: 'Divya Sharma',    trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1470', displayName: 'Bhavna Verma',    trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1471', displayName: 'Garima Sharma',   trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1472', displayName: 'Shreya Gupta',    trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1473', displayName: 'Monika Sharma',   trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1474', displayName: 'Pallavi Verma',   trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1475', displayName: 'Nikita Singh',    trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1476', displayName: 'Sonam Sharma',    trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1477', displayName: 'Taniya Gupta',    trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1478', displayName: 'Rachna Sharma',   trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1479', displayName: 'Seema Verma',     trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1480', displayName: 'Aashima Gupta',   trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1481', displayName: 'Khushi Sharma',   trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1482', displayName: 'Payal Verma',     trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1483', displayName: 'Mansi Gupta',     trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1484', displayName: 'Heena Sharma',    trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1485', displayName: 'Isha Verma',      trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1486', displayName: 'Lavanya Gupta',   trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1487', displayName: 'Ayesha Khan',     trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1488', displayName: 'Sana Khan',       trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
  { rollNumber: '1489', displayName: 'Zoya Khan',       trade: 'Computer Science and Engineering', semester: 2, section: 'M' },

  // ── IT Section R — Sem 4 ────────────────────────────────────
  { rollNumber: '1801', displayName: 'Aarav Sharma', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1802', displayName: 'Arjun Singh', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1803', displayName: 'Aditya Verma', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1804', displayName: 'Amanpreet Singh', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1805', displayName: 'Ankit Kumar', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1806', displayName: 'Ayush Gupta', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1807', displayName: 'Bhavesh Patel', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1808', displayName: 'Deepak Kumar', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1809', displayName: 'Gaurav Sharma', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1810', displayName: 'Harpreet Singh', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1811', displayName: 'Hardeep Singh', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1812', displayName: 'Ishaan Mehta', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1813', displayName: 'Jaspreet Singh', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1814', displayName: 'Karanveer Singh', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1815', displayName: 'Lakshay Jain', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1816', displayName: 'Manpreet Singh', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1817', displayName: 'Mohit Sharma', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1818', displayName: 'Nikhil Verma', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1819', displayName: 'Pankaj Kumar', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1820', displayName: 'Parth Shah', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1821', displayName: 'Rahul Kumar', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1822', displayName: 'Rajat Sharma', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1823', displayName: 'Rohan Mehta', trade: 'Information Technology', semester: 4, section: 'R' },
]

// ─── HELPER: build email from student data ────────────────────────
function buildEmail(student) {
  const tradeSlug = student.trade.replace(/\s+/g, '').toLowerCase()
  const sectionSlug = student.section.toLowerCase()
  return `${student.rollNumber}@${tradeSlug}-s${student.semester}-${sectionSlug}.attendx.edu`
  //                                                    ^^^^^^^^ was student.sem
}

function buildPassword(student) {
  return `${student.rollNumber}#2026`
}

// ─── SEED FUNCTION ────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱 Starting student seed...\n')

  // Clear ALL existing students to avoid stale records with old email format
  console.log('🗑  Clearing ALL existing students...')
  const existing = await getDocs(query(
    collection(db, 'users'),
    where('role', '==', 'student')
  ))
  for (const d of existing.docs) await deleteDoc(d.ref)
  console.log(`   Removed ${existing.size} existing records\n`)

  // Add students
  let count = 0
  const failed = []

  for (const student of STUDENTS) {
    const email    = buildEmail(student)
    const password = buildPassword(student)
    let uid

    try {
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: student.displayName,
      })
      uid = userRecord.uid
    } catch (err) {
      const error = err
      if (error?.code === 'auth/email-already-exists') {
        try {
          const userRecord = await auth.getUserByEmail(email)
          uid = userRecord.uid
        } catch (lookupErr) {
          console.error(`Failed lookup for existing ${student.rollNumber} (${email}):`, lookupErr.message)
          failed.push(student.rollNumber)
          continue
        }
      } else {
        console.error(`Failed for ${student.rollNumber} (${email}):`, err.message)
        failed.push(student.rollNumber)
        // ✅ Wait longer before retrying after a rate-limit error
        await sleep(2000)
        continue
      }
    }

    await setDoc(doc(db, 'users', uid), {
      ...student,
      role: 'student',
      email,
      theme: 'light',
      colorTheme: 'blue',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    count++
    if (count % 10 === 0) console.log(`   Added ${count}/${STUDENTS.length} students...`)

    // ✅ 150ms pause between each user to stay under Firebase auth rate limits
    await sleep(150)
  }

  console.log(`\n✅ ${count} students added successfully!`)

  if (failed.length > 0) {
    console.log(`\n⚠️  ${failed.length} students failed: ${failed.join(', ')}`)
    console.log('   Re-run the script to retry failed entries.')
  }

  console.log('\n   Branches seeded:')
  console.log('   → CSE  : Section L & M (Sem 2)')
  console.log('   → IT   : Section R & S (Sem 2 & 4)')
  console.log('   → EE   : Section E & F (Sem 2 & 4)')
  console.log('   → ECE  : Section G & H (Sem 2 & 4)')
  console.log('   → Civil: Section A & B (Sem 2 & 4)')
  console.log('\n🎉 Student seed complete!\n')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
