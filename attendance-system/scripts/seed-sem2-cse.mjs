
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore'

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const students = [
  { rollNo: '1401', name: 'Aarav Sharma' },
  { rollNo: '1402', name: 'Vivaan Singh' },
  { rollNo: '1403', name: 'Aditya Kumar' },
  { rollNo: '1404', name: 'Arjun Verma' },
  { rollNo: '1405', name: 'Sai Patel' },
  { rollNo: '1406', name: 'Krishna Yadav' },
  { rollNo: '1407', name: 'Ishaan Gupta' },
  { rollNo: '1408', name: 'Rohan Mehta' },
  { rollNo: '1409', name: 'Karan Malhotra' },
  { rollNo: '1410', name: 'Rahul Das' },
  { rollNo: '1411', name: 'Amanpreet Singh' },
  { rollNo: '1412', name: 'Harsh Vardhan' },
  { rollNo: '1413', name: 'Manish Kumar' },
  { rollNo: '1414', name: 'Sandeep Sharma' },
  { rollNo: '1415', name: 'Rohit Kumar' },
  { rollNo: '1416', name: 'Deepak Verma' },
  { rollNo: '1417', name: 'Mohit Sharma' },
  { rollNo: '1418', name: 'Ankit Gupta' },
  { rollNo: '1419', name: 'Sumit Yadav' },
  { rollNo: '1420', name: 'Nikhil Jain' },
  { rollNo: '1421', name: 'Pankaj Kumar' },
  { rollNo: '1422', name: 'Rajat Singh' },
  { rollNo: '1423', name: 'Gaurav Sharma' },
  { rollNo: '1424', name: 'Abhishek Kumar' },
  { rollNo: '1425', name: 'Tarun Mehta' },
  { rollNo: '1426', name: 'Varun Sharma' },
  { rollNo: '1427', name: 'Shubham Gupta' },
  { rollNo: '1428', name: 'Yash Patel' },
  { rollNo: '1429', name: 'Vikas Kumar' },
  { rollNo: '1430', name: 'Akash Singh' },
  { rollNo: '1431', name: 'Ajay Kumar' },
  { rollNo: '1432', name: 'Neeraj Sharma' },
  { rollNo: '1433', name: 'Kapil Dev' },
  { rollNo: '1434', name: 'Rakesh Kumar' },
  { rollNo: '1435', name: 'Dinesh Sharma' },
  { rollNo: '1436', name: 'Lokesh Kumar' },
  { rollNo: '1437', name: 'Naveen Kumar' },
  { rollNo: '1438', name: 'Suraj Yadav' },
]

async function seedStudents() {
  console.log('🔄 Starting to seed 2nd semester CSE students...')
  let added = 0
  let failed = 0

  for (const student of students) {
    try {
      // Determine section (split into A and B for 38 students: 19 per section)
      const section = parseInt(student.rollNo) < 1420 ? 'A' : 'B'

      const docRef = await addDoc(collection(db, 'users'), {
        uid: `local-${student.rollNo}`,
        email: `${student.rollNo.toLowerCase()}@computerscienceandengineering-s2-${section.toLowerCase()}.attendx.edu`,
        displayName: student.name,
        rollNumber: student.rollNo,
        trade: 'Computer Science and Engineering',
        semester: 2,
        section: section,
        role: 'student',
        tutorId: '',
        theme: 'light',
        colorTheme: 'blue',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      console.log(`✅ Added ${student.name} (${student.rollNo}) - Section ${section}`)
      added++
    } catch (err) {
      console.error(`❌ Failed to add ${student.name} (${student.rollNo}):`, err.message)
      failed++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`✅ Success: ${added}/${students.length}`)
  console.log(`❌ Failed: ${failed}/${students.length}`)
  process.exit(0)
}

seedStudents()
