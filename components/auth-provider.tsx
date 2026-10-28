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
  updateProfile as updateFirebaseAuthProfile,
  type User,
} from "firebase/auth"

import { getEntitlement, type Entitlement } from "@/lib/entitlements"
import { auth, googleProvider } from "@/lib/firebase"
import {
  clearLegacyProfile,
  ensureUserProfile,
  getLegacyProfile,
  handleExpiredSubscription,
  subscribeToUserProfile,
  updateUserProfile,
  type UserProfile,
} from "@/lib/user-profile"

/*
 * FIX: Sign up এর সময় Firebase user তৈরি হওয়া মাত্রই onAuthStateChanged চলে যায়,
 * তখনো signUp() এর full name/DOB/referral ফর্ম ডাটা profile এ পৌঁছায়নি।
 * ফলে profile নামহীন অবস্থায় তৈরি হয়ে যেত। তাই ফর্মের ডাটা আগে এখানে রেখে দেওয়া হয়।
 */
type PendingSignupProfile = {
  name?: string
  dateOfBirth?: string
  email?: string
  photoURL?: string
  referralCode?: string
}
let pendingSignupProfile: PendingSignupProfile | null = null

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
    const currentProfile = await handleExpiredSubscription(auth.currentUser.uid)
    setProfile(currentProfile ?? nextProfile)
    clearLegacyProfile()
  }

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined

    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      unsubscribeProfile?.()
      unsubscribeProfile = undefined
      setUser(nextUser)
      setLoading(Boolean(nextUser))

      if (!nextUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      void ensureUserProfile(
        nextUser,
        (pendingSignupProfile
          ? {
              ...pendingSignupProfile,
              email: nextUser.email || pendingSignupProfile.email,
              photoURL: nextUser.photoURL || pendingSignupProfile.photoURL || "",
            }
          : getLegacyProfile()) as any,
      )
        .then(async (nextProfile) => {
          const currentProfile = await handleExpiredSubscription(nextUser.uid)
          const resolvedProfile = currentProfile ?? nextProfile
          setProfile(resolvedProfile)
          if (resolvedProfile.accountStatus === "banned" || nextProfile.accountStatus === "suspended") {
            await firebaseSignOut(auth)
            return
          }
          unsubscribeProfile = subscribeToUserProfile(
            nextUser.uid,
            (liveProfile) => {
              if (!liveProfile) {
                setProfile(null)
                return
              }
              void handleExpiredSubscription(nextUser.uid).then((resolvedProfile) => {
                setProfile(resolvedProfile ?? liveProfile)
              })
            },
            (error) => console.error("Unable to subscribe to user profile", error),
          )
        })
        .catch((error) => {
          console.error("Unable to load user profile", error)
          setProfile(null)
          setLoading(false)
        })
        .finally(() => {
          setLoading(false)
          clearLegacyProfile()
        })
    })

    return () => {
      unsubscribeProfile?.()
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
        const signupData: PendingSignupProfile = {
          name: profile?.name?.trim(),
          dateOfBirth: profile?.dateOfBirth,
          email,
          photoURL: "",
          referralCode: profile?.referralCode,
        }

        // account তৈরির আগেই ডাটা রাখা হচ্ছে, যাতে onAuthStateChanged এও নামটা পায়
        pendingSignupProfile = signupData

        try {
          const credential = await createUserWithEmailAndPassword(auth, email, password)

          // Firebase Auth এর displayName এও নাম বসানো
          if (signupData.name) {
            try {
              await updateFirebaseAuthProfile(credential.user, { displayName: signupData.name })
            } catch (error) {
              console.error("Unable to set display name", error)
            }
          }

          await ensureUserProfile(credential.user, {
            name: signupData.name,
            dateOfBirth: signupData.dateOfBirth,
            email: credential.user.email || email,
            photoURL: credential.user.photoURL || "",
            referralCode: signupData.referralCode,
          })

          // নিশ্চিত করার জন্য: profile আগে খালি নামে তৈরি হয়ে গেলেও নাম ও জন্মতারিখ জোর করে লিখে দেওয়া
          if (signupData.name || signupData.dateOfBirth) {
            try {
              await updateUserProfile(credential.user.uid, {
                ...(signupData.name ? { name: signupData.name } : {}),
                ...(signupData.dateOfBirth ? { dateOfBirth: signupData.dateOfBirth } : {}),
              })
            } catch (error) {
              console.error("Unable to save signup name", error)
            }
          }

          return credential.user
        } finally {
          pendingSignupProfile = null
        }
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
