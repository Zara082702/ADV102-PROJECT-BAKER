import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB2ENqeXK8DXGUsU0iYAUrFuvwPIQrU6VU",
  authDomain: "coffeeshop-c5ab4.firebaseapp.com",
  projectId: "coffeeshop-c5ab4",
  storageBucket: "coffeeshop-c5ab4.firebasestorage.app",
  messagingSenderId: "180108014890",
  appId: "1:180108014890:web:85671deb4f663888d15a53",
  measurementId: "G-DTJ3BFWF5T"
};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;