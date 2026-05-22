// ─────────────────────────────────────────────────────────────────
   //  SEED SCRIPT — Students (Part 11, ADDITIVE — does NOT delete existing)
   //  Run after seed-students10.mjs: node seed-students-11.mjs
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
   
   // ─── STUDENTS (remaining — starting from [1439-1440],[1490-1492]) ────────────────────
   const STUDENTS = [   

// ── CSE Section L — Sem 2 (1439-1440) ─────────────────────────────────────
{ rollNumber: '1439', displayName: 'Aman Kumar', trade: 'Computer Science and Engineering', semester: 2, section: 'L' },
{ rollNumber: '1440', displayName: 'Priya Sharma', trade: 'Computer Science and Engineering', semester: 2, section: 'L' },



// ── CSE Section M — Sem 2 (1490-1492) ────────────────────────────────────
{ rollNumber: '1490', displayName: 'Rahul Verma', trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
{ rollNumber: '1491', displayName: 'Sneha Gupta', trade: 'Computer Science and Engineering', semester: 2, section: 'M' },
{ rollNumber: '1492', displayName: 'Vikram Singh', trade: 'Computer Science and Engineering', semester: 2, section: 'M' },



// ── IT Section R — Sem 4 (1833-1840) ─────────────────────────────────────
{ rollNumber: '1833', displayName: 'Anjali Sharma', trade: 'Information Technology', semester: 4, section: 'R' },
{ rollNumber: '1834', displayName: 'Rohit Kumar', trade: 'Information Technology', semester: 4, section: 'R' },
{ rollNumber: '1835', displayName: 'Pooja Verma', trade: 'Information Technology', semester: 4, section: 'R' },
{ rollNumber: '1836', displayName: 'Amit Singh', trade: 'Information Technology', semester: 4, section: 'R' },
{ rollNumber: '1837', displayName: 'Neha Gupta', trade: 'Information Technology', semester: 4, section: 'R' },
{ rollNumber: '1838', displayName: 'Suresh Kumar', trade: 'Information Technology', semester: 4, section: 'R' },
{ rollNumber: '1839', displayName: 'Priya Sharma', trade: 'Information Technology', semester: 4, section: 'R' },
{ rollNumber: '1840', displayName: 'Rahul Verma', trade: 'Information Technology', semester: 4, section: 'R' },



// ── IT Section R — Sem 2 (1933-1940) ─────────────────────────────────────
{ rollNumber: '1933', displayName: 'Anjali Sharma', trade: 'Information Technology', semester: 2, section: 'R' },
{ rollNumber: '1934', displayName: 'Rohit Kumar', trade: 'Information Technology', semester: 2, section: 'R' },
{ rollNumber: '1935', displayName: 'Pooja Verma', trade: 'Information Technology', semester: 2, section: 'R' },
{ rollNumber: '1936', displayName: 'Amit Singh', trade: 'Information Technology', semester: 2, section: 'R' },
{ rollNumber: '1937', displayName: 'Neha Gupta', trade: 'Information Technology', semester: 2, section: 'R' },
{ rollNumber: '1938', displayName: 'Suresh Kumar', trade: 'Information Technology', semester: 2, section: 'R' },
{ rollNumber: '1939', displayName: 'Priya Sharma', trade: 'Information Technology', semester: 2, section: 'R' },
{ rollNumber: '1940', displayName: 'Rahul Verma', trade: 'Information Technology', semester: 2, section: 'R' },



// ── CIVIL Section A — Sem 2 (33-40) ───────────────────────────────────── 
{ rollNumber: '33', displayName: 'Suresh Singh', trade: 'Civil Engineering', semester: 2, section: 'A' },
{ rollNumber: '34', displayName: 'Pooja Verma', trade: 'Civil Engineering', semester: 2, section: 'A' },
{ rollNumber: '35', displayName: 'Rahul Sharma', trade: 'Civil Engineering', semester: 2, section: 'A' },
{ rollNumber: '36', displayName: 'Anjali Gupta', trade: 'Civil Engineering', semester: 2, section: 'A' },
{ rollNumber: '37', displayName: 'Amit Kumar', trade: 'Civil Engineering', semester: 2, section: 'A' },
{ rollNumber: '38', displayName: 'Neha Singh', trade: 'Civil Engineering', semester: 2, section: 'A' },
{ rollNumber: '39', displayName: 'Vikram Verma', trade: 'Civil Engineering', semester: 2, section: 'A' },
{ rollNumber: '40', displayName: 'Priya Sharma', trade: 'Civil Engineering', semester: 2, section: 'A' },



// ── CIVIL Section B — Sem 2 (91-92) ───────────────────────────────────── 
{ rollNumber: '91', displayName: 'Suresh Singh', trade: 'Civil Engineering', semester: 2, section: 'B' },
{ rollNumber: '92', displayName: 'Pooja Verma', trade: 'Civil Engineering', semester: 2, section: 'B' },



// ── CIVIL Section A — Sem 4 (335-340) ────────────────────────────────────  
{ rollNumber: '335', displayName: 'Aman Sharma', trade: 'Civil Engineering', semester: 4, section: 'A' },
{ rollNumber: '336', displayName: 'Priya Verma', trade: 'Civil Engineering', semester: 4, section: 'A' },
{ rollNumber: '337', displayName: 'Rahul Kumar', trade: 'Civil Engineering', semester: 4, section: 'A' },
{ rollNumber: '338', displayName: 'Anjali Gupta', trade: 'Civil Engineering', semester: 4, section: 'A' },
{ rollNumber: '339', displayName: 'Amit Singh', trade: 'Civil Engineering', semester: 4, section: 'A' },
{ rollNumber: '340', displayName: 'Neha Verma', trade: 'Civil Engineering', semester: 4, section: 'A' },



// ── CIVIL Section B — Sem 4 (391-392) ────────────────────────────────────  
{ rollNumber: '391', displayName: 'Aman Sharma', trade: 'Civil Engineering', semester: 4, section: 'B' },
{ rollNumber: '392', displayName: 'Priya Verma', trade: 'Civil Engineering', semester: 4, section: 'B' },



// ── MECHANICAL Section C — Sem 2 (131-140) ────────────────────────────────────
{ rollNumber: '131', displayName: 'Vikram Singh', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
{ rollNumber: '132', displayName: 'Neha Gupta', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
{ rollNumber: '133', displayName: 'Suresh Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
{ rollNumber: '134', displayName: 'Priya Sharma', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
{ rollNumber: '135', displayName: 'Rahul Verma', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
{ rollNumber: '136', displayName: 'Aman Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
{ rollNumber: '137', displayName: 'Pooja Verma', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
{ rollNumber: '138', displayName: 'Rohit Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
{ rollNumber: '139', displayName: 'Anjali Sharma', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
{ rollNumber: '140', displayName: 'Amit Singh', trade: 'Mechanical Engineering', semester: 2, section: 'C' },



// ── MECHANICAL Section D — Sem 2 (191-192) ─────────────────────────────────────
{ rollNumber: '191', displayName: 'Vikram Singh', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
{ rollNumber: '192', displayName: 'Neha Gupta', trade: 'Mechanical Engineering', semester: 2, section: 'D' },



// ── MECHANICAL Section C — Sem 4 (435-440) ─────────────────────────────────────
{ rollNumber: '435', displayName: 'Vikram Singh', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
{ rollNumber: '436', displayName: 'Neha Gupta', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
{ rollNumber: '437', displayName: 'Suresh Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
{ rollNumber: '438', displayName: 'Priya Sharma', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
{ rollNumber: '439', displayName: 'Rahul Verma', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
{ rollNumber: '440', displayName: 'Aman Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'C' },



// ── MECHANICAL Section D — Sem 4 (491-492) ────────────────────────────────────
{ rollNumber: '491', displayName: 'Vikram Singh', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
{ rollNumber: '492', displayName: 'Neha Gupta', trade: 'Mechanical Engineering', semester: 4, section: 'D' },



// ── Electronics Section G — Sem 2 (1133-1140) ─────────────────────────
{ rollNumber: '1133', displayName: 'Neha Gupta', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
{ rollNumber: '1134', displayName: 'Suresh Kumar', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
{ rollNumber: '1135', displayName: 'Priya Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' }, 
{ rollNumber: '1136', displayName: 'Rahul Verma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
{ rollNumber: '1137', displayName: 'Aman Kumar', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
{ rollNumber: '1138', displayName: 'Pooja Verma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
{ rollNumber: '1139', displayName: 'Rohit Kumar', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
{ rollNumber: '1140', displayName: 'Anjali Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },



// ── Electronics Section H — Sem 2 (1191-1192) ─────────────────────────
{ rollNumber: '1191', displayName: 'Neha Gupta', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
{ rollNumber: '1192', displayName: 'Suresh Kumar', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },



// ── Electronics Section G — Sem 4 (1333-1340) ─────────────────────────
{ rollNumber: '1333', displayName: 'Neha Gupta', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
{ rollNumber: '1334', displayName: 'Suresh Kumar', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
{ rollNumber: '1335', displayName: 'Priya Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
{ rollNumber: '1336', displayName: 'Rahul Verma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
{ rollNumber: '1337', displayName: 'Aman Kumar', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
{ rollNumber: '1338', displayName: 'Pooja Verma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
{ rollNumber: '1339', displayName: 'Rohit Kumar', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
{ rollNumber: '1340', displayName: 'Anjali Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },



// ── Electrical Section E — Sem 2 (231-240) ────────────────────────────────────
{ rollNumber: '231', displayName: 'Amit Singh', trade: 'Electrical Engineering', semester: 2, section: 'E' },
{ rollNumber: '232', displayName: 'Neha Gupta', trade: 'Electrical Engineering', semester: 2, section: 'E' },
{ rollNumber: '233', displayName: 'Suresh Kumar', trade: 'Electrical Engineering', semester: 2, section: 'E' },
{ rollNumber: '234', displayName: 'Priya Sharma', trade: 'Electrical Engineering', semester: 2, section: 'E' },
{ rollNumber: '235', displayName: 'Rahul Verma', trade: 'Electrical Engineering', semester: 2, section: 'E' },
{ rollNumber: '236', displayName: 'Aman Kumar', trade: 'Electrical Engineering', semester: 2, section: 'E' },
{ rollNumber: '237', displayName: 'Pooja Verma', trade: 'Electrical Engineering', semester: 2, section: 'E' },
{ rollNumber: '238', displayName: 'Rohit Kumar', trade: 'Electrical Engineering', semester: 2, section: 'E' },
{ rollNumber: '239', displayName: 'Anjali Sharma', trade: 'Electrical Engineering', semester: 2, section: 'E' },
{ rollNumber: '240', displayName: 'Sneha Gupta', trade: 'Electrical Engineering', semester: 2, section: 'E' },



// ── Electrical Section E — Sem 4 (531-540) ────────────────────────────────────
{ rollNumber: '531', displayName: 'Amit Singh', trade: 'Electrical Engineering', semester: 4, section: 'E' },
{ rollNumber: '532', displayName: 'Neha Gupta', trade: 'Electrical Engineering', semester: 4, section: 'E' },
{ rollNumber: '533', displayName: 'Suresh Kumar', trade: 'Electrical Engineering', semester: 4, section: 'E' },
{ rollNumber: '534', displayName: 'Priya Sharma', trade: 'Electrical Engineering', semester: 4, section: 'E' },
{ rollNumber: '535', displayName: 'Rahul Verma', trade: 'Electrical Engineering', semester: 4, section: 'E' },
{ rollNumber: '536', displayName: 'Aman Kumar', trade: 'Electrical Engineering', semester: 4, section: 'E' },
{ rollNumber: '537', displayName: 'Pooja Verma', trade: 'Electrical Engineering', semester: 4, section: 'E' },
{ rollNumber: '538', displayName: 'Rohit Kumar', trade: 'Electrical Engineering', semester: 4, section: 'E' },
{ rollNumber: '539', displayName: 'Anjali Sharma', trade: 'Electrical Engineering', semester: 4, section: 'E' },
{ rollNumber: '540', displayName: 'Sneha Gupta', trade: 'Electrical Engineering', semester: 4, section: 'E' },


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
                console.log('\n🌱 Starting student seed (part 11)...\n')
              
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
                console.log('\n🎉 Part 11 seed complete!\n')
                process.exit(0)
              }
              
              seed().catch(err => {
                console.error('❌ Seed failed:', err)
                process.exit(1)
              })