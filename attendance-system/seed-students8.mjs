// ─────────────────────────────────────────────────────────────────
   //  SEED SCRIPT — Students (Part 8, ADDITIVE — does NOT delete existing)
   //  Run after seed-students.mjs: node seed-students-8.mjs
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

// ── Electrical Section F — Sem 2 ────────────────────────────────────
  { rollNumber: '266', displayName: 'Mehak Sharma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '267', displayName: 'Muskan Gupta', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '268', displayName: 'Neha Verma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '269', displayName: 'Nisha Sharma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '270', displayName: 'Palak Gupta', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '271', displayName: 'Pooja Sharma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '272', displayName: 'Priya Verma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '273', displayName: 'Radhika Sharma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '274', displayName: 'Ritu Gupta', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '275', displayName: 'Sanya Sharma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '276', displayName: 'Shreya Gupta', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '277', displayName: 'Simran Kaur', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '278', displayName: 'Sneha Sharma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '279', displayName: 'Sonam Verma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '280', displayName: 'Suhani Gupta', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '281', displayName: 'Taniya Sharma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '282', displayName: 'Tanvi Verma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '283', displayName: 'Urvashi Gupta', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '284', displayName: 'Vanshika Sharma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '285', displayName: 'Vidhi Gupta', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '286', displayName: 'Yashika Sharma', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '287', displayName: 'Zara Khan', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '288', displayName: 'Ayesha Khan', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '289', displayName: 'Hina Parveen', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '290', displayName: 'Sana Khan', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '291', displayName: 'Noor Fatima', trade: 'Electrical Engineering', semester: 2, section: 'F' },
  { rollNumber: '292', displayName: 'Alisha Khan', trade: 'Electrical Engineering', semester: 2, section: 'F' },



// ── Electrical Section E — Sem 4 (501–530) ─────────────────────────
  { rollNumber: '501', displayName: 'Aarav Sharma', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '502', displayName: 'Vivaan Singh', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '503', displayName: 'Aditya Verma', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '504', displayName: 'Krishna Kumar', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '505', displayName: 'Aryan Gupta', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '506', displayName: 'Shivam Sharma', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '507', displayName: 'Kunal Singh', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '508', displayName: 'Rohit Yadav', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '509', displayName: 'Sahil Verma', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '510', displayName: 'Ankit Sharma', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '511', displayName: 'Rahul Kumar', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '512', displayName: 'Deepak Singh', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '513', displayName: 'Mohit Gupta', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '514', displayName: 'Nikhil Sharma', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '515', displayName: 'Aman Verma', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '516', displayName: 'Ravi Kumar', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '517', displayName: 'Vikas Yadav', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '518', displayName: 'Sandeep Kumar', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '519', displayName: 'Manish Singh', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '520', displayName: 'Ajay Sharma', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '521', displayName: 'Pankaj Verma', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '522', displayName: 'Neeraj Kumar', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '523', displayName: 'Sunil Gupta', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '524', displayName: 'Tarun Sharma', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '525', displayName: 'Yogesh Kumar', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '526', displayName: 'Hemant Singh', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '527', displayName: 'Lokesh Sharma', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '528', displayName: 'Rajesh Kumar', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '529', displayName: 'Vivek Gupta', trade: 'Electrical Engineering', semester: 4, section: 'E' },
  { rollNumber: '530', displayName: 'Karan Singh', trade: 'Electrical Engineering', semester: 4, section: 'E' },

  // ── Electrical Section F — Sem 4 (551–580) ─────────────────────────
  { rollNumber: '551', displayName: 'Aditi Sharma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '552', displayName: 'Sneha Verma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '553', displayName: 'Pooja Gupta', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '554', displayName: 'Neha Singh', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '555', displayName: 'Riya Sharma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '556', displayName: 'Kavita Verma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '557', displayName: 'Anjali Gupta', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '558', displayName: 'Komal Sharma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '559', displayName: 'Shalini Singh', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '560', displayName: 'Meena Kumari', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '561', displayName: 'Sunita Devi', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '562', displayName: 'Rekha Sharma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '563', displayName: 'Babita Kumari', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '564', displayName: 'Sarita Devi', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '565', displayName: 'Preeti Sharma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '566', displayName: 'Renu Kumari', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '567', displayName: 'Kiran Bala', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '568', displayName: 'Jyoti Sharma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '569', displayName: 'Monika Verma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '570', displayName: 'Seema Gupta', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '571', displayName: 'Ritu Sharma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '572', displayName: 'Anu Singh', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '573', displayName: 'Deepika Verma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '574', displayName: 'Suman Kumari', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '575', displayName: 'Nisha Sharma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '576', displayName: 'Pinky Devi', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '577', displayName: 'Lata Kumari', trade: 'Electrical Engineering', semester: 4, section: 'F' },
  { rollNumber: '578', displayName: 'Mamta Sharma', trade: 'Electrical Engineering', semester: 4, section: 'F' },



  // ── Automobile Section J — Sem 2 (1701–1730) ─────────────────────────
  { rollNumber: '1701', displayName: 'Aditi Sharma', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1702', displayName: 'Sneha Verma', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1703', displayName: 'Pooja Gupta', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1704', displayName: 'Neha Singh', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1705', displayName: 'Riya Sharma', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1706', displayName: 'Kavita Verma', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1707', displayName: 'Anjali Gupta', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1708', displayName: 'Komal Sharma', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1709', displayName: 'Shalini Singh', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1710', displayName: 'Meena Kumari', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1711', displayName: 'Sunita Devi', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1712', displayName: 'Rekha Sharma', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1713', displayName: 'Babita Kumari', trade: 'Automobile Engineering', semester: 2, section: 'J' },
 

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
              console.log('\n🌱 Starting student seed (part 8)...\n')
            
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
              console.log('\n🎉 Part 8 seed complete!\n')
              process.exit(0)
            }
            
            seed().catch(err => {
              console.error('❌ Seed failed:', err)
              process.exit(1)
            })