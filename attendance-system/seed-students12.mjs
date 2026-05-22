// ─────────────────────────────────────────────────────────────────
   //  SEED SCRIPT — Students (Part 12, ADDITIVE — does NOT delete existing)
   //  Run after seed-students10.mjs: node seed-students-12.mjs
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

    
    // ── Electrical Section F — Sem 4 (581-592) ────────────────────────────────────
    { rollNumber: '581', displayName: 'Amit Singh', trade: 'Electrical Engineering', semester: 4, section: 'F' },
    { rollNumber: '582', displayName: 'Neha Gupta', trade: 'Electrical Engineering', semester: 4, section: 'F' },
    { rollNumber: '583', displayName: 'Suresh Kumar', trade: 'Electrical Engineering', semester: 4, section: 'F' },
    { rollNumber: '584', displayName: 'Priya Sharma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
    { rollNumber: '585', displayName: 'Rahul Verma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
    { rollNumber: '586', displayName: 'Aman Kumar', trade: 'Electrical Engineering', semester: 4, section: 'F' },
    { rollNumber: '587', displayName: 'Pooja Verma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
    { rollNumber: '588', displayName: 'Rohit Kumar', trade: 'Electrical Engineering', semester: 4, section: 'F' },
    { rollNumber: '589', displayName: 'Anjali Sharma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
    { rollNumber: '590', displayName: 'Sneha Gupta', trade: 'Electrical Engineering', semester: 4, section: 'F' },
    { rollNumber: '591', displayName: 'Ravi Kumar', trade: 'Electrical Engineering', semester: 4, section: 'F' },
    { rollNumber: '592', displayName: 'Priya Sharma', trade: 'Electrical Engineering', semester: 4, section: 'F' },
    
    
    
    //  ── Automobile Section J — Sem 2 (1731–1740) ─────────────────────────
    { rollNumber: '1731', displayName: 'Rahul Verma', trade: 'Automobile Engineering', semester: 2, section: 'J' }, 
    { rollNumber: '1732', displayName: 'Aman Kumar', trade: 'Automobile Engineering', semester: 2, section: 'J' }, 
    { rollNumber: '1733', displayName: 'Pooja Verma', trade: 'Automobile Engineering', semester: 2, section: 'J' }, 
    { rollNumber: '1734', displayName: 'Rohit Kumar', trade: 'Automobile Engineering', semester: 2, section: 'J' }, 
    { rollNumber: '1735', displayName: 'Anjali Sharma', trade: 'Automobile Engineering', semester: 2, section: 'J' }, 
    { rollNumber: '1736', displayName: 'Sneha Gupta', trade: 'Automobile Engineering', semester: 2, section: 'J' }, 
    { rollNumber: '1737', displayName: 'Amit Singh', trade: 'Automobile Engineering', semester: 2, section: 'J' }, 
    { rollNumber: '1738', displayName: 'Neha Gupta', trade: 'Automobile Engineering', semester: 2, section: 'J' }, 
    { rollNumber: '1739', displayName: 'Suresh Kumar', trade: 'Automobile Engineering', semester: 2, section: 'J' }, 
    { rollNumber: '1740', displayName: 'Priya Sharma', trade: 'Automobile Engineering', semester: 2, section: 'J' }, 
    
    
    
    //  ── Automobile Section K — Sem 2 (1781–1792) ─────────────────────────
    { rollNumber: '1781', displayName: 'Rahul Verma', trade: 'Automobile Engineering', semester: 2, section: 'K' },
    { rollNumber: '1782', displayName: 'Aman Kumar', trade: 'Automobile Engineering', semester: 2, section: 'K' },
    { rollNumber: '1783', displayName: 'Pooja Verma', trade: 'Automobile Engineering', semester: 2, section: 'K' },
    { rollNumber: '1784', displayName: 'Rohit Kumar', trade: 'Automobile Engineering', semester: 2, section: 'K' },
    { rollNumber: '1785', displayName: 'Anjali Sharma', trade: 'Automobile Engineering', semester: 2, section: 'K' },
    { rollNumber: '1786', displayName: 'Sneha Gupta', trade: 'Automobile Engineering', semester: 2, section: 'K' },
    { rollNumber: '1787', displayName: 'Amit Singh', trade: 'Automobile Engineering', semester: 2, section: 'K' },
    { rollNumber: '1788', displayName: 'Neha Gupta', trade: 'Automobile Engineering', semester: 2, section: 'K' },
    { rollNumber: '1789', displayName: 'Suresh Kumar', trade: 'Automobile Engineering', semester: 2, section: 'K' },
    { rollNumber: '1790', displayName: 'Priya Sharma', trade: 'Automobile Engineering', semester: 2, section: 'K' },
    { rollNumber: '1791', displayName: 'Ravi Kumar', trade: 'Automobile Engineering', semester: 2, section: 'K' },
    { rollNumber: '1792', displayName: 'Anjali Sharma', trade: 'Automobile Engineering', semester: 2, section: 'K' },
    
    
    
    // ── Automobile Section J — Sem 4 (1637–1640) ─────────────────────────
    { rollNumber: '1637', displayName: 'Rahul Verma', trade: 'Automobile Engineering', semester: 4, section: 'J' },
    { rollNumber: '1638', displayName: 'Aman Kumar', trade: 'Automobile Engineering', semester: 4, section: 'J' },
    { rollNumber: '1639', displayName: 'Pooja Verma', trade: 'Automobile Engineering', semester: 4, section: 'J' },
    { rollNumber: '1640', displayName: 'Rohit Kumar', trade: 'Automobile Engineering', semester: 4, section: 'J' },
    
    
    
    // ── Automobile Section K — Sem 4 (1681–1692) ─────────────────────────
    { rollNumber: '1681', displayName: 'Rahul Verma', trade: 'Automobile Engineering', semester: 4, section: 'K' },
    { rollNumber: '1682', displayName: 'Aman Kumar', trade: 'Automobile Engineering', semester: 4, section: 'K' },
    { rollNumber: '1683', displayName: 'Pooja Verma', trade: 'Automobile Engineering', semester: 4, section: 'K' },
    { rollNumber: '1684', displayName: 'Rohit Kumar', trade: 'Automobile Engineering', semester: 4, section: 'K' },
    { rollNumber: '1685', displayName: 'Anjali Sharma', trade: 'Automobile Engineering', semester: 4, section: 'K' },
    { rollNumber: '1686', displayName: 'Sneha Gupta', trade: 'Automobile Engineering', semester: 4, section: 'K' },
    { rollNumber: '1687', displayName: 'Amit Singh', trade: 'Automobile Engineering', semester: 4, section: 'K' },
    { rollNumber: '1688', displayName: 'Neha Gupta', trade: 'Automobile Engineering', semester: 4, section: 'K' },
    { rollNumber: '1689', displayName: 'Suresh Kumar', trade: 'Automobile Engineering', semester: 4, section: 'K' },
    { rollNumber: '1690', displayName: 'Priya Sharma', trade: 'Automobile Engineering', semester: 4, section: 'K' },
    { rollNumber: '1691', displayName: 'Ravi Kumar', trade: 'Automobile Engineering', semester: 4, section: 'K' },
    { rollNumber: '1692', displayName: 'Anjali Sharma', trade: 'Automobile Engineering', semester: 4, section: 'K' },
    
    
    
    // ── Computer Science Section L — Sem 4 (1235–1240) ─────────────────────────
    { rollNumber: '1235', displayName: 'Aman Kumar', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
    { rollNumber: '1236', displayName: 'Priya Sharma', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
    { rollNumber: '1237', displayName: 'Rahul Verma', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
    { rollNumber: '1238', displayName: 'Anjali Sharma', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
    { rollNumber: '1239', displayName: 'Amit Singh', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
    { rollNumber: '1240', displayName: 'Sneha Gupta', trade: 'Computer Science and Engineering', semester: 4, section: 'L' },
    
    
    
    // ── Computer Science Section M — Sem 4 (1286–1292) ─────────────────────────
    { rollNumber: '1286', displayName: 'Rahul Verma', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
    { rollNumber: '1287', displayName: 'Sneha Gupta', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
    { rollNumber: '1288', displayName: 'Vikram Singh', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
    { rollNumber: '1289', displayName: 'Neha Gupta', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
    { rollNumber: '1290', displayName: 'Suresh Kumar', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
    { rollNumber: '1291', displayName: 'Priya Sharma', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
    { rollNumber: '1292', displayName: 'Aman Kumar', trade: 'Computer Science and Engineering', semester: 4, section: 'M' },
    
    
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
                    console.log('\n🌱 Starting student seed (part 12)...\n')
                  
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
                    console.log('\n🎉 Part 12 seed complete!\n')
                    process.exit(0)
                  }
                  
                  seed().catch(err => {
                    console.error('❌ Seed failed:', err)
                    process.exit(1)
                  })