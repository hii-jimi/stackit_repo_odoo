import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyADBYRq62FSRTJx5oXKuyphvh-ojldvBT0",
  authDomain: "echopay-a702c.firebaseapp.com",
  databaseURL: "https://echopay-a702c-default-rtdb.firebaseio.com",
  projectId: "echopay-a702c",
  storageBucket: "echopay-a702c.firebasestorage.app",
  messagingSenderId: "63795541832",
  appId: "1:63795541832:web:ee3591d7697038a35ca57d"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { app, database, auth };
