"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth"

import { getEntitlement, type Entitlement } from "@/lib/entitlements"
import { auth, googleProvider } from "@/lib/firebase"
import {
  clearLegacyProfile,
  ensureUserProfile,
  getLegacyProfile,
  type UserProfile,
} from "@/lib/user-profile"

type AuthContextValue = {
  user: User | null
  profile: UserProfile | null
  entitlement: Entitlement
  loading: boolean
  signUp: (email: string, password: string) => Promise<User>
  signIn: (email: string, password: string) => Promise<User>
  signInWithGoogle: () => Promise<User>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    if (!auth.currentUser) {
      setProfile(null)
      return
    }

    const nextProfile = await ensureUserProfile(auth.currentUser, getLegacyProfile())
    setProfile(nextProfile)
    clearLegacyProfile()
  }

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      if (!nextUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      void ensureUserProfile(nextUser, getLegacyProfile())
        .then((nextProfile) => {
          setProfile(nextProfile)
        })
        .catch((error) => {
          console.error("Unable to load user profile", error)
          setProfile(null)
        })
        .finally(() => {
          setLoading(false)
          clearLegacyProfile()
        })
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      entitlement: getEntitlement(profile),
      loading,
      refreshProfile,
      async signUp(email, password) {
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        return credential.user
      },
      async signIn(email, password) {
        const credential = await signInWithEmailAndPassword(auth, email, password)
        return credential.user
      },
      async signInWithGoogle() {
        const credential = await signInWithPopup(auth, googleProvider)
        return credential.user
      },
      async signOut() {
        await firebaseSignOut(auth)
      },
    }),
    [loading, profile, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
