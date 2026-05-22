// ─────────────────────────────────────────────────────────────────
   //  SEED SCRIPT — Students (Part 6, ADDITIVE — does NOT delete existing)
   //  Run after seed-students.mjs: node seed-students-6.mjs
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

 // ── MECHANICAL Section D — Sem 4 ────────────────────────────────────  
  { rollNumber: '485', displayName: 'Tarun Gupta', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '486', displayName: 'Hemant Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '487', displayName: 'Yogesh Singh', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '488', displayName: 'Suresh Kumar', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '489', displayName: 'Neeraj Sharma', trade: 'Mechanical Engineering', semester: 4, section: 'D' },
  { rollNumber: '490', displayName: 'Kapil Verma', trade: 'Mechanical Engineering', semester: 4, section: 'D' },


  // ── Electronics Section G — Sem 2 (1100–1132) ─────────────────────────
  { rollNumber: '1100', displayName: 'Aarav Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1101', displayName: 'Vivaan Singh', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1102', displayName: 'Aditya Verma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1103', displayName: 'Krishna Kumar', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1104', displayName: 'Aryan Gupta', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1105', displayName: 'Shivam Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1106', displayName: 'Kunal Singh', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1107', displayName: 'Rohit Yadav', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1108', displayName: 'Sahil Verma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1109', displayName: 'Ankit Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1110', displayName: 'Rahul Kumar', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1111', displayName: 'Deepak Singh', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1112', displayName: 'Mohit Gupta', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1113', displayName: 'Nikhil Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1114', displayName: 'Aman Verma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1115', displayName: 'Ravi Kumar', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1116', displayName: 'Vikas Yadav', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1117', displayName: 'Sandeep Kumar', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1118', displayName: 'Manish Singh', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1119', displayName: 'Ajay Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1120', displayName: 'Pankaj Verma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1121', displayName: 'Neeraj Kumar', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1122', displayName: 'Sunil Gupta', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1123', displayName: 'Tarun Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1124', displayName: 'Yogesh Kumar', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1125', displayName: 'Hemant Singh', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1126', displayName: 'Lokesh Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1127', displayName: 'Rajesh Kumar', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1128', displayName: 'Vivek Gupta', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1129', displayName: 'Karan Singh', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1130', displayName: 'Arjun Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1131', displayName: 'Rohit Verma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },
  { rollNumber: '1132', displayName: 'Amit Kumar', trade: 'Electronics and Communication Engineering', semester: 2, section: 'G' },

  // ── Electronics Section H — Sem 2 (1151–1192) ─────────────────────────
  { rollNumber: '1151', displayName: 'Aditi Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1152', displayName: 'Sneha Verma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1153', displayName: 'Pooja Gupta', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1154', displayName: 'Neha Singh', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1155', displayName: 'Riya Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1156', displayName: 'Kavita Verma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1157', displayName: 'Anjali Gupta', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1158', displayName: 'Komal Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1159', displayName: 'Shalini Singh', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1160', displayName: 'Meena Kumari', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1161', displayName: 'Sunita Devi', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1162', displayName: 'Rekha Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1163', displayName: 'Babita Kumari', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1164', displayName: 'Sarita Devi', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1165', displayName: 'Preeti Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1166', displayName: 'Renu Kumari', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1167', displayName: 'Kiran Bala', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1168', displayName: 'Jyoti Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1169', displayName: 'Monika Verma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1170', displayName: 'Seema Gupta', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1171', displayName: 'Ritu Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1172', displayName: 'Anu Singh', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1173', displayName: 'Deepika Verma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1174', displayName: 'Suman Kumari', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1175', displayName: 'Nisha Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1176', displayName: 'Pinky Devi', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1177', displayName: 'Lata Kumari', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1178', displayName: 'Mamta Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1179', displayName: 'Geeta Devi', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1180', displayName: 'Soniya Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1181', displayName: 'Asha Kumari', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1182', displayName: 'Rachna Verma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1183', displayName: 'Kusum Lata', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1184', displayName: 'Reena Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1185', displayName: 'Alka Gupta', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1186', displayName: 'Madhu Kumari', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1187', displayName: 'Savita Devi', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1188', displayName: 'Sushma Sharma', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1189', displayName: 'Veena Kumari', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },
  { rollNumber: '1190', displayName: 'Kamla Devi', trade: 'Electronics and Communication Engineering', semester: 2, section: 'H' },


  // ── Electronics Section G — Sem 4 (1300–1332) ─────────────────────────
  { rollNumber: '1300', displayName: 'Aarav Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1301', displayName: 'Vivaan Singh', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1302', displayName: 'Aditya Verma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1303', displayName: 'Krishna Kumar', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1304', displayName: 'Aryan Gupta', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1305', displayName: 'Shivam Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1306', displayName: 'Kunal Singh', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1307', displayName: 'Rohit Yadav', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1308', displayName: 'Sahil Verma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1309', displayName: 'Ankit Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1310', displayName: 'Rahul Kumar', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1311', displayName: 'Deepak Singh', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1312', displayName: 'Mohit Gupta', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1313', displayName: 'Nikhil Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1314', displayName: 'Aman Verma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1315', displayName: 'Ravi Kumar', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1316', displayName: 'Vikas Yadav', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1317', displayName: 'Sandeep Kumar', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1318', displayName: 'Manish Singh', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1319', displayName: 'Ajay Sharma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  { rollNumber: '1320', displayName: 'Pankaj Verma', trade: 'Electronics and Communication Engineering', semester: 4, section: 'G' },
  
  
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
          console.log('\n🌱 Starting student seed (part 6)...\n')
        
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
          console.log('\n🎉 Part 6 seed complete!\n')
          process.exit(0)
        }
        
        seed().catch(err => {
          console.error('❌ Seed failed:', err)
          process.exit(1)
        })