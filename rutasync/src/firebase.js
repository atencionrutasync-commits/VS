import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Reemplaza las líneas de abajo con el bloque de código que copiaste de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDHBFeuZe14I5Bhpm8T3BZAV2sE0x3W9lU",
  authDomain: "rutasync-erp.firebaseapp.com",
  projectId: "rutasync-erp",
  storageBucket: "rutasync-erp.firebasestorage.app",
  messagingSenderId: "969874888509",
  appId: "1:969874888509:web:f52ffe1e015d2831c55754",
  measurementId: "G-7SH3LH6ST0"
};

// Inicializamos la aplicación de Google Firebase
const app = initializeApp(firebaseConfig);

// Exportamos los servicios para que los módulos de RutaSync los utilicen
export const auth = getAuth(app);
export const db = getFirestore(app);