import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'

const AuthContext = createContext(null)

// 👑 Founder Email Configuration (Real-World RBAC)
const FOUNDER_EMAIL = 'agrawalpratibha63@gmail.com'

const roleFor = (email = '') =>
  email.trim().toLowerCase() === FOUNDER_EMAIL ? 'founder' : 'student'

const saveUserRecord = async (currentUser) => {
  if (!currentUser?.uid || !currentUser?.email) return
  await setDoc(doc(db, 'users', currentUser.uid), {
    uid: currentUser.uid,
    name: currentUser.displayName || currentUser.email.split('@')[0],
    email: currentUser.email.toLowerCase(),
    photoURL: currentUser.photoURL || null,
    provider: currentUser.providerData?.[0]?.providerId || 'password',
    role: roleFor(currentUser.email),
    lastLoginAt: serverTimestamp(),
  }, { merge: true })
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null) // 'founder' or 'student'
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      
      // Role Allocation Logic
      if (currentUser) {
        setUserRole(roleFor(currentUser.email))
        try { await saveUserRecord(currentUser) } catch (error) {
          console.error('Unable to sync student profile:', error)
        }
      } else {
        setUserRole(null)
      }
      
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loginWithGoogle = async (mode = 'login') => {
    // LocalStorage block removed. Firebase handles all auth globally now.
    const result = await signInWithPopup(auth, googleProvider)
    const email = result.user?.email

    if (!email) {
      await signOut(auth)
      throw new Error('NO_EMAIL_FOUND')
    }

    // You can add logic here in the future to save new users to Firestore DB
    return result
  }

  const signupWithEmail = async ({ name, email, password }) => {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), password)
    await updateProfile(result.user, { displayName: name.trim() })
    await saveUserRecord(result.user)
    return result
  }

  const loginWithEmail = async ({ email, password }) => {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password)
    await saveUserRecord(result.user)
    return result
  }

  const getRegisteredStudents = async () => {
    if (roleFor(auth.currentUser?.email) !== 'founder') throw new Error('FOUNDER_ONLY')
    const snapshot = await getDocs(collection(db, 'users'))
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
      .filter(item => item.role !== 'founder')
  }

  const logout = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole, // Now exported so App.jsx can read it for <FounderRoute>
        authLoading,
        loginWithGoogle,
        signupWithEmail,
        loginWithEmail,
        getRegisteredStudents,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
