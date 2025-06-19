// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
	getMessaging,
	getToken,
	type Messaging,
	onMessage,
} from "firebase/messaging";

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECTID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging: Messaging = getMessaging(app);

export { messaging, onMessage, getToken };
