// ─────────────────────────────────────────────────────────────────────────────
//  SEED SCRIPT — All Departments, Admins & Teachers (Full Reset)
//  Run: node seed-teachers-new.mjs
//  This DELETES all existing teacher/admin users then re-creates them.
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app'
import {
  getFirestore, collection, getDocs, deleteDoc, doc,
  setDoc, Timestamp, query, where,
} from 'firebase/firestore'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { readFileSync } from 'fs'

// ── Load .env.local ──────────────────────────────────────────────────────────
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

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app  = initializeApp(firebaseConfig)
const db   = getFirestore(app)
const auth = getAuth(app)

// ── Credential helper ────────────────────────────────────────────────────────
// email: firstname.dept@gndpc.edu  (lowercase, no spaces)
// password: Name@123  (first real name-word, capitalised + @123)
// teacherId: first two words of the original name
function normalizeName(fullName) {
  return fullName
    .trim()
    .replace(/^(?:sh|dr|mr|ms|mrs|smt)\.?(?=\s+)/i, '')
}

function makeCredentials(fullName, deptCode, usedEmails = new Set()) {
  const originalParts = fullName.trim().split(/\s+/)
  const cleanName = normalizeName(fullName)
  const parts = cleanName.trim().split(/\s+/).filter(Boolean)
  const first = parts[0].replace(/[^a-zA-Z0-9]/g, '')

  const baseEmail = `${first.toLowerCase()}.${deptCode.toLowerCase()}@gndpc.edu`
  const basePassword = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() + '@123'

  if (!usedEmails.has(baseEmail)) {
    usedEmails.add(baseEmail)
    return { email: baseEmail, password: basePassword, teacherId: originalParts.slice(0, 2).join(' ') }
  }

  const fallbackStem = parts
    .slice(0, Math.min(parts.length, 3))
    .map(part => part.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
    .join('')

  let email = `${fallbackStem}.${deptCode.toLowerCase()}@gndpc.edu`
  let password = `${fallbackStem.charAt(0).toUpperCase()}${fallbackStem.slice(1)}@123`
  let suffix = 2

  while (usedEmails.has(email)) {
    email = `${fallbackStem}${suffix}.${deptCode.toLowerCase()}@gndpc.edu`
    password = `${fallbackStem.charAt(0).toUpperCase()}${fallbackStem.slice(1)}${suffix}@123`
    suffix += 1
  }

  usedEmails.add(email)

  return { email, password, teacherId: originalParts.slice(0, 2).join(' ') }
}

// ── Department definitions ───────────────────────────────────────────────────
// role: 'admin' for dept head (also teaches), 'teacher' for rest
const DEPARTMENTS = [
  {
    name: 'Mechanical Engineering',
    code: 'ME',
    sections: ['C', 'D'],
    staff: [
      { name: 'Sh. Gurmeet Singh',      role: 'admin'   },
      { name: 'Tajinder Kaur',           role: 'teacher' },
      { name: 'Maninder Singh',          role: 'teacher' },
      { name: 'Davinder Singh',          role: 'teacher' },
      { name: 'Amandeep Pal',            role: 'teacher' },
      { name: 'Gurtej Singh',            role: 'teacher' },
    ],
  },
  {
    name: 'Civil Engineering',
    code: 'CE',
    sections: ['A', 'B'],
    staff: [
      { name: 'Sarabjit Kaur',           role: 'admin'   },
      { name: 'Gurcharan Singh Tohra',   role: 'teacher' },
      { name: 'Jagdishpreet Singh',      role: 'teacher' },
      { name: 'Shabaj Singh',            role: 'teacher' },
      { name: 'Bhramjot Singh',          role: 'teacher' },
      { name: 'Kulraj Singh',            role: 'teacher' },
      { name: 'Sandeep Kaur',            role: 'teacher' },
      { name: 'Jasjit Singh',            role: 'teacher' },
    ],
  },
  {
    name: 'Electrical Engineering',
    code: 'EE',
    sections: ['E', 'F'],
    staff: [
      { name: 'Ramneek Kaur',            role: 'admin'   },
      { name: 'Gurinder Kaur',           role: 'teacher' },
      { name: 'Mandeep Kaur',            role: 'teacher' },
      { name: 'Chamanjeet Kaur',         role: 'teacher' },
      { name: 'Surinder Pal',            role: 'teacher' },
    ],
  },
  {
    name: 'Automobile Engineering',
    code: 'AE',
    sections: ['J', 'K'],
    staff: [
      { name: 'Prabhpreet Singh',        role: 'admin'   },
      { name: 'Amanjot Singh',           role: 'teacher' },
      { name: 'Amandeep Singh Ruppal',   role: 'teacher' },
      { name: 'Pushpinder Singh',        role: 'teacher' },
      { name: 'Ramandeep Singh',         role: 'teacher' },
      { name: 'LE1 AE',                  role: 'teacher' },
      { name: 'Sandeep Singh',           role: 'teacher' },
      { name: 'Superintendent Workshop', role: 'teacher' },
    ],
  },
  {
    name: 'Applied Science',
    code: 'AS',
    sections: ['X', 'Y'],   // shared / common dept
    staff: [
      { name: 'Charanjeet Kaur',         role: 'admin'   },
      { name: 'Sarabjot Kaur',           role: 'teacher' },
      { name: 'Jaspal Singh',            role: 'teacher' },
      { name: 'Rupinder Kaur',           role: 'teacher' },
      { name: 'Tajinder Pal Singh',      role: 'teacher' },
      { name: 'Gurpreet Singh',          role: 'teacher' },
      { name: 'Priyanshi Sharma',        role: 'teacher' },
      { name: 'Kiranjeet Kaur',          role: 'teacher' },
    ],
  },
  {
    name: 'Electronics and Communication Engineering',
    code: 'ECE',
    sections: ['G', 'H'],
    staff: [
      { name: 'Satnam Singh',            role: 'admin'   },
      { name: 'Parampal Singh',          role: 'teacher' },
      { name: 'Chatar Pratap Singh',     role: 'teacher' },
      { name: 'Harjit Singh',            role: 'teacher' },
      { name: 'LE1 ECE',                 role: 'teacher' },
      { name: 'LE2 ECE',                 role: 'teacher' },
    ],
  },
  {
    name: 'Computer Science and Engineering',
    code: 'CSE' ,
    sections: ['L', 'M'] ,
    staff: [
      { name: 'Hardeep Singh Jawanda',   role: 'admin'   },
      { name: 'Sanjeev Kumar',           role: 'teacher' },
      { name: 'Aman Bhardwaj',           role: 'teacher' },
      { name: 'Sonia Chawla',            role: 'teacher' },
      { name: 'Harpreet Kaur',           role: 'teacher' },
      { name: 'Harpreet Kaur Sharma',    role: 'teacher' },
      { name: 'Prabhjot Kaur',           role: 'teacher' },
      { name: 'Jaspreet Kaur',           role: 'teacher' },
      { name: 'Mehakpreet Singh',        role: 'teacher' },
    ],
  },
  {
    name: 'Information Technology',
    code:'IT',
    sections: ['R', 'S'],
    staff: [
      { name: 'Hardeep Singh Jawanda',   role: 'admin'   },
      { name: 'Sanjeev Kumar',           role: 'teacher' },
      { name: 'Aman Bhardwaj',           role: 'teacher' },
      { name: 'Sonia Chawla',            role: 'teacher' },
      { name: 'Harpreet Kaur',           role: 'teacher' },
      { name: 'Harpreet Kaur Sharma',    role: 'teacher' },
      { name: 'Prabhjot Kaur',           role: 'teacher' },
      { name: 'Jaspreet Kaur',           role: 'teacher' },
      { name: 'Mehakpreet Singh',        role: 'teacher' },
    ],
  },
]

// ── Delete all existing teacher/admin users from Firestore ───────────────────
async function deleteExistingStaff() {
  console.log('\n🗑️  Deleting existing teacher/admin Firestore docs...')
  const roles = ['teacher', 'admin']
  let deleted = 0
  for (const role of roles) {
    const q = query(collection(db, 'users'), where('role', '==', role))
    const snap = await getDocs(q)
    for (const d of snap.docs) {
      await deleteDoc(doc(db, 'users', d.id))
      // Also delete timetable if exists
      await deleteDoc(doc(db, 'timetables', d.id)).catch(() => {})
      deleted++
    }
  }
  console.log(`   Deleted ${deleted} staff docs`)
}

// ── Create one user ───────────────────────────────────────────────────────────
async function createStaffMember(person, dept, usedEmails) {
  const creds = makeCredentials(person.name, dept.code, usedEmails)

  // Try creating Firebase Auth user
  let uid
  try {
    const { user } = await createUserWithEmailAndPassword(auth, creds.email, creds.password)
    uid = user.uid
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      // Sign in to get UID
      try {
        const { user } = await signInWithEmailAndPassword(auth, creds.email, creds.password)
        uid = user.uid
        console.log(`   ↩  Reusing existing auth: ${creds.email}`)
      } catch {
        console.warn(`   ⚠ Could not sign in ${creds.email}, skipping`)
        return null
      }
    } else {
      console.error(`   ✗ Auth error for ${person.name}:`, err.message)
      return null
    }
  }

  // Save Firestore user doc
  await setDoc(doc(db, 'users', uid), {
    email:           creds.email,
    displayName:     person.name,
    role:            person.role,          // 'admin' or 'teacher'
    teacherId:       creds.teacherId,
    department:      dept.name,
    departmentCode:  dept.code,
    subjects:        [],
    assignedSections: [],
    theme:           'light',
    colorTheme:      'blue',
    isFirstLogin:    false,
    showProfileSetup: false,
    createdAt:       Timestamp.now(),
    updatedAt:       Timestamp.now(),
  })

  return { uid, ...creds, name: person.name, role: person.role, dept: dept.name }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting full staff seed...\n')

  await deleteExistingStaff()

  const allCredentials = []
  const seenEmails = new Set()  // CSE+IT share staff — avoid duplicate auth
  const usedEmailsByDept = new Map()

  for (const dept of DEPARTMENTS) {
    console.log(`\n📂 ${dept.name} (${dept.code})`)

    for (const person of dept.staff) {
      const creds = makeCredentials(person.name, dept.code)

      // For IT dept, CSE+IT share exact same staff with same emails (use CSE code)
      // So IT admin/teachers already created under CSE — just link them
      if (dept.sharedWith && seenEmails.has(creds.email)) {
        console.log(`   ↩  Shared staff already created: ${person.name}`)
        continue
      }

      const deptEmails = usedEmailsByDept.get(dept.code) || new Set()
      usedEmailsByDept.set(dept.code, deptEmails)

      process.stdout.write(`   ${person.role === 'admin' ? '👑' : '👤'} ${person.name}... `)
      const result = await createStaffMember(person, dept, deptEmails)
      if (result) {
        seenEmails.add(creds.email)
        allCredentials.push(result)
        console.log(`✅  ${result.email} / ${result.password}`)
      }
    }
  }

  // ── Print credentials table ────────────────────────────────────────────────
  console.log('\n\n' + '═'.repeat(100))
  console.log('📋  COMPLETE CREDENTIALS TABLE')
  console.log('═'.repeat(100))

  const deptGroups = {}
  for (const c of allCredentials) {
    if (!deptGroups[c.dept]) deptGroups[c.dept] = []
    deptGroups[c.dept].push(c)
  }

  for (const [dept, staff] of Object.entries(deptGroups)) {
    console.log(`\n🏫  ${dept}`)
    console.log('─'.repeat(90))
    console.log(`  ${'ROLE'.padEnd(10)} ${'NAME'.padEnd(28)} ${'EMAIL'.padEnd(35)} ${'PASSWORD'.padEnd(18)} TEACHER-ID`)
    console.log('─'.repeat(90))
    for (const s of staff) {
      const role = s.role === 'admin' ? 'ADMIN' : 'teacher'
      console.log(`  ${role.padEnd(10)} ${s.name.padEnd(28)} ${s.email.padEnd(35)} ${s.password.padEnd(18)} ${s.teacherId}`)
    }
  }

  console.log('\n\n' + '═'.repeat(100))
  console.log('✅  Seed complete! All staff created.')
  console.log('═'.repeat(100))
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
