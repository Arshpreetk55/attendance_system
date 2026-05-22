// ─────────────────────────────────────────────────────────────────
   //  SEED SCRIPT — Students (Part 5, ADDITIVE — does NOT delete existing)
   //  Run after seed-students.mjs: node seed-students-5.mjs
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

// ── MECHANICAL Section D — Sem 2 ────────────────────────────────────  
  { rollNumber: '154', displayName: 'Sanjay Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '155', displayName: 'Rohit Singh', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '156', displayName: 'Vivek Gupta', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '157', displayName: 'Deepak Sharma', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '158', displayName: 'Ankit Verma', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '159', displayName: 'Pawan Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '160', displayName: 'Kunal Singh', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '161', displayName: 'Manish Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '162', displayName: 'Sachin Sharma', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '163', displayName: 'Alok Singh', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '164', displayName: 'Rohit Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '165', displayName: 'Aman Sharma', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '166', displayName: 'Vikas Gupta', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '167', displayName: 'Sandeep Singh', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '168', displayName: 'Karan Verma', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '169', displayName: 'Deepak Yadav', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '170', displayName: 'Mohit Sharma', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '171', displayName: 'Ankit Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '172', displayName: 'Rahul Mehta', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '173', displayName: 'Arjun Singh', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '174', displayName: 'Pankaj Sharma', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '175', displayName: 'Rakesh Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '176', displayName: 'Sunil Verma', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '177', displayName: 'Nitin Gupta', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '178', displayName: 'Ajay Singh', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '179', displayName: 'Dinesh Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '180', displayName: 'Manoj Sharma', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '181', displayName: 'Gaurav Yadav', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '182', displayName: 'Lokesh Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '183', displayName: 'Rajesh Singh', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '184', displayName: 'Vivek Sharma', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '185', displayName: 'Tarun Gupta', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '186', displayName: 'Hemant Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '187', displayName: 'Yogesh Singh', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '188', displayName: 'Suresh Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '189', displayName: 'Neeraj Sharma', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '190', displayName: 'Kapil Verma', trade: 'Mechanical Engineering', semester: 2, section: 'D' },



// ── MECHANICAL Section C — Sem 4 ────────────────────────────────────  
  { rollNumber: '401', displayName: 'Alok Singh', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '402', displayName: 'Rohit Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '403', displayName: 'Aman Sharma', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '404', displayName: 'Vikas Gupta', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '405', displayName: 'Sandeep Singh', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '406', displayName: 'Karan Verma', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '407', displayName: 'Deepak Yadav', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '408', displayName: 'Mohit Sharma', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '409', displayName: 'Ankit Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '410', displayName: 'Rahul Mehta', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '411', displayName: 'Arjun Singh', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '412', displayName: 'Pankaj Sharma', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '413', displayName: 'Rakesh Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '414', displayName: 'Sunil Verma', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '415', displayName: 'Nitin Gupta', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '416', displayName: 'Ajay Singh', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '417', displayName: 'Dinesh Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '418', displayName: 'Manoj Sharma', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '419', displayName: 'Gaurav Yadav', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '420', displayName: 'Lokesh Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '421', displayName: 'Rajesh Singh', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '422', displayName: 'Vivek Sharma', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '423', displayName: 'Tarun Gupta', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '424', displayName: 'Hemant Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '425', displayName: 'Yogesh Singh', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '426', displayName: 'Suresh Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '427', displayName: 'Neeraj Sharma', trade: 'Mechanical Engineering', semester: 4, section: 'C' },
  { rollNumber: '428', displayName: 'Kapil Verma', trade: 'Mechanical Engineering', semester: 4, section: 'C' },


  // ── MECHANICAL Section D — Sem 4 ────────────────────────────────────  
  { rollNumber: '451', displayName: 'Ravi Sharma', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '452', displayName: 'Mukesh Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '453', displayName: 'Amit Yadav', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '454', displayName: 'Sanjay Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '455', displayName: 'Rohit Singh', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '456', displayName: 'Vivek Gupta', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '457', displayName: 'Deepak Sharma', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '458', displayName: 'Ankit Verma', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '459', displayName: 'Pawan Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '460', displayName: 'Kunal Singh', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '461', displayName: 'Manish Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '462', displayName: 'Sachin Sharma', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '463', displayName: 'Alok Singh', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '464', displayName: 'Rohit Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '465', displayName: 'Aman Sharma', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '466', displayName: 'Vikas Gupta', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '467', displayName: 'Sandeep Singh', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '468', displayName: 'Karan Verma', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '469', displayName: 'Deepak Yadav', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '470', displayName: 'Mohit Sharma', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '471', displayName: 'Ankit Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '472', displayName: 'Rahul Mehta', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '473', displayName: 'Arjun Singh', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '474', displayName: 'Pankaj Sharma', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '475', displayName: 'Rakesh Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '476', displayName: 'Sunil Verma', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '477', displayName: 'Nitin Gupta', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '478', displayName: 'Ajay Singh', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '479', displayName: 'Dinesh Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '480', displayName: 'Manoj Sharma', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '481', displayName: 'Gaurav Yadav', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '482', displayName: 'Lokesh Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
 { rollNumber: '483', displayName: 'Raman Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
 { rollNumber: '484', displayName: 'Aayush Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'D' },










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
        console.log('\n🌱 Starting student seed (part 5)...\n')
      
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
        console.log('\n🎉 Part 5 seed complete!\n')
        process.exit(0)
      }
      
      seed().catch(err => {
        console.error('❌ Seed failed:', err)
        process.exit(1)
      })