// ─────────────────────────────────────────────────────────────────
   //  SEED SCRIPT — Students (Part 4, ADDITIVE — does NOT delete existing)
   //  Run after seed-students.mjs: node seed-students-4.mjs
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


// ── CIVIL Section A — Sem 4 ────────────────────────────────────  
  { rollNumber: '303', displayName: 'Aman Sharma', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '304', displayName: 'Vikas Gupta', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '305', displayName: 'Sandeep Singh', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '306', displayName: 'Karan Verma', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '307', displayName: 'Deepak Yadav', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '308', displayName: 'Mohit Sharma', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '309', displayName: 'Ankit Kumar', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '310', displayName: 'Rahul Mehta', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '311', displayName: 'Arjun Singh', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '312', displayName: 'Pankaj Sharma', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '313', displayName: 'Rakesh Kumar', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '314', displayName: 'Sunil Verma', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '315', displayName: 'Nitin Gupta', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '316', displayName: 'Ajay Singh', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '317', displayName: 'Dinesh Kumar', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '318', displayName: 'Manoj Sharma', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '319', displayName: 'Gaurav Yadav', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '320', displayName: 'Lokesh Kumar', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '321', displayName: 'Rajesh Singh', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '322', displayName: 'Vivek Sharma', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '323', displayName: 'Tarun Gupta', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '324', displayName: 'Hemant Kumar', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '325', displayName: 'Yogesh Singh', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '326', displayName: 'Suresh Kumar', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '327', displayName: 'Neeraj Sharma', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '328', displayName: 'Kapil Verma', trade: 'Civil Engineering', semester: 4, section: 'A' },
 

  // ── CIVIL Section B — Sem 4 ────────────────────────────────────  
  { rollNumber: '351', displayName: 'Ravi Sharma', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '352', displayName: 'Mukesh Kumar', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '353', displayName: 'Amit Yadav', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '354', displayName: 'Sanjay Kumar', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '355', displayName: 'Rohit Singh', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '356', displayName: 'Vivek Gupta', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '357', displayName: 'Deepak Sharma', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '358', displayName: 'Ankit Verma', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '359', displayName: 'Pawan Kumar', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '360', displayName: 'Kunal Singh', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '361', displayName: 'Manish Kumar', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '362', displayName: 'Sachin Sharma', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '363', displayName: 'Alok Singh', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '364', displayName: 'Rohit Kumar', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '365', displayName: 'Aman Sharma', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '366', displayName: 'Vikas Gupta', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '367', displayName: 'Sandeep Singh', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '368', displayName: 'Karan Verma', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '369', displayName: 'Deepak Yadav', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '370', displayName: 'Mohit Sharma', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '371', displayName: 'Ankit Kumar', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '372', displayName: 'Rahul Mehta', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '373', displayName: 'Arjun Singh', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '374', displayName: 'Pankaj Sharma', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '375', displayName: 'Rakesh Kumar', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '376', displayName: 'Sunil Verma', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '377', displayName: 'Nitin Gupta', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '378', displayName: 'Ajay Singh', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '379', displayName: 'Dinesh Kumar', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '380', displayName: 'Manoj Sharma', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '381', displayName: 'Gaurav Yadav', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '382', displayName: 'Lokesh Kumar', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '383', displayName: 'Rajesh Singh', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '384', displayName: 'Vivek Sharma', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '385', displayName: 'Tarun Gupta', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '386', displayName: 'Hemant Kumar', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '387', displayName: 'Yogesh Singh', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '388', displayName: 'Suresh Kumar', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '389', displayName: 'Neeraj Sharma', trade: 'Civil Engineering', semester: 4, section: 'B' },
  { rollNumber: '390', displayName: 'Kapil Verma', trade: 'Civil Engineering', semester: 4, section: 'B' },


  // ── MECHANICAL Section C — Sem 2 ────────────────────────────────────  
  { rollNumber: '101', displayName: 'Alok Singh', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '102', displayName: 'Rohit Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '103', displayName: 'Aman Sharma', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '104', displayName: 'Vikas Gupta', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '105', displayName: 'Sandeep Singh', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '106', displayName: 'Karan Verma', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '107', displayName: 'Deepak Yadav', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '108', displayName: 'Mohit Sharma', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '109', displayName: 'Ankit Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '110', displayName: 'Rahul Mehta', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '111', displayName: 'Arjun Singh', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '112', displayName: 'Pankaj Sharma', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '113', displayName: 'Rakesh Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '114', displayName: 'Sunil Verma', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '115', displayName: 'Nitin Gupta', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '116', displayName: 'Ajay Singh', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '117', displayName: 'Dinesh Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '118', displayName: 'Manoj Sharma', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '119', displayName: 'Gaurav Yadav', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '120', displayName: 'Lokesh Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '121', displayName: 'Rajesh Singh', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '122', displayName: 'Vivek Sharma', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '123', displayName: 'Tarun Gupta', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '124', displayName: 'Hemant Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '125', displayName: 'Yogesh Singh', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '126', displayName: 'Suresh Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '127', displayName: 'Neeraj Sharma', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '128', displayName: 'Kapil Verma', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '129', displayName: 'Anil Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'C' },
  { rollNumber: '130', displayName: 'Harish Singh', trade: 'Mechanical Engineering', semester: 2, section: 'C' },

  // ── MECHANICAL Section D — Sem 2 ────────────────────────────────────  
  { rollNumber: '151', displayName: 'Ravi Sharma', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '152', displayName: 'Mukesh Kumar', trade: 'Mechanical Engineering', semester: 2, section: 'D' },
  { rollNumber: '153', displayName: 'Amit Yadav', trade: 'Mechanical Engineering', semester: 2, section: 'D' },



  
     
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
      console.log('\n🌱 Starting student seed (part 4)...\n')
    
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
      console.log('\n🎉 Part 4 seed complete!\n')
      process.exit(0)
    }
    
    seed().catch(err => {
      console.error('❌ Seed failed:', err)
      process.exit(1)
    })