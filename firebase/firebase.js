import { initializeApp } from "firebase/app";
import {
    addDoc,
    collection,
    getDocs,
    getFirestore,
    limit,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: window.FIREBASE_CONFIG?.apiKey || "YOUR_FIREBASE_API_KEY",
    authDomain: window.FIREBASE_CONFIG?.authDomain || "YOUR_FIREBASE_AUTH_DOMAIN",
    projectId: window.FIREBASE_CONFIG?.projectId || "YOUR_FIREBASE_PROJECT_ID",
    storageBucket: window.FIREBASE_CONFIG?.storageBucket || "YOUR_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: window.FIREBASE_CONFIG?.messagingSenderId || "YOUR_FIREBASE_MESSAGING_SENDER_ID",
    appId: window.FIREBASE_CONFIG?.appId || "YOUR_FIREBASE_APP_ID",
};

const hasPlaceholderConfig = Object.values(firebaseConfig).some(
    (value) => !value || String(value).startsWith("YOUR_FIREBASE_")
);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const registrationsRef = collection(db, "eventRegistrations");

function sanitizeRegistrationData(data) {
    return {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        rollNumber: data.rollNumber.trim().toUpperCase(),
        department: data.department,
        year: data.year,
        eventName: data.eventName || "SOAR Test 12.0",
    }; 
}

function generateRegistrationId() {
    const timestampPart = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `ANARC-${timestampPart}-${randomPart}`;
}

async function getExistingRegistration(payload) {
    const emailQuery = query(
        registrationsRef,
        where("email", "==", payload.email),
        where("eventName", "==", payload.eventName),
        limit(1)
    );

    const rollNumberQuery = query(
        registrationsRef,
        where("rollNumber", "==", payload.rollNumber),
        where("eventName", "==", payload.eventName),
        limit(1)
    );

    const [emailSnap, rollNumberSnap] = await Promise.all([
        getDocs(emailQuery),
        getDocs(rollNumberQuery),
    ]);

    return !emailSnap.empty || !rollNumberSnap.empty;
}

async function registerForEvent(formData) {
    const payload = sanitizeRegistrationData(formData);

    const requiredFields = [
        payload.name,
        payload.email,
        payload.phone,
        payload.rollNumber,
        payload.department,
        payload.year,
    ];

    if (requiredFields.some((field) => !field)) {
        throw { status: 400, message: "All fields are required." };
    }

    const duplicateFound = await getExistingRegistration(payload);
    if (duplicateFound) {
        throw {
        status: 409,
        message: "You have already registered for this event.",
        };
    }

    const registrationId = generateRegistrationId();

    await addDoc(registrationsRef, {
        ...payload,
        registrationId,
        createdAt: serverTimestamp(),
    });
    // Email/PDF is handled by Cloud Functions on document creation.

    return {
        success: true,
        registrationId,
    };
}


export { hasPlaceholderConfig, registerForEvent };