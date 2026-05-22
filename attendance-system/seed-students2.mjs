// ─────────────────────────────────────────────────────────────────
//  SEED SCRIPT — Students (Part 2, ADDITIVE — does NOT delete existing)
//  Run after seed-students.mjs: node seed-students-2.mjs
// ─────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, deleteDoc, setDoc, doc, Timestamp } from 'firebase/firestore'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth'
import { readFileSync } from 'fs'

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

const app = initializeApp(firebaseConfig)
const db  = getFirestore(app)
const auth = getAuth(app)

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// ─── STUDENTS (remaining — starting from 1824) ────────────────────
const STUDENTS = [   
  // ── IT Section R — Sem 4 ────────────────────────────────────
  { rollNumber: '1824', displayName: 'Sandeep Kumar', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1825', displayName: 'Shivam Gupta', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1826', displayName: 'Simranjit Singh', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1827', displayName: 'Tarun Kumar', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1828', displayName: 'Uday Singh', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1829', displayName: 'Varun Sharma', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1830', displayName: 'Yash Gupta', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1831', displayName: 'Yuvraj Singh', trade: 'Information Technology', semester: 4, section: 'R' },
  { rollNumber: '1832', displayName: 'Zorawar Singh', trade: 'Information Technology', semester: 4, section: 'R' },

  // ── IT Section S — Sem 4 ────────────────────────────────────
  { rollNumber: '1851', displayName: 'Aditi Sharma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1852', displayName: 'Anjali Verma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1853', displayName: 'Amandeep Kaur', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1854', displayName: 'Bhavna Gupta', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1855', displayName: 'Charu Sharma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1856', displayName: 'Deepika Singh', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1857', displayName: 'Ekta Verma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1858', displayName: 'Garima Gupta', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1859', displayName: 'Harleen Kaur', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1860', displayName: 'Himanshi Sharma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1861', displayName: 'Ishita Jain', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1862', displayName: 'Jasleen Kaur', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1863', displayName: 'Kanika Sharma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1864', displayName: 'Komal Verma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1865', displayName: 'Lovepreet Kaur', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1866', displayName: 'Mehak Sharma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1867', displayName: 'Muskan Gupta', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1868', displayName: 'Neha Verma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1869', displayName: 'Nisha Sharma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1870', displayName: 'Palak Gupta', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1871', displayName: 'Pooja Sharma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1872', displayName: 'Priya Verma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1873', displayName: 'Radhika Sharma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1874', displayName: 'Ritu Gupta', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1875', displayName: 'Sanya Sharma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1876', displayName: 'Shreya Gupta', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1877', displayName: 'Simran Kaur', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1878', displayName: 'Sneha Sharma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1879', displayName: 'Sonam Verma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1880', displayName: 'Suhani Gupta', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1881', displayName: 'Taniya Sharma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1882', displayName: 'Tanvi Verma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1883', displayName: 'Urvashi Gupta', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1884', displayName: 'Vanshika Sharma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1885', displayName: 'Vidhi Gupta', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1886', displayName: 'Yashika Sharma', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1887', displayName: 'Zara Khan', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1888', displayName: 'Ayesha Khan', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1889', displayName: 'Hina Parveen', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1890', displayName: 'Sana Khan', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1891', displayName: 'Noor Fatima', trade: 'Information Technology', semester: 4, section: 'S' },
  { rollNumber: '1892', displayName: 'Alisha Khan', trade: 'Information Technology', semester: 4, section: 'S' },

  // ── IT Section R — Sem 2 ────────────────────────────────────
  { rollNumber: '1900', displayName: 'Amanpreet Singh', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1901', displayName: 'Simran Kaur', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1902', displayName: 'Gurpreet Singh', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1903', displayName: 'Jasleen Kaur', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1904', displayName: 'Harpreet Singh', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1905', displayName: 'Navneet Kaur', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1906', displayName: 'Manpreet Singh', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1907', displayName: 'Rupinder Kaur', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1908', displayName: 'Sandeep Singh', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1909', displayName: 'Pooja Sharma', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1910', displayName: 'Karan Kumar', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1911', displayName: 'Anjali Verma', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1912', displayName: 'Rahul Mehta', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1913', displayName: 'Neha Gupta', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1914', displayName: 'Arjun Singh', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1915', displayName: 'Priya Sharma', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1916', displayName: 'Vikas Yadav', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1917', displayName: 'Sneha Kapoor', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1918', displayName: 'Deepak Kumar', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1919', displayName: 'Ritika Jain', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1920', displayName: 'Mohit Sharma', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1921', displayName: 'Komal Verma', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1922', displayName: 'Rohit Gupta', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1923', displayName: 'Nisha Yadav', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1924', displayName: 'Amit Singh', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1925', displayName: 'Kavita Sharma', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1926', displayName: 'Sunil Kumar', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1927', displayName: 'Meena Devi', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1928', displayName: 'Rajesh Kumar', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1929', displayName: 'Seema Gupta', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1930', displayName: 'Ajay Singh', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1931', displayName: 'Rekha Sharma', trade: 'Information Technology', semester: 2, section: 'R' },
  { rollNumber: '1932', displayName: 'Vivek Kumar', trade: 'Information Technology', semester: 2, section: 'R' },

  // ── IT Section S — Sem 2 ────────────────────────────────────
  { rollNumber: '1951', displayName: 'Aditi Sharma', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1952', displayName: 'Harman Singh', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1953', displayName: 'Preeti Kaur', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1954', displayName: 'Ravi Kumar', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1955', displayName: 'Sonia Verma', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1956', displayName: 'Tarun Sharma', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1957', displayName: 'Pankaj Singh', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1958', displayName: 'Kiran Bala', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1959', displayName: 'Ankit Gupta', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1960', displayName: 'Shalini Sharma', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1961', displayName: 'Varun Mehta', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1962', displayName: 'Renu Devi', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1963', displayName: 'Gagan Deep', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1964', displayName: 'Manisha Gupta', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1965', displayName: 'Ashok Kumar', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1966', displayName: 'Rakesh Sharma', trade: 'Information Technology', semester: 2, section: 'S' },


  
]

// ─── HELPER: build email from student data ────────────────────────
function buildEmail(student) {
  const tradeSlug = student.trade.replace(/\s+/g, '').toLowerCase()
  const sectionSlug = student.section.toLowerCase()
  return `${student.rollNumber}@${tradeSlug}-s${student.semester}-${sectionSlug}.attendx.edu`
}

function buildPassword(student) {
  return `${student.rollNumber}#2026`
}

// ─── SEED FUNCTION (ADDITIVE — no delete step) ───────────────────
async function seed() {
  console.log('\n🌱 Starting student seed (part 2)...\n')

  let count = 0
  const failed = []

  for (const student of STUDENTS) {
    const email    = buildEmail(student)
    const password = buildPassword(student)
    let uid

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      uid = userCredential.user.uid
      await firebaseSignOut(auth)
    } catch (err) {
      if (err?.code === 'auth/email-already-in-use') {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password)
          uid = userCredential.user.uid
          await firebaseSignOut(auth)
        } catch (signInErr) {
          console.error(`Failed sign-in for ${student.rollNumber} (${email}):`, signInErr.message)
          failed.push(student.rollNumber)
          continue
        }
      } else {
        console.error(`Failed for ${student.rollNumber} (${email}):`, err.message)
        failed.push(student.rollNumber)
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
    await sleep(150)
  }

  console.log(`\n✅ ${count} students added successfully!`)
  if (failed.length > 0) {
    console.log(`\n⚠️  ${failed.length} students failed: ${failed.join(', ')}`)
    console.log('   Re-run the script to retry failed entries.')
  }
  console.log('\n🎉 Part 2 seed complete!\n')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
