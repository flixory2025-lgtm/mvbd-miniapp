import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore, doc, getDoc, setDoc, increment } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "AIzaSyBtBaUSIlXwJDWytaiOfal3ha7OmZEwuYM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || "mvbdminiapp.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "mvbdminiapp",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "mvbdminiapp.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || "668051748254",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || "1:668051748254:web:d4804b68429d853a0c928f",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)

// Function to increment view count for a movie
export async function incrementMovieView(movieId: number): Promise<number> {
  try {
    const movieRef = doc(db, "movieViews", movieId.toString())
    const movieDoc = await getDoc(movieRef)

    if (movieDoc.exists()) {
      await setDoc(movieRef, { views: increment(1) }, { merge: true })
      const updatedDoc = await getDoc(movieRef)
      return updatedDoc.data()?.views || 0
    } else {
      await setDoc(movieRef, { views: 1 })
      return 1
    }
  } catch (error) {
    console.error("Error incrementing view:", error)
    return 0
  }
}

// Function to get view count for a movie
export async function getMovieViews(movieId: number): Promise<number> {
  try {
    const movieRef = doc(db, "movieViews", movieId.toString())
    const movieDoc = await getDoc(movieRef)

    if (movieDoc.exists()) {
      return movieDoc.data()?.views || 0
    }
    return 0
  } catch (error) {
    console.error("Error getting views:", error)
    return 0
  }
}

// Function to set movie upload time
export async function setMovieUploadTime(movieId: number): Promise<void> {
  try {
    const movieRef = doc(db, "movieUploads", movieId.toString())
    const movieDoc = await getDoc(movieRef)

    if (!movieDoc.exists()) {
      await setDoc(movieRef, {
        uploadedAt: new Date().toISOString(),
        views: 0,
      })
    }
  } catch (error) {
    console.error("Error setting upload time:", error)
  }
}

// Function to get movie upload time
export async function getMovieUploadTime(movieId: number): Promise<string | null> {
  try {
    const movieRef = doc(db, "movieUploads", movieId.toString())
    const movieDoc = await getDoc(movieRef)

    if (movieDoc.exists()) {
      return movieDoc.data()?.uploadedAt || null
    }
    return null
  } catch (error) {
    console.error("Error getting upload time:", error)
    return null
  }
}

export function getTimeAgo(uploadDate: string | Date): string {
  const now = new Date()
  const uploaded = typeof uploadDate === "string" ? new Date(uploadDate) : uploadDate
  const diffMs = now.getTime() - uploaded.getTime()

  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSeconds < 60) return "Just now"
  if (diffMinutes === 1) return "1 minute ago"
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`
  if (diffHours === 1) return "1 hour ago"
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays === 1) return "1 day ago"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffWeeks === 1) return "1 week ago"
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`
  if (diffMonths === 1) return "1 month ago"
  if (diffMonths < 12) return `${diffMonths} months ago`
  if (diffYears === 1) return "1 year ago"
  return `${diffYears} years ago`
}
