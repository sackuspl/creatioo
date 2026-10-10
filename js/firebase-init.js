// Firebase setup shared by the public pages and the dashboard.
// Load after the Firebase SDK scripts and before any script that uses db or auth.

const firebaseConfig = {
  apiKey:            "AIzaSyAR0AAe0fhzIvZbrMeQXY1ujG9VHgZuHgA",
  authDomain:        "creatioo.firebaseapp.com",
  projectId:         "creatioo",
  storageBucket:     "creatioo.firebasestorage.app",
  messagingSenderId: "369637725079",
  appId:             "1:369637725079:web:1cc01c097b2ede4d10ead2"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
