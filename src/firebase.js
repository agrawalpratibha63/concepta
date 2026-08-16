import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyA3SR1QUDMtmPyOGiCjOAv2G1MByrjDL5w',
  authDomain: 'concepta-ai-b7dce.firebaseapp.com',
  projectId: 'concepta-ai-b7dce',
  storageBucket: 'concepta-ai-b7dce.firebasestorage.app',
  messagingSenderId: '462557616298',
  appId: '1:462557616298:web:40cab003fee9dd560bd8d3',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
