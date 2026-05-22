// ─────────────────────────────────────────────────────────────────
   //  SEED SCRIPT — Students (Part 9, ADDITIVE — does NOT delete existing)
   //  Run after seed-students.mjs: node seed-students-9.mjs
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


 // ── Automobile Section J — Sem 2 (1701–1730) ─────────────────────────
 { rollNumber: '1714', displayName: 'Sarita Devi', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1715', displayName: 'Preeti Sharma', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1716', displayName: 'Renu Kumari', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1717', displayName: 'Kiran Bala', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1718', displayName: 'Jyoti Sharma', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1719', displayName: 'Monika Verma', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1720', displayName: 'Seema Gupta', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1721', displayName: 'Ritu Sharma', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1722', displayName: 'Anu Singh', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1723', displayName: 'Deepika Verma', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1724', displayName: 'Suman Kumari', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1725', displayName: 'Nisha Sharma', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1726', displayName: 'Pinky Devi', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1727', displayName: 'Lata Kumari', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1728', displayName: 'Mamta Sharma', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1729', displayName: 'Geeta Devi', trade: 'Automobile Engineering', semester: 2, section: 'J' },
  { rollNumber: '1730', displayName: 'Soniya Sharma', trade: 'Automobile Engineering', semester: 2, section: 'J' },

  // ── Automobile Section K — Sem 2 (1751–1778) ─────────────────────────
  { rollNumber: '1751', displayName: 'Aditi Sharma', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1752', displayName: 'Sneha Verma', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1753', displayName: 'Pooja Gupta', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1754', displayName: 'Neha Singh', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1755', displayName: 'Riya Sharma', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1756', displayName: 'Kavita Verma', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1757', displayName: 'Anjali Gupta', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1758', displayName: 'Komal Sharma', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1759', displayName: 'Shalini Singh', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1760', displayName: 'Meena Kumari', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1761', displayName: 'Sunita Devi', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1762', displayName: 'Rekha Sharma', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1763', displayName: 'Babita Kumari', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1764', displayName: 'Sarita Devi', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1765', displayName: 'Preeti Sharma', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1766', displayName: 'Renu Kumari', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1767', displayName: 'Kiran Bala', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1768', displayName: 'Jyoti Sharma', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1769', displayName: 'Monika Verma', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1770', displayName: 'Seema Gupta', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1771', displayName: 'Ritu Sharma', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1772', displayName: 'Anu Singh', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1773', displayName: 'Deepika Verma', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1774', displayName: 'Suman Kumari', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1775', displayName: 'Nisha Sharma', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1776', displayName: 'Pinky Devi', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1777', displayName: 'Lata Kumari', trade: 'Automobile Engineering', semester: 2, section: 'K' },
  { rollNumber: '1778', displayName: 'Mamta Sharma', trade: 'Automobile Engineering', semester: 2, section: 'K' },


  // ── Automobile Section J — Sem 4 (1601–1630) ─────────────────────────
  { rollNumber: '1601', displayName: 'Aditi Sharma', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1602', displayName: 'Sneha Verma', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1603', displayName: 'Pooja Gupta', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1604', displayName: 'Neha Singh', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1605', displayName: 'Riya Sharma', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1606', displayName: 'Kavita Verma', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1607', displayName: 'Anjali Gupta', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1608', displayName: 'Komal Sharma', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1609', displayName: 'Shalini Singh', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1610', displayName: 'Meena Kumari', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1611', displayName: 'Sunita Devi', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1612', displayName: 'Rekha Sharma', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1613', displayName: 'Babita Kumari', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1614', displayName: 'Sarita Devi', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1615', displayName: 'Preeti Sharma', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1616', displayName: 'Renu Kumari', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1617', displayName: 'Kiran Bala', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1618', displayName: 'Jyoti Sharma', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1619', displayName: 'Monika Verma', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1620', displayName: 'Seema Gupta', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1621', displayName: 'Ritu Sharma', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1622', displayName: 'Anu Singh', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1623', displayName: 'Deepika Verma', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1624', displayName: 'Suman Kumari', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1625', displayName: 'Nisha Sharma', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1626', displayName: 'Pinky Devi', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1627', displayName: 'Lata Kumari', trade: 'Automobile Engineering', semester: 4, section: 'J' },
  { rollNumber: '1628', displayName: 'Mamta Sharma', trade: 'Automobile Engineering', semester: 4, section: 'J' },


  // ── Automobile Section K — Sem 4 (1651–1680) ─────────────────────────
  { rollNumber: '1651', displayName: 'Aditi Sharma', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1652', displayName: 'Sneha Verma', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1653', displayName: 'Pooja Gupta', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1654', displayName: 'Neha Singh', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1655', displayName: 'Riya Sharma', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1656', displayName: 'Kavita Verma', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1657', displayName: 'Anjali Gupta', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1658', displayName: 'Komal Sharma', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1659', displayName: 'Shalini Singh', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1660', displayName: 'Meena Kumari', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1661', displayName: 'Sunita Devi', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1662', displayName: 'Rekha Sharma', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1663', displayName: 'Babita Kumari', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1664', displayName: 'Sarita Devi', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1665', displayName: 'Preeti Sharma', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1666', displayName: 'Renu Kumari', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1667', displayName: 'Kiran Bala', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1668', displayName: 'Jyoti Sharma', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1669', displayName: 'Monika Verma', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1670', displayName: 'Seema Gupta', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1671', displayName: 'Ritu Sharma', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1672', displayName: 'Anu Singh', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1673', displayName: 'Deepika Verma', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1674', displayName: 'Suman Kumari', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1675', displayName: 'Nisha Sharma', trade: 'Automobile Engineering', semester: 4, section: 'K' },
  { rollNumber: '1676', displayName: 'Pinky Devi', trade: 'Automobile Engineering', semester: 4, section: 'K' },


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
                console.log('\n🌱 Starting student seed (part 9)...\n')
              
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
                console.log('\n🎉 Part 9 seed complete!\n')
                process.exit(0)
              }
              
              seed().catch(err => {
                console.error('❌ Seed failed:', err)
                process.exit(1)
              })