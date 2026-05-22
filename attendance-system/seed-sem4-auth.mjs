
// ─────────────────────────────────────────────────────────────────
//  SEED SCRIPT — Auth for existing sem 4 students
//  Run once: node seed-sem4-auth.mjs
// ─────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, setDoc, doc, Timestamp } from 'firebase/firestore'
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

async function seedSem4Auth() {
  console.log('\n🌱 Seeding auth for sem 4 students...\n')

  const sem4Students = await getDocs(query(
    collection(db, 'users'),
    where('role', '==', 'student'),
    where('semester', '==', 4)
  ))

  console.log(`Found ${sem4Students.size} sem 4 students in Firestore`)

  let count = 0
  for (const docSnap of sem4Students.docs) {
    const student = docSnap.data()
    const rollNumber = student.rollNumber
    const email = `${rollNumber}@student.edu`
    const password = `${rollNumber}#2026`

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid
      await firebaseSignOut(auth)

      // Copy ALL student data to the new UID and update email
      await setDoc(doc(db, 'users', uid), {
        ...student,
        email,
        uid,
      })
      console.log(`Created auth for ${rollNumber}`)
      count++
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        console.log(`Auth already exists for ${rollNumber}`)
        count++
      } else {
        console.error(`Failed for ${rollNumber}:`, err.message)
      }
    }

    // Delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log(`\n✅ Processed ${count} sem 4 students`)
  process.exit(0)
}

seedSem4Auth().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})

