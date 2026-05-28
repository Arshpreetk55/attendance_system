//seed.mjs
// ─────────────────────────────────────────────────────────────────
//  SEED SCRIPT — Trades & Subjects
//  Run once: node seed.mjs
// ─────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore'
import { readFileSync } from 'fs'

// Load .env.local
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

// ─── TRADES ───────────────────────────────────────────────────────
const TRADES = [
  { name: 'Computer Science and Engineering',       code: 'CSE',  totalSemesters: 6, sections: ['L', 'M'] },
  { name: 'Electronics and Communication Engineering', code: 'ECE', totalSemesters: 6, sections: ['G', 'H'] },
  { name: 'Information Technology',                 code: 'IT',   totalSemesters: 6, sections: ['R', 'S'] },
  { name: 'Electrical Engineering',                 code: 'EE',   totalSemesters: 6, sections: ['E', 'F'] },
  { name: 'Civil Engineering',                      code: 'CE',   totalSemesters: 6, sections: ['A', 'B'] },
  { name: 'Mechanical Engineering',                 code: 'ME',   totalSemesters: 6, sections: ['C', 'D'] },
  { name: 'Automobile Engineering',                 code: 'AE',   totalSemesters: 7, sections: ['J', 'K'] },
]

// ─── SUBJECTS ─────────────────────────────────────────────────────
const SUBJECTS = [

  // ── CSE ──────────────────────────────────────────────────────────
  { trade: 'Computer Science and Engineering', semester: 1, code: '1.1', name: 'English and Communication Skills - I' },
  { trade: 'Computer Science and Engineering', semester: 1, code: '1.2', name: 'Applied Mathematics-I' },
  { trade: 'Computer Science and Engineering', semester: 1, code: '1.3', name: 'Applied Physics - I' },
  { trade: 'Computer Science and Engineering', semester: 1, code: '1.4', name: 'Environmental Studies' },
  { trade: 'Computer Science and Engineering', semester: 1, code: '1.5', name: 'Computer Fundamentals and Information Technology' },
  { trade: 'Computer Science and Engineering', semester: 1, code: '1.6', name: 'Engineering Drawing - I' },
  { trade: 'Computer Science and Engineering', semester: 1, code: '1.7', name: 'General Workshop - I' },
  { trade: 'Computer Science and Engineering', semester: 1, code: '1.8', name: 'Entrepreneurship Mindset-I' },

  { trade: 'Computer Science and Engineering', semester: 2, code: '2.1', name: 'English and Communication Skills - II' },
  { trade: 'Computer Science and Engineering', semester: 2, code: '2.2', name: 'Applied Mathematics-II' },
  { trade: 'Computer Science and Engineering', semester: 2, code: '2.3', name: 'Applied Physics-II' },
  { trade: 'Computer Science and Engineering', semester: 2, code: '2.4', name: 'Applied Chemistry' },
  { trade: 'Computer Science and Engineering', semester: 2, code: '2.5', name: 'Basics of Electrical and Electronics Engineering' },
  { trade: 'Computer Science and Engineering', semester: 2, code: '2.6', name: 'Desk Top Publishing (DTP) Fundamentals' },
  { trade: 'Computer Science and Engineering', semester: 2, code: '2.7', name: 'Computer Workshop' },
  { trade: 'Computer Science and Engineering', semester: 2, code: '2.8', name: 'General Workshop - II' },
  { trade: 'Computer Science and Engineering', semester: 2, code: '2.9', name: 'Entrepreneurship Mindset-II' },

  { trade: 'Computer Science and Engineering', semester: 3, code: '3.1', name: 'Digital Electronics' },
  { trade: 'Computer Science and Engineering', semester: 3, code: '3.2', name: 'Computer Programming Using C' },
  { trade: 'Computer Science and Engineering', semester: 3, code: '3.3', name: 'Database Management System' },
  { trade: 'Computer Science and Engineering', semester: 3, code: '3.4', name: 'Operating Systems' },
  { trade: 'Computer Science and Engineering', semester: 3, code: '3.5', name: 'Internet and Web Technologies' },
  { trade: 'Computer Science and Engineering', semester: 3, code: '3.6', name: 'Open Elective (Offline/MOOCs)' },

  { trade: 'Computer Science and Engineering', semester: 4, code: '4.1', name: 'Generic Skills and Entrepreneurship Development' },
  { trade: 'Computer Science and Engineering', semester: 4, code: '4.2', name: 'Data Structures' },
  { trade: 'Computer Science and Engineering', semester: 4, code: '4.3', name: 'Object Oriented Programming Using Java' },
  { trade: 'Computer Science and Engineering', semester: 4, code: '4.4', name: 'Computer Architecture' },
  { trade: 'Computer Science and Engineering', semester: 4, code: '4.5', name: 'Computer Network and Security' },
  { trade: 'Computer Science and Engineering', semester: 4, code: '4.6', name: 'Minor Project' },

  { trade: 'Computer Science and Engineering', semester: 5, code: '5.1', name: 'Artificial Intelligence' },
  { trade: 'Computer Science and Engineering', semester: 5, code: '5.2', name: 'Web Development using PHP' },
  { trade: 'Computer Science and Engineering', semester: 5, code: '5.3', name: 'Computer Programming Using Python' },
  { trade: 'Computer Science and Engineering', semester: 5, code: '5.4', name: 'Cloud Computing' },
  { trade: 'Computer Science and Engineering', semester: 5, code: '5.5', name: 'Open-Source Technologies' },
  { trade: 'Computer Science and Engineering', semester: 5, code: '5.6', name: 'Program Elective' },
  { trade: 'Computer Science and Engineering', semester: 5, code: '5.7', name: 'Basics of Management' },

  // ── ECE ──────────────────────────────────────────────────────────
  { trade: 'Electronics and Communication Engineering', semester: 1, code: '1.1', name: 'English and Communication Skills-I' },
  { trade: 'Electronics and Communication Engineering', semester: 1, code: '1.2', name: 'Applied Mathematics-I' },
  { trade: 'Electronics and Communication Engineering', semester: 1, code: '1.3', name: 'Applied Physics - I' },
  { trade: 'Electronics and Communication Engineering', semester: 1, code: '1.4', name: 'Applied Chemistry' },
  { trade: 'Electronics and Communication Engineering', semester: 1, code: '1.5', name: 'Basics of Information Technology' },
  { trade: 'Electronics and Communication Engineering', semester: 1, code: '1.6', name: 'Engineering Drawing - I' },
  { trade: 'Electronics and Communication Engineering', semester: 1, code: '1.7', name: 'General Workshop - I' },
  { trade: 'Electronics and Communication Engineering', semester: 1, code: '1.8', name: 'Entrepreneurship Mindset-I' },

  { trade: 'Electronics and Communication Engineering', semester: 2, code: '2.1', name: 'English and Communication Skills - II' },
  { trade: 'Electronics and Communication Engineering', semester: 2, code: '2.2', name: 'Applied Mathematics-II' },
  { trade: 'Electronics and Communication Engineering', semester: 2, code: '2.3', name: 'Applied Physics-II' },
  { trade: 'Electronics and Communication Engineering', semester: 2, code: '2.4', name: 'Environmental Studies' },
  { trade: 'Electronics and Communication Engineering', semester: 2, code: '2.5', name: 'Basic Electrical and Electronics Engineering' },
  { trade: 'Electronics and Communication Engineering', semester: 2, code: '2.6', name: 'General Workshop - II' },
  { trade: 'Electronics and Communication Engineering', semester: 2, code: '2.7', name: 'Electrical and Electronics Workshop' },
  { trade: 'Electronics and Communication Engineering', semester: 2, code: '2.8', name: 'Entrepreneurship Mindset-II' },

  { trade: 'Electronics and Communication Engineering', semester: 3, code: '3.1', name: 'Electronic Instruments and Measurement' },
  { trade: 'Electronics and Communication Engineering', semester: 3, code: '3.2', name: 'Principles of Communication Engineering' },
  { trade: 'Electronics and Communication Engineering', semester: 3, code: '3.3', name: 'Digital Electronics' },
  { trade: 'Electronics and Communication Engineering', semester: 3, code: '3.4', name: 'Electronic Devices and Circuits' },
  { trade: 'Electronics and Communication Engineering', semester: 3, code: '3.5', name: 'Electrical Machines' },
  { trade: 'Electronics and Communication Engineering', semester: 3, code: '3.6', name: 'Open Elective (Offline/MOOCs)' },

  { trade: 'Electronics and Communication Engineering', semester: 4, code: '4.1', name: 'Generic Skills and Entrepreneurship Development' },
  { trade: 'Electronics and Communication Engineering', semester: 4, code: '4.2', name: 'Communication Systems' },
  { trade: 'Electronics and Communication Engineering', semester: 4, code: '4.3', name: 'Industrial Electronics' },
  { trade: 'Electronics and Communication Engineering', semester: 4, code: '4.4', name: 'Microcontrollers and Embedded System' },
  { trade: 'Electronics and Communication Engineering', semester: 4, code: '4.5', name: 'Electronics Design and Simulation Techniques' },
  { trade: 'Electronics and Communication Engineering', semester: 4, code: '4.6', name: 'Minor Project' },

  { trade: 'Electronics and Communication Engineering', semester: 5, code: '5.1', name: 'Microwave Engineering' },
  { trade: 'Electronics and Communication Engineering', semester: 5, code: '5.2', name: 'Optical Fiber Communication' },
  { trade: 'Electronics and Communication Engineering', semester: 5, code: '5.3', name: 'Digital Communication' },
  { trade: 'Electronics and Communication Engineering', semester: 5, code: '5.4', name: 'VLSI System Design' },
  { trade: 'Electronics and Communication Engineering', semester: 5, code: '5.5', name: 'Wireless and Mobile Communication' },
  { trade: 'Electronics and Communication Engineering', semester: 5, code: '5.6', name: 'Program Elective' },
  { trade: 'Electronics and Communication Engineering', semester: 5, code: '5.7', name: 'Basics of Management' },

  // ── IT ───────────────────────────────────────────────────────────
  { trade: 'Information Technology', semester: 1, code: '1.1', name: 'English and Communication Skills-I' },
  { trade: 'Information Technology', semester: 1, code: '1.2', name: 'Applied Mathematics-I' },
  { trade: 'Information Technology', semester: 1, code: '1.3', name: 'Applied Physics - I' },
  { trade: 'Information Technology', semester: 1, code: '1.4', name: 'Environmental Studies' },
  { trade: 'Information Technology', semester: 1, code: '1.5', name: 'Computer Fundamentals and Information Technology' },
  { trade: 'Information Technology', semester: 1, code: '1.6', name: 'Engineering Drawing - I' },
  { trade: 'Information Technology', semester: 1, code: '1.7', name: 'General Workshop - I' },
  { trade: 'Information Technology', semester: 1, code: '1.8', name: 'Entrepreneurship Mindset-I' },

  { trade: 'Information Technology', semester: 2, code: '2.1', name: 'English and Communication Skills - II' },
  { trade: 'Information Technology', semester: 2, code: '2.2', name: 'Applied Mathematics-II' },
  { trade: 'Information Technology', semester: 2, code: '2.3', name: 'Applied Physics-II' },
  { trade: 'Information Technology', semester: 2, code: '2.4', name: 'Applied Chemistry' },
  { trade: 'Information Technology', semester: 2, code: '2.5', name: 'Basics of Electrical and Electronics Engineering' },
  { trade: 'Information Technology', semester: 2, code: '2.6', name: 'Desk Top Publishing (DTP) Fundamentals' },
  { trade: 'Information Technology', semester: 2, code: '2.7', name: 'Computer Workshop' },
  { trade: 'Information Technology', semester: 2, code: '2.8', name: 'General Workshop - II' },
  { trade: 'Information Technology', semester: 2, code: '2.9', name: 'Entrepreneurship Mindset-II' },

  { trade: 'Information Technology', semester: 3, code: '3.1', name: 'Digital Electronics' },
  { trade: 'Information Technology', semester: 3, code: '3.2', name: 'Computer Programming Using C' },
  { trade: 'Information Technology', semester: 3, code: '3.3', name: 'Database Management System' },
  { trade: 'Information Technology', semester: 3, code: '3.4', name: 'Operating Systems' },
  { trade: 'Information Technology', semester: 3, code: '3.5', name: 'Internet and Web Technologies' },
  { trade: 'Information Technology', semester: 3, code: '3.6', name: 'Open Elective (Offline/MOOCs)' },

  { trade: 'Information Technology', semester: 4, code: '4.1', name: 'Generic Skills and Entrepreneurship Development' },
  { trade: 'Information Technology', semester: 4, code: '4.2', name: 'Data Structures' },
  { trade: 'Information Technology', semester: 4, code: '4.3', name: 'Object Oriented Programming Using Java' },
  { trade: 'Information Technology', semester: 4, code: '4.4', name: 'Computer Architecture' },
  { trade: 'Information Technology', semester: 4, code: '4.5', name: 'Computer Network and Security' },
  { trade: 'Information Technology', semester: 4, code: '4.6', name: 'Minor Project' },

  { trade: 'Information Technology', semester: 5, code: '5.1', name: 'Artificial Intelligence' },
  { trade: 'Information Technology', semester: 5, code: '5.2', name: 'Web Development using PHP' },
  { trade: 'Information Technology', semester: 5, code: '5.3', name: 'Computer Programming Using Python' },
  { trade: 'Information Technology', semester: 5, code: '5.4', name: 'Data Science with Python' },
  { trade: 'Information Technology', semester: 5, code: '5.5', name: 'Open-Source Technologies' },
  { trade: 'Information Technology', semester: 5, code: '5.6', name: 'Program Elective' },
  { trade: 'Information Technology', semester: 5, code: '5.7', name: 'Basics of Management' },

  // ── ELECTRICAL ENGINEERING ────────────────────────────────────────
  { trade: 'Electrical Engineering', semester: 1, code: '1.1', name: 'English and Communication Skills - I' },
  { trade: 'Electrical Engineering', semester: 1, code: '1.2', name: 'Applied Mathematics-I' },
  { trade: 'Electrical Engineering', semester: 1, code: '1.3', name: 'Applied Physics - I' },
  { trade: 'Electrical Engineering', semester: 1, code: '1.4', name: 'Applied Chemistry' },
  { trade: 'Electrical Engineering', semester: 1, code: '1.5', name: 'Entrepreneurship Mindset-I' },
  { trade: 'Electrical Engineering', semester: 1, code: '1.6', name: 'Engineering Drawing - I' },
  { trade: 'Electrical Engineering', semester: 1, code: '1.7', name: 'General Workshop Practice - I' },

  { trade: 'Electrical Engineering', semester: 2, code: '2.1', name: 'English and Communication Skills - II' },
  { trade: 'Electrical Engineering', semester: 2, code: '2.2', name: 'Applied Mathematics-II' },
  { trade: 'Electrical Engineering', semester: 2, code: '2.3', name: 'Applied Physics-II' },
  { trade: 'Electrical Engineering', semester: 2, code: '2.4', name: 'Fundamentals of Electrical Engineering' },
  { trade: 'Electrical Engineering', semester: 2, code: '2.5', name: 'Electrical Engineering Materials' },
  { trade: 'Electrical Engineering', semester: 2, code: '2.6', name: 'Environmental Studies' },
  { trade: 'Electrical Engineering', semester: 2, code: '2.7', name: 'Electrical Workshop Practice-I' },
  { trade: 'Electrical Engineering', semester: 2, code: '2.8', name: 'Basics of Information Technology' },
  { trade: 'Electrical Engineering', semester: 2, code: '2.9', name: 'Entrepreneurship Mindset-II' },

  { trade: 'Electrical Engineering', semester: 3, code: '3.1', name: 'Non-Conventional Energy Sources' },
  { trade: 'Electrical Engineering', semester: 3, code: '3.2', name: 'Electrical Machines - I' },
  { trade: 'Electrical Engineering', semester: 3, code: '3.3', name: 'Electronics Devices and Circuits' },
  { trade: 'Electrical Engineering', semester: 3, code: '3.4', name: 'Computer Programming Applications' },
  { trade: 'Electrical Engineering', semester: 3, code: '3.5', name: 'Electrical Workshop Practice - II' },
  { trade: 'Electrical Engineering', semester: 3, code: '3.6', name: 'Open Elective (Offline/Online)' },

  { trade: 'Electrical Engineering', semester: 4, code: '4.1', name: 'Generic Skills and Entrepreneurship Development' },
  { trade: 'Electrical Engineering', semester: 4, code: '4.2', name: 'Basics of Digital Electronics' },
  { trade: 'Electrical Engineering', semester: 4, code: '4.3', name: 'Electrical Machines - II' },
  { trade: 'Electrical Engineering', semester: 4, code: '4.4', name: 'Electrical Measurement and Instrumentation' },
  { trade: 'Electrical Engineering', semester: 4, code: '4.5', name: 'Industrial Electronics and Control of Drives' },
  { trade: 'Electrical Engineering', semester: 4, code: '4.6', name: 'Electrical Engineering Design and Drawing' },

  { trade: 'Electrical Engineering', semester: 5, code: '5.1', name: 'Utilization of Electrical Energy' },
  { trade: 'Electrical Engineering', semester: 5, code: '5.2', name: 'Electrical Power' },
  { trade: 'Electrical Engineering', semester: 5, code: '5.3', name: 'Microcontroller and Applications' },
  { trade: 'Electrical Engineering', semester: 5, code: '5.4', name: 'Installation and Maintenance of Electrical Equipment' },
  { trade: 'Electrical Engineering', semester: 5, code: '5.5', name: 'Program Elective' },
  { trade: 'Electrical Engineering', semester: 5, code: '5.6', name: 'Minor Project Work' },

  // ── CIVIL ENGINEERING ─────────────────────────────────────────────
  { trade: 'Civil Engineering', semester: 1, code: '1.1', name: 'English and Communication Skills - I' },
  { trade: 'Civil Engineering', semester: 1, code: '1.2', name: 'Applied Mathematics-I' },
  { trade: 'Civil Engineering', semester: 1, code: '1.3', name: 'Applied Physics - I' },
  { trade: 'Civil Engineering', semester: 1, code: '1.4', name: 'Applied Chemistry' },
  { trade: 'Civil Engineering', semester: 1, code: '1.5', name: 'Basics of Information Technology' },
  { trade: 'Civil Engineering', semester: 1, code: '1.6', name: 'Engineering Drawing - I' },
  { trade: 'Civil Engineering', semester: 1, code: '1.7', name: 'General Workshop Practice - I' },
  { trade: 'Civil Engineering', semester: 1, code: '1.8', name: 'Entrepreneurship Mindset-I' },

  { trade: 'Civil Engineering', semester: 2, code: '2.1', name: 'English and Communication Skills - II' },
  { trade: 'Civil Engineering', semester: 2, code: '2.2', name: 'Applied Mathematics-II' },
  { trade: 'Civil Engineering', semester: 2, code: '2.3', name: 'Applied Physics-II' },
  { trade: 'Civil Engineering', semester: 2, code: '2.4', name: 'Environmental Studies' },
  { trade: 'Civil Engineering', semester: 2, code: '2.5', name: 'Applied Mechanics' },
  { trade: 'Civil Engineering', semester: 2, code: '2.6', name: 'Construction Material' },
  { trade: 'Civil Engineering', semester: 2, code: '2.7', name: 'Introduction to CAD' },
  { trade: 'Civil Engineering', semester: 2, code: '2.8', name: 'Entrepreneurship Mindset-II' },

  { trade: 'Civil Engineering', semester: 3, code: '3.1', name: 'Fluid Mechanics' },
  { trade: 'Civil Engineering', semester: 3, code: '3.2', name: 'Surveying' },
  { trade: 'Civil Engineering', semester: 3, code: '3.3', name: 'Structural Mechanics' },
  { trade: 'Civil Engineering', semester: 3, code: '3.4', name: 'Building Construction' },
  { trade: 'Civil Engineering', semester: 3, code: '3.5', name: 'Building Drawing' },
  { trade: 'Civil Engineering', semester: 3, code: '3.6', name: 'Open Elective (Offline/MOOCs)' },

  { trade: 'Civil Engineering', semester: 4, code: '4.1', name: 'Generic Skills and Entrepreneurship Development' },
  { trade: 'Civil Engineering', semester: 4, code: '4.2', name: 'Concrete Technology' },
  { trade: 'Civil Engineering', semester: 4, code: '4.3', name: 'Water Supply and Waste Water Engineering' },
  { trade: 'Civil Engineering', semester: 4, code: '4.4', name: 'Water Resources Engineering' },
  { trade: 'Civil Engineering', semester: 4, code: '4.5', name: 'Modern Surveying' },
  { trade: 'Civil Engineering', semester: 4, code: '4.6', name: 'Public Health and Water Resources Engineering Drawing' },
  { trade: 'Civil Engineering', semester: 4, code: '4.7', name: 'Minor Project Work' },

  { trade: 'Civil Engineering', semester: 5, code: '5.1', name: 'Reinforced Concrete Design' },
  { trade: 'Civil Engineering', semester: 5, code: '5.2', name: 'Highway, Railways and Bridge Engineering' },
  { trade: 'Civil Engineering', semester: 5, code: '5.3', name: 'R.C.C. and Steel Structures Drawings' },
  { trade: 'Civil Engineering', semester: 5, code: '5.4', name: 'Steel Structures Design' },
  { trade: 'Civil Engineering', semester: 5, code: '5.5', name: 'Soil and Foundation Engineering' },
  { trade: 'Civil Engineering', semester: 5, code: '5.6', name: 'Programme Elective' },
  { trade: 'Civil Engineering', semester: 5, code: '5.7', name: 'Survey Camp' },

  // ── MECHANICAL ENGINEERING ────────────────────────────────────────
  { trade: 'Mechanical Engineering', semester: 1, code: '1.1', name: 'English and Communication Skills - I' },
  { trade: 'Mechanical Engineering', semester: 1, code: '1.2', name: 'Applied Mathematics-I' },
  { trade: 'Mechanical Engineering', semester: 1, code: '1.3', name: 'Applied Physics - I' },
  { trade: 'Mechanical Engineering', semester: 1, code: '1.4', name: 'Applied Chemistry' },
  { trade: 'Mechanical Engineering', semester: 1, code: '1.5', name: 'Basics of Information Technology' },
  { trade: 'Mechanical Engineering', semester: 1, code: '1.6', name: 'Engineering Drawing - I' },
  { trade: 'Mechanical Engineering', semester: 1, code: '1.7', name: 'General Workshop Practice - I' },
  { trade: 'Mechanical Engineering', semester: 1, code: '1.8', name: 'Entrepreneurship Mindset-I' },

  { trade: 'Mechanical Engineering', semester: 2, code: '2.1', name: 'English and Communication Skills - II' },
  { trade: 'Mechanical Engineering', semester: 2, code: '2.2', name: 'Applied Mathematics-II' },
  { trade: 'Mechanical Engineering', semester: 2, code: '2.3', name: 'Applied Physics-II' },
  { trade: 'Mechanical Engineering', semester: 2, code: '2.4', name: 'Environmental Studies' },
  { trade: 'Mechanical Engineering', semester: 2, code: '2.5', name: 'Applied Mechanics' },
  { trade: 'Mechanical Engineering', semester: 2, code: '2.6', name: 'Engineering Drawing - II' },
  { trade: 'Mechanical Engineering', semester: 2, code: '2.7', name: 'General Workshop Practice-II' },
  { trade: 'Mechanical Engineering', semester: 2, code: '2.8', name: 'Entrepreneurship Mindset-II' },

  { trade: 'Mechanical Engineering', semester: 3, code: '3.1', name: 'Engineering Materials' },
  { trade: 'Mechanical Engineering', semester: 3, code: '3.2', name: 'Elements of Electrical and Electronics Engineering' },
  { trade: 'Mechanical Engineering', semester: 3, code: '3.3', name: 'Metrology and Instrumentation' },
  { trade: 'Mechanical Engineering', semester: 3, code: '3.4', name: 'Mechanical Engineering Drawing-I' },
  { trade: 'Mechanical Engineering', semester: 3, code: '3.5', name: 'Workshop Technology - I' },
  { trade: 'Mechanical Engineering', semester: 3, code: '3.6', name: 'Open Elective (Online/Offline)' },

  { trade: 'Mechanical Engineering', semester: 4, code: '4.1', name: 'Generic Skills and Entrepreneurship Development' },
  { trade: 'Mechanical Engineering', semester: 4, code: '4.2', name: 'Hydraulics and Pneumatics' },
  { trade: 'Mechanical Engineering', semester: 4, code: '4.3', name: 'Strength of Materials' },
  { trade: 'Mechanical Engineering', semester: 4, code: '4.4', name: 'Thermodynamics-I' },
  { trade: 'Mechanical Engineering', semester: 4, code: '4.5', name: 'Mechanical Engineering Drawing - II' },
  { trade: 'Mechanical Engineering', semester: 4, code: '4.6', name: 'Workshop Technology - II' },

  { trade: 'Mechanical Engineering', semester: 5, code: '5.1', name: 'Refrigeration and Air Conditioning' },
  { trade: 'Mechanical Engineering', semester: 5, code: '5.2', name: 'CNC Machines and Workshop Technology' },
  { trade: 'Mechanical Engineering', semester: 5, code: '5.3', name: 'Thermodynamics-II' },
  { trade: 'Mechanical Engineering', semester: 5, code: '5.4', name: 'Theory of Machines' },
  { trade: 'Mechanical Engineering', semester: 5, code: '5.5', name: 'Automobile Engineering' },
  { trade: 'Mechanical Engineering', semester: 5, code: '5.6', name: 'Programme Elective' },
  { trade: 'Mechanical Engineering', semester: 5, code: '5.7', name: 'Computer Aided Drafting' },
  { trade: 'Mechanical Engineering', semester: 5, code: '5.8', name: 'Basics of Management' },

  // ── AUTOMOBILE ENGINEERING ────────────────────────────────────────
  { trade: 'Automobile Engineering', semester: 1, code: '1.1', name: 'English and Communication Skills - I' },
  { trade: 'Automobile Engineering', semester: 1, code: '1.2', name: 'Applied Mathematics-I' },
  { trade: 'Automobile Engineering', semester: 1, code: '1.3', name: 'Applied Physics - I' },
  { trade: 'Automobile Engineering', semester: 1, code: '1.4', name: 'Applied Chemistry' },
  { trade: 'Automobile Engineering', semester: 1, code: '1.5', name: 'Engineering Drawing - I' },
  { trade: 'Automobile Engineering', semester: 1, code: '1.6', name: 'General Workshop Practice - I' },
  { trade: 'Automobile Engineering', semester: 1, code: '1.7', name: 'Basics of Automobile Engineering' },
  { trade: 'Automobile Engineering', semester: 1, code: '1.8', name: 'Entrepreneurship Mindset-I' },

  { trade: 'Automobile Engineering', semester: 2, code: '2.1', name: 'English and Communication Skills - II' },
  { trade: 'Automobile Engineering', semester: 2, code: '2.2', name: 'Applied Mathematics-II' },
  { trade: 'Automobile Engineering', semester: 2, code: '2.3', name: 'Applied Physics-II' },
  { trade: 'Automobile Engineering', semester: 2, code: '2.4', name: 'Environmental Studies' },
  { trade: 'Automobile Engineering', semester: 2, code: '2.5', name: 'Applied Mechanics' },
  { trade: 'Automobile Engineering', semester: 2, code: '2.6', name: 'Engineering Drawing - II' },
  { trade: 'Automobile Engineering', semester: 2, code: '2.7', name: 'General Workshop Practice-II' },
  { trade: 'Automobile Engineering', semester: 2, code: '2.8', name: 'Entrepreneurship Mindset-II' },

  { trade: 'Automobile Engineering', semester: 3, code: '3.1', name: 'Automotive Materials' },
  { trade: 'Automobile Engineering', semester: 3, code: '3.2', name: 'Garage Equipment' },
  { trade: 'Automobile Engineering', semester: 3, code: '3.3', name: 'Automobile Engine-I' },
  { trade: 'Automobile Engineering', semester: 3, code: '3.4', name: 'Automobile Engineering Drawing' },
  { trade: 'Automobile Engineering', semester: 3, code: '3.5', name: 'Workshop Technology - I' },
  { trade: 'Automobile Engineering', semester: 3, code: '3.6', name: 'Open Elective (Online/Offline)' },

  { trade: 'Automobile Engineering', semester: 4, code: '4.1', name: 'Generic Skills and Entrepreneurship Development' },
  { trade: 'Automobile Engineering', semester: 4, code: '4.2', name: 'Automobile Engine-II' },
  { trade: 'Automobile Engineering', semester: 4, code: '4.3', name: 'Strength of Materials' },
  { trade: 'Automobile Engineering', semester: 4, code: '4.4', name: 'Chassis, Body and Transmission-I' },
  { trade: 'Automobile Engineering', semester: 4, code: '4.5', name: 'CAD in Automobile Engineering' },
  { trade: 'Automobile Engineering', semester: 4, code: '4.6', name: 'Workshop Technology - II' },

  { trade: 'Automobile Engineering', semester: 5, code: '5.1', name: 'Basics of Management' },
  { trade: 'Automobile Engineering', semester: 5, code: '5.2', name: 'CNC Machine Programming' },
  { trade: 'Automobile Engineering', semester: 5, code: '5.3', name: 'Automobile Electrical and Electronics Equipment' },
  { trade: 'Automobile Engineering', semester: 5, code: '5.4', name: 'Chassis, Body and Transmission-II' },
  { trade: 'Automobile Engineering', semester: 5, code: '5.5', name: 'Elements of Design' },
  { trade: 'Automobile Engineering', semester: 5, code: '5.6', name: 'Automobile Repair, Maintenance and Driving Practice-I' },

  { trade: 'Automobile Engineering', semester: 6, code: '6.1', name: 'Tractor, Farming Equipment and Earth Moving Machinery' },
  { trade: 'Automobile Engineering', semester: 6, code: '6.2', name: 'Production Management' },
  { trade: 'Automobile Engineering', semester: 6, code: '6.3', name: 'Motor Vehicle Act and Transport Management' },
  { trade: 'Automobile Engineering', semester: 6, code: '6.4', name: 'Program Elective' },
  { trade: 'Automobile Engineering', semester: 6, code: '6.5', name: 'Automobile Repair, Maintenance and Driving Practice-II' },
  { trade: 'Automobile Engineering', semester: 6, code: '6.6', name: 'Project Work' },

  // ── PD AUTO / SEMESTER 7 ───────────────────────────────────────────
  { trade: 'Automobile Engineering', semester: 7, code: '7.1', name: 'FDR' },
  { trade: 'Automobile Engineering', semester: 7, code: '7.2', name: 'GMT' },
  { trade: 'Automobile Engineering', semester: 7, code: '7.3', name: 'AT' },
  { trade: 'Automobile Engineering', semester: 7, code: '7.4', name: 'TA-I' },
  { trade: 'Automobile Engineering', semester: 7, code: '7.5', name: 'GP' },
]

// ─── SEED FUNCTION ────────────────────────────────────────────────
async function clearCollection(name) {
  const snap = await getDocs(collection(db, name))
  for (const d of snap.docs) await deleteDoc(d.ref)
  console.log(`🗑  Cleared ${snap.size} old docs from '${name}'`)
}

async function seed() {
  console.log('\n🌱 Starting seed...\n')

  await clearCollection('trades')
  await clearCollection('subjects')

  for (const trade of TRADES) {
    const ref = await addDoc(collection(db, 'trades'), trade)
    console.log(`✅ Trade added: ${trade.name} (${ref.id})`)
  }

  let count = 0
  for (const subject of SUBJECTS) {
    await addDoc(collection(db, 'subjects'), subject)
    count++
  }

  console.log(`\n✅ ${count} subjects added across 7 trades`)
  console.log('\n🎉 Seed complete! Check your Firebase Console.\n')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
