   // ─────────────────────────────────────────────────────────────────
   //  SEED SCRIPT — Students (Part 3, ADDITIVE — does NOT delete existing)
   //  Run after seed-students.mjs: node seed-students-3.mjs
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

   // ── IT Section S — Sem 2 ────────────────────────────────────
   { rollNumber: '1969', displayName: 'Alok Singh', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1970', displayName: 'Divya Sharma', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1971', displayName: 'Nitin Verma', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1972', displayName: 'Payal Gupta', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1973', displayName: 'Suresh Kumar', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1974', displayName: 'Monika Sharma', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1975', displayName: 'Deepika Verma', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1976', displayName: 'Rohit Sharma', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1977', displayName: 'Anu Kaur', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1978', displayName: 'Jatin Kumar', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1979', displayName: 'Kusum Lata', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1980', displayName: 'Hemant Singh', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1981', displayName: 'Ruchi Sharma', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1982', displayName: 'Lokesh Kumar', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1983', displayName: 'Sarita Devi', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1984', displayName: 'Aakash Gupta', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1985', displayName: 'Babita Sharma', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1986', displayName: 'Dinesh Kumar', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1987', displayName: 'Neha Singh', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1988', displayName: 'Sunita Devi', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1989', displayName: 'Kapil Sharma', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1990', displayName: 'Pooja Verma', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1991', displayName: 'Yogesh Kumar', trade: 'Information Technology', semester: 2, section: 'S' },
  { rollNumber: '1992', displayName: 'Ramesh Kumar', trade: 'Information Technology', semester: 2, section: 'S' },


  // ── CIVIL Section A — Sem 2 ──────────────────────────────────── 
  { rollNumber: '1', displayName: 'Alok Singh', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '2', displayName: 'Rohit Kumar', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '3', displayName: 'Aman Sharma', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '4', displayName: 'Vikas Gupta', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '5', displayName: 'Sandeep Singh', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '6', displayName: 'Karan Verma', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '7', displayName: 'Deepak Yadav', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '8', displayName: 'Mohit Sharma', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '9', displayName: 'Ankit Kumar', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '10', displayName: 'Rahul Mehta', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '11', displayName: 'Arjun Singh', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '12', displayName: 'Pankaj Sharma', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '13', displayName: 'Rakesh Kumar', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '14', displayName: 'Sunil Verma', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '15', displayName: 'Nitin Gupta', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '16', displayName: 'Ajay Singh', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '17', displayName: 'Dinesh Kumar', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '18', displayName: 'Manoj Sharma', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '19', displayName: 'Gaurav Yadav', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '20', displayName: 'Lokesh Kumar', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '21', displayName: 'Rajesh Singh', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '22', displayName: 'Vivek Sharma', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '23', displayName: 'Tarun Gupta', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '24', displayName: 'Hemant Kumar', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '25', displayName: 'Yogesh Singh', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '26', displayName: 'Suresh Kumar', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '27', displayName: 'Neeraj Sharma', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '28', displayName: 'Kapil Verma', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '29', displayName: 'Anil Kumar', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '30', displayName: 'Harish Singh', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '31', displayName: 'Ravi Sharma', trade: 'Civil Engineering', semester: 2, section: 'A' },
  { rollNumber: '32', displayName: 'Mukesh Kumar', trade: 'Civil Engineering', semester: 2, section: 'A' },


// ── CIVIL Section B — Sem 2 ────────────────────────────────────  
  { rollNumber: '51', displayName: 'Alok Singh', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '52', displayName: 'Rohit Kumar', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '53', displayName: 'Aman Sharma', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '54', displayName: 'Vikas Gupta', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '55', displayName: 'Sandeep Singh', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '56', displayName: 'Karan Verma', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '57', displayName: 'Deepak Yadav', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '58', displayName: 'Mohit Sharma', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '59', displayName: 'Ankit Kumar', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '60', displayName: 'Rahul Mehta', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '61', displayName: 'Arjun Singh', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '62', displayName: 'Pankaj Sharma', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '63', displayName: 'Rakesh Kumar', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '64', displayName: 'Sunil Verma', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '65', displayName: 'Nitin Gupta', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '66', displayName: 'Ajay Singh', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '67', displayName: 'Dinesh Kumar', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '68', displayName: 'Manoj Sharma', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '69', displayName: 'Gaurav Yadav', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '70', displayName: 'Lokesh Kumar', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '71', displayName: 'Rajesh Singh', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '72', displayName: 'Vivek Sharma', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '73', displayName: 'Tarun Gupta', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '74', displayName: 'Hemant Kumar', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '75', displayName: 'Yogesh Singh', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '76', displayName: 'Suresh Kumar', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '77', displayName: 'Neeraj Sharma', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '78', displayName: 'Kapil Verma', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '79', displayName: 'Anil Kumar', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '80', displayName: 'Harish Singh', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '81', displayName: 'Ravi Sharma', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '82', displayName: 'Mukesh Kumar', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '83', displayName: 'Amit Yadav', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '84', displayName: 'Sanjay Kumar', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '85', displayName: 'Rohit Singh', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '86', displayName: 'Vivek Gupta', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '87', displayName: 'Deepak Sharma', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '88', displayName: 'Ankit Verma', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '89', displayName: 'Pawan Kumar', trade: 'Civil Engineering', semester: 2, section: 'B' },
  { rollNumber: '90', displayName: 'Kunal Singh', trade: 'Civil Engineering', semester: 2, section: 'B' },


  // ── CIVIL Section A — Sem 4 ────────────────────────────────────  
  { rollNumber: '301', displayName: 'Alok Singh', trade: 'Civil Engineering', semester: 4, section: 'A' },
  { rollNumber: '302', displayName: 'Rohit Kumar', trade: 'Civil Engineering', semester: 4, section: 'A' },



   
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
    console.log('\n🌱 Starting student seed (part 3)...\n')
  
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
    console.log('\n🎉 Part 3 seed complete!\n')
    process.exit(0)
  }
  
  seed().catch(err => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })