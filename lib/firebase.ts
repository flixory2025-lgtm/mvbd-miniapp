import { initializeApp } from "firebase/app"
import { getFirestore, doc, getDoc, setDoc, increment } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBtBaUSIlXwJDWytaiOfal3ha7OmZEwuYM",
  authDomain: "mvbdminiapp.firebaseapp.com",
  projectId: "mvbdminiapp",
  storageBucket: "mvbdminiapp.firebasestorage.app",
  messagingSenderId: "668051748254",
  appId: "1:668051748254:web:d4804b68429d853a0c928f",
  measurementId: "G-HQZ9SL4RX8",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
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

export function getTimeAgo(uploadDate: string): string {
  const now = new Date()
  const uploaded = new Date(uploadDate)
  const diffMs = now.getTime() - uploaded.getTime()

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffMonths = Math.floor(diffDays / 30)

  if (diffMinutes < 1) return "এখনই আপলোড"
  if (diffMinutes < 60) return `${diffMinutes} মিনিট আগে`
  if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`
  if (diffDays < 30) return `${diffDays} দিন আগে`
  return `${diffMonths} মাস আগে`
}
