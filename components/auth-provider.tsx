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
  claimSingleSession,
  getSessionReplacementMessage,
  subscribeToSingleSession,
} from "@/lib/single-session"
import {
  clearLegacyProfile,
  ensureUserProfile,
  getLegacyProfile,
  subscribeToUserProfile,
  type UserProfile,
} from "@/lib/user-profile"

type AuthContextValue = {
  user: User | null
  profile: UserProfile | null
  entitlement: Entitlement
  loading: boolean
  signUp: (email: string, password: string, profile?: { name?: string; dateOfBirth?: string; referralCode?: string }) => Promise<User>
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
    let unsubscribeProfile: (() => void) | undefined
    let unsubscribeSession: (() => void) | undefined

    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      unsubscribeProfile?.()
      unsubscribeSession?.()
      unsubscribeProfile = undefined
      unsubscribeSession = undefined
      setUser(nextUser)
      setLoading(Boolean(nextUser))

      if (!nextUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      void claimSingleSession(nextUser)
        .then((sessionId) => {
          unsubscribeSession = subscribeToSingleSession(nextUser.uid, sessionId, () => {
            if (typeof window !== "undefined") {
              window.alert(getSessionReplacementMessage())
            }
            void firebaseSignOut(auth)
          })
          return ensureUserProfile(nextUser, getLegacyProfile())
        })
        .then((nextProfile) => {
          setProfile(nextProfile)
          unsubscribeProfile = subscribeToUserProfile(
            nextUser.uid,
            (liveProfile) => setProfile(liveProfile),
            (error) => console.error("Unable to subscribe to user profile", error),
          )
        })
        .catch((error) => {
          console.error("Unable to initialize authenticated session", error)
          setProfile(null)
          void firebaseSignOut(auth)
        })
        .finally(() => {
          setLoading(false)
          clearLegacyProfile()
        })
    })

    return () => {
      unsubscribeProfile?.()
      unsubscribeSession?.()
      unsubscribeAuth()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      entitlement: getEntitlement(profile),
      loading,
      refreshProfile,
      async signUp(email, password, profile) {
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        await claimSingleSession(credential.user)
        await ensureUserProfile(credential.user, {
          name: profile?.name,
          dateOfBirth: profile?.dateOfBirth,
          email: credential.user.email || email,
          photoURL: credential.user.photoURL || "",
          referralCode: profile?.referralCode,
        })
        return credential.user
      },
      async signIn(email, password) {
        const credential = await signInWithEmailAndPassword(auth, email, password)
        await claimSingleSession(credential.user)
        return credential.user
      },
      async signInWithGoogle() {
        const credential = await signInWithPopup(auth, googleProvider)
        await claimSingleSession(credential.user)
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
