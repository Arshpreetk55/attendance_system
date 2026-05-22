// ─────────────────────────────────────────────────────────────────
   //  SEED SCRIPT — Students (Part 10, ADDITIVE — does NOT delete existing)
   //  Run after seed-students.mjs: node seed-students-10.mjs
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
   
   // ─── STUDENTS (remaining — starting from 1970) ────────────────────
   const STUDENTS = [   



// ── Computer Science Section L — Sem 4 (1201–1230) ─────────────────────────
{ rollNumber: '1201', displayName: 'Sarita Devi', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1202', displayName: 'Aman Kumar', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1203', displayName: 'Priya Sharma', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1204', displayName: 'Rahul Verma', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1205', displayName: 'Neha Kumari', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1206', displayName: 'Karan Singh', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1207', displayName: 'Pooja Rani', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1208', displayName: 'Rohit Kumar', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1209', displayName: 'Simran Kaur', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1210', displayName: 'Vikas Yadav', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1211', displayName: 'Anjali Devi', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1212', displayName: 'Deepak Kumar', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1213', displayName: 'Muskan Sharma', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1214', displayName: 'Arjun Singh', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1215', displayName: 'Ritika Verma', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1216', displayName: 'Sahil Kumar', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1217', displayName: 'Komal Rani', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1218', displayName: 'Nitin Sharma', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1219', displayName: 'Preeti Kumari', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1220', displayName: 'Mohit Verma', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1221', displayName: 'Kajal Devi', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1222', displayName: 'Ajay Kumar', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1223', displayName: 'Sneha Sharma', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1224', displayName: 'Manish Singh', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1225', displayName: 'Nisha Kumari', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1226', displayName: 'Harsh Kumar', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1227', displayName: 'Payal Rani', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1228', displayName: 'Yash Verma', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1229', displayName: 'Tanya Sharma', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1230', displayName: 'Gaurav Singh', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1231', displayName: 'Suman Devi', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1232', displayName: 'Rohit Kumar', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1233', displayName: 'Simran Kaur', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
{ rollNumber: '1234', displayName: 'Aman Verma', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },

// ── Computer Science Section M — Sem 4 (1251–1280) ─────────────────────────
{ rollNumber: '1251', displayName: 'Sarita Devi', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1252', displayName: 'Aman Kumar', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1253', displayName: 'Priya Sharma', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1254', displayName: 'Rahul Verma', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1255', displayName: 'Neha Kumari', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1256', displayName: 'Karan Singh', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1257', displayName: 'Pooja Rani', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1258', displayName: 'Rohit Kumar', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1259', displayName: 'Simran Kaur', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1260', displayName: 'Vikas Yadav', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1261', displayName: 'Anjali Devi', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1262', displayName: 'Deepak Kumar', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1263', displayName: 'Muskan Sharma', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1264', displayName: 'Arjun Singh', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1265', displayName: 'Ritika Verma', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1266', displayName: 'Sahil Kumar', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1267', displayName: 'Komal Rani', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1268', displayName: 'Nitin Sharma', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1269', displayName: 'Preeti Kumari', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1270', displayName: 'Mohit Verma', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1271', displayName: 'Kajal Devi', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1272', displayName: 'Ajay Kumar', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1273', displayName: 'Sneha Sharma', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1274', displayName: 'Manish Singh', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1275', displayName: 'Nisha Kumari', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1276', displayName: 'Harsh Kumar', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1277', displayName: 'Payal Rani', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1278', displayName: 'Yash Verma', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1279', displayName: 'Tanya Sharma', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1280', displayName: 'Gaurav Singh', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1281', displayName: 'Suman Devi', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1282', displayName: 'Rohit Kumar', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1283', displayName: 'Simran Kaur', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1284', displayName: 'Aman Verma', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
{ rollNumber: '1285', displayName: 'Anjali Singh', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },






// ── Automobile Section K — Sem 4 (1677–1680) ─────────────────────────
{ rollNumber: '1677', displayName: 'Pinky Devi', trade: 'Automobile Engineering', semester: 4, section: 'K' },
{ rollNumber: '1678', displayName: 'Rohit Kumar', trade: 'Automobile Engineering', semester: 4, section: 'K' },
{ rollNumber: '1679', displayName: 'Simran Kaur', trade: 'Automobile Engineering', semester: 4, section: 'K' },
{ rollNumber: '1680', displayName: 'Aman Verma', trade: 'Automobile Engineering', semester: 4, section: 'K' },






 // ── Automobile Section J — Sem 4 (1629–1630) ─────────────────────────
 { rollNumber: '1629', displayName: 'Mamta Sharma', trade: 'Automobile Engineering', semester: 4, section: 'J' },
{ rollNumber: '1630', displayName: 'Ravi Kumar', trade: 'Automobile Engineering', semester: 4, section: 'J' },
{ rollNumber: '1631', displayName: 'Ankit Kumar', trade: 'Automobile Engineering', semester: 4, section: 'J' },
{ rollNumber: '1632', displayName: 'Pooja Sharma', trade: 'Automobile Engineering', semester: 4, section: 'J' },
{ rollNumber: '1633', displayName: 'Suman Devi', trade: 'Automobile Engineering', semester: 4, section: 'J' },
{ rollNumber: '1634', displayName: 'Rohit Kumar', trade: 'Automobile Engineering', semester: 4, section: 'J' },
{ rollNumber: '1635', displayName: 'Simran Kaur', trade: 'Automobile Engineering', semester: 4, section: 'J' },
{ rollNumber: '1636', displayName: 'Aman Verma', trade: 'Automobile Engineering', semester: 4, section: 'J' },





  // ── Automobile Section K — Sem 2 (1779–1780) ─────────────────────────
{ rollNumber: '1779', displayName: 'Ankit Kumar', trade: 'Automobile Engineering', semester: 2, section: 'K' },
{ rollNumber: '1780', displayName: 'Pooja Sharma', trade: 'Automobile Engineering', semester: 2, section: 'K' },





 // ── Electrical Section F — Sem 4 (579–580) ─────────────────────────
{ rollNumber: '579', displayName: 'Arjun Sharma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
{ rollNumber: '580', displayName: 'Ravi Kumar', trade: 'Electrical Engineering', semester: 4, section: 'F' },







// ── MECHANICAL Section C — Sem 4 ────────────────────────────────────  
  { rollNumber: '429', displayName: 'Suman Devi', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '430', displayName: 'Rohit Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '431', displayName: 'Simran Kaur', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '432', displayName: 'Aman Verma', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '433', displayName: 'Pooja Sharma', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '434', displayName: 'Rahul Verma', trade: 'Mechanical Engineering', semester: 4, section: 'C' },





// ── CIVIL Section A — Sem 4 ────────────────────────────────────  
 { rollNumber: '329', displayName: 'Anil Kumar', trade: 'Civil Engineering', semester: 4, section: 'A' },
{ rollNumber: '330', displayName: 'Harish Singh', trade: 'Civil Engineering', semester: 4, section: 'A' },
{ rollNumber: '331', displayName: 'Pooja Sharma', trade: 'Civil Engineering', semester: 4, section: 'A' },
{ rollNumber: '332', displayName: 'Rohit Kumar', trade: 'Civil Engineering', semester: 4, section: 'A' },
{ rollNumber: '333', displayName: 'Simran Kaur', trade: 'Civil Engineering', semester: 4, section: 'A' },
{ rollNumber: '334', displayName: 'Aman Verma', trade: 'Civil Engineering', semester: 4, section: 'A' },



 // ── IT Section S — Sem 2 ────────────────────────────────────
  { rollNumber: '1967', displayName: 'Anjali Singh', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1968', displayName: 'Rohit Gupta', trade: 'Information Technology', semester: 2, section: 'S' },


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
                console.log('\n🌱 Starting student seed (part 10)...\n')
              
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
                console.log('\n🎉 Part 10 seed complete!\n')
                process.exit(0)
              }
              
              seed().catch(err => {
                console.error('❌ Seed failed:', err)
                process.exit(1)
              })