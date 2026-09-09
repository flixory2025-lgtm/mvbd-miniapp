"use client"

import {
  createContext,
  useCallback,
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
  signOut,
  updateProfile,
  type User,
} from "firebase/auth"

import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"

import {
  auth,
  db,
  googleProvider,
  enableAuthPersistence,
} from "@/lib/firebase"

import {
  ensureUserProfile,
  normalizeProfile,
  type UserProfile,
} from "@/lib/user-profile"

import {
  getEntitlement,
  type Entitlement,
} from "@/lib/entitlements"

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  entitlement: Entitlement
  loading: boolean

  signUp: (
    name: string,
    email: string,
    password: string,
    dateOfBirth?: string,
    referralCode?: string
  ) => Promise<User>

  signIn: (
    email: string,
    password: string
  ) => Promise<User>

  signInWithGoogle: () => Promise<User>

  logout: () => Promise<void>

  refreshProfile: () => Promise<void>
}

const defaultEntitlement = {
  isAuthenticated: false,
  isTrialActive: false,
  isPremiumActive: false,
  hasWatchAccess: false,
  accessType: null,
  subscriptionStatus: null,
  subscriptionPlan: null,
  trialExpiresAt: null,
  subscriptionExpiresAt: null,
} as Entitlement

const AuthContext =
  createContext<AuthContextType | undefined>(undefined)

function generateSessionId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

async function createSession(uid: string) {
  const sessionId = generateSessionId()

  const sessionRef = doc(db, "userSessions", uid)

  await setDoc(sessionRef, {
    uid,
    sessionId,
    createdAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
  })

  return sessionId
}

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] =
    useState<UserProfile | null>(null)

  const [loading, setLoading] = useState(true)

  const [sessionId, setSessionId] =
    useState<string | null>(null)

  /**
   * Enable Firebase persistent login.
   *
   * This means:
   *
   * Login
   * ↓
   * Refresh
   * ↓
   * Close browser
   * ↓
   * Open again
   * ↓
   * Still logged in
   */
  useEffect(() => {
    enableAuthPersistence().catch((error) => {
      console.error(
        "Unable to enable auth persistence:",
        error
      )
    })
  }, [])

  /**
   * Firebase authentication listener
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setUser(firebaseUser)

        if (!firebaseUser) {
          setProfile(null)
          setSessionId(null)
          setLoading(false)
          return
        }

        try {
          /**
           * Make sure the Firebase user has
           * a corresponding Firestore profile.
           */
          await ensureUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            name:
              firebaseUser.displayName ||
              firebaseUser.email?.split("@")[0] ||
              "User",
            photoURL:
              firebaseUser.photoURL || null,
          })

          /**
           * Create a new active session.
           *
           * IMPORTANT:
           * The same uid has only one session document.
           *
           * New login:
           * old sessionId → replaced
           * new sessionId → active
           */
          const newSessionId =
            await createSession(firebaseUser.uid)

          setSessionId(newSessionId)
        } catch (error) {
          console.error(
            "Authentication initialization failed:",
            error
          )
        } finally {
          setLoading(false)
        }
      }
    )

    return unsubscribe
  }, [])

  /**
   * Realtime user profile listener
   */
  useEffect(() => {
    if (!user?.uid) {
      setProfile(null)
      return
    }

    const userRef = doc(db, "users", user.uid)

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setProfile(null)
          return
        }

        const data = snapshot.data()

        try {
          setProfile(
            normalizeProfile({
              uid: user.uid,
              ...data,
            })
          )
        } catch (error) {
          console.error(
            "Profile normalization failed:",
            error
          )
        }
      },
      (error) => {
        console.error(
          "Realtime profile listener error:",
          error
        )
      }
    )

    return unsubscribe
  }, [user?.uid])

  /**
   * Realtime single-device session listener
   *
   * If another device/browser logs in using
   * the same Gmail account, Firestore's sessionId
   * changes.
   *
   * Current device sees:
   *
   * current sessionId !== Firebase sessionId
   *
   * Then it is signed out automatically.
   */
  useEffect(() => {
    if (!user?.uid || !sessionId) {
      return
    }

    const sessionRef = doc(
      db,
      "userSessions",
      user.uid
    )

    const unsubscribe = onSnapshot(
      sessionRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          return
        }

        const data = snapshot.data()

        if (
          data.sessionId &&
          data.sessionId !== sessionId
        ) {
          try {
            await signOut(auth)
          } catch (error) {
            console.error(
              "Automatic session logout failed:",
              error
            )
          }

          setUser(null)
          setProfile(null)
          setSessionId(null)
        }
      },
      (error) => {
        console.error(
          "Session listener error:",
          error
        )
      }
    )

    return unsubscribe
  }, [user?.uid, sessionId])

  /**
   * Email/password signup
   */
  const signUp = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      dateOfBirth?: string,
      referralCode?: string
    ) => {
      const credential =
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        )

      const firebaseUser = credential.user

      if (name.trim()) {
        await updateProfile(firebaseUser, {
          displayName: name.trim(),
        })
      }

      /**
       * Profile is created by the auth-state listener.
       *
       * If your ensureUserProfile supports these fields,
       * pass them there.
       */
      try {
        await ensureUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email || email.trim(),
          name: name.trim(),
          photoURL: firebaseUser.photoURL || null,
          dateOfBirth: dateOfBirth || null,

          /**
           * Keep this only if your current
           * ensureUserProfile type supports it.
           */
          ...(referralCode
            ? { referralCode }
            : {}),
        } as Parameters<
          typeof ensureUserProfile
        >[0])
      } catch (error) {
        console.error(
          "Profile creation failed:",
          error
        )
      }

      return firebaseUser
    },
    []
  )

  /**
   * Email/password login
   */
  const signIn = useCallback(
    async (
      email: string,
      password: string
    ) => {
      const credential =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        )

      return credential.user
    },
    []
  )

  /**
   * Google login
   */
  const signInWithGoogle = useCallback(
    async () => {
      const credential =
        await signInWithPopup(
          auth,
          googleProvider
        )

      return credential.user
    },
    []
  )

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      /**
       * Do NOT delete userSessions/{uid} here.
       *
       * Why?
       *
       * If the user clicks logout, Firebase Auth
       * itself ends the authentication session.
       *
       * Leaving the session document prevents
       * race conditions where another browser could
       * accidentally create an inconsistent session.
       */

      await signOut(auth)

      setUser(null)
      setProfile(null)
      setSessionId(null)
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      )

      throw error
    }
  }, [])

  /**
   * Manual profile refresh
   */
  const refreshProfile = useCallback(async () => {
    if (!user?.uid) {
      return
    }

    try {
      await ensureUserProfile({
        uid: user.uid,
        email: user.email || "",
        name:
          user.displayName ||
          user.email?.split("@")[0] ||
          "User",
        photoURL: user.photoURL || null,
      })
    } catch (error) {
      console.error(
        "Profile refresh failed:",
        error
      )
    }
  }, [user])

  /**
   * Recalculate entitlement whenever
   * realtime Firebase profile changes.
   */
  const entitlement = useMemo(() => {
    if (!user || !profile) {
      return defaultEntitlement
    }

    return getEntitlement(profile)
  }, [user, profile])

  const value = useMemo(
    () => ({
      user,
      profile,
      entitlement,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      logout,
      refreshProfile,
    }),
    [
      user,
      profile,
      entitlement,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      logout,
      refreshProfile,
    ]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    )
  }

  return context
      }
