// ─────────────────────────────────────────────────────────────────
   //  SEED SCRIPT — Students (Part 7, ADDITIVE — does NOT delete existing)
   //  Run after seed-students.mjs: node seed-students-7.mjs
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

 // ── Electronics Section G — Sem 4 (1300–1332) ─────────────────────────
{ rollNumber: '1321', displayName: 'Neeraj Kumar', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1322', displayName: 'Sunil Gupta', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1323', displayName: 'Tarun Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1324', displayName: 'Yogesh Kumar', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1325', displayName: 'Hemant Singh', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1326', displayName: 'Lokesh Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1327', displayName: 'Rajesh Kumar', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1328', displayName: 'Vivek Gupta', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1329', displayName: 'Karan Singh', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1330', displayName: 'Arjun Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1331', displayName: 'Rohit Verma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1332', displayName: 'Amit Kumar', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },

  // ── Electronics Section H — Sem 4 (1351–1392) ─────────────────────────
  { rollNumber: '1351', displayName: 'Aditi Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1352', displayName: 'Sneha Verma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1353', displayName: 'Pooja Gupta', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1354', displayName: 'Neha Singh', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1355', displayName: 'Riya Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1356', displayName: 'Kavita Verma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1357', displayName: 'Anjali Gupta', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1358', displayName: 'Komal Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1359', displayName: 'Shalini Singh', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1360', displayName: 'Meena Kumari', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1361', displayName: 'Sunita Devi', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1362', displayName: 'Rekha Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1363', displayName: 'Babita Kumari', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1364', displayName: 'Sarita Devi', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1365', displayName: 'Preeti Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1366', displayName: 'Renu Kumari', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1367', displayName: 'Kiran Bala', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1368', displayName: 'Jyoti Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1369', displayName: 'Monika Verma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1370', displayName: 'Seema Gupta', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1371', displayName: 'Ritu Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1372', displayName: 'Anu Singh', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1373', displayName: 'Deepika Verma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1374', displayName: 'Suman Kumari', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1375', displayName: 'Nisha Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1376', displayName: 'Pinky Devi', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1377', displayName: 'Lata Kumari', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1378', displayName: 'Mamta Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1379', displayName: 'Geeta Devi', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1380', displayName: 'Soniya Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1381', displayName: 'Asha Kumari', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1382', displayName: 'Rachna Verma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1383', displayName: 'Kusum Lata', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1384', displayName: 'Reena Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1385', displayName: 'Alka Gupta', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1386', displayName: 'Madhu Kumari', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1387', displayName: 'Savita Devi', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1388', displayName: 'Sushma Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1389', displayName: 'Veena Kumari', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1390', displayName: 'Kamla Devi', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1391', displayName: 'Sharda Kumari', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },
  { rollNumber: '1392', displayName: 'Usha Devi', trade: 'Electronics and Communication Engineering', semester: 4, section: 'H' },



   // ── Electrical Section E — Sem 2 ────────────────────────────────────
  { rollNumber: '200', displayName: 'Aarav Sharma', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '201', displayName: 'Arjun Singh', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '202', displayName: 'Aditya Verma', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '203', displayName: 'Amanpreet Singh', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '204', displayName: 'Ankit Kumar', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '205', displayName: 'Ayush Gupta', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '206', displayName: 'Bhavesh Patel', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '207', displayName: 'Deepak Kumar', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '208', displayName: 'Gaurav Sharma', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '209', displayName: 'Harpreet Singh', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '210', displayName: 'Hardeep Singh', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '211', displayName: 'Ishaan Mehta', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '212', displayName: 'Jaspreet Singh', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '213', displayName: 'Karanveer Singh', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '214', displayName: 'Lakshay Jain', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '215', displayName: 'Manpreet Singh', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '216', displayName: 'Mohit Sharma', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '217', displayName: 'Nikhil Verma', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '218', displayName: 'Pankaj Kumar', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '219', displayName: 'Parth Shah', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '220', displayName: 'Rahul Kumar', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '221', displayName: 'Rajat Sharma', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '222', displayName: 'Rohan Mehta', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '223', displayName: 'Sandeep Kumar', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '224', displayName: 'Shivam Gupta', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '225', displayName: 'Simranjit Singh', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '226', displayName: 'Tarun Kumar', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '227', displayName: 'Uday Singh', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '228', displayName: 'Varun Sharma', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '229', displayName: 'Yash Gupta', trade: 'Electrical Engineering', semester: 2, section: 'E' },
  { rollNumber: '230', displayName: 'Yuvraj Singh', trade: 'Electrical Engineering', semester: 2, section: 'E' },


  // ── Electrical Section F — Sem 2 ────────────────────────────────────
  { rollNumber: '251', displayName: 'Aditi Sharma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '252', displayName: 'Anjali Verma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '253', displayName: 'Amandeep Kaur', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '254', displayName: 'Bhavna Gupta', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '255', displayName: 'Charu Sharma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '256', displayName: 'Deepika Singh', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '257', displayName: 'Ekta Verma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '258', displayName: 'Garima Gupta', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '259', displayName: 'Harleen Kaur', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '260', displayName: 'Himanshi Sharma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '261', displayName: 'Ishita Jain', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '262', displayName: 'Jasleen Kaur', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '263', displayName: 'Kanika Sharma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '264', displayName: 'Komal Verma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '265', displayName: 'Lovepreet Kaur', trade: 'Electrical Engineering', semester: 2, section: 'F' },

    
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
            console.log('\n🌱 Starting student seed (part 7)...\n')
          
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
            console.log('\n🎉 Part 7 seed complete!\n')
            process.exit(0)
          }
          
          seed().catch(err => {
            console.error('❌ Seed failed:', err)
            process.exit(1)
          })