/* ============================================================
   FIREBASE — KONFIGURACJA I INICJALIZACJA
   ============================================================
   Ten plik łączy stronę główną ORAZ dashboard z Twoją bazą Firebase.
   Musi być wczytany (w obu plikach HTML) PO bibliotekach Firebase
   i PRZED innymi skryptami, które korzystają z bazy (reviews.js,
   projects.js, dashboard.js) — to podłączymy w Etapie 2.

   Skąd wziąć wartości poniżej:
   Firebase Console → ⚙️ Project settings → General
   → sekcja "Your apps" → Twoja aplikacja webowa → "SDK setup and configuration"
   ============================================================ */

const firebaseConfig = {
  apiKey:            "AIzaSyAR0AAe0fhzIvZbrMeQXY1ujG9VHgZuHgA",
  authDomain:        "creatioo.firebaseapp.com",
  projectId:         "creatioo",
  storageBucket:     "creatioo.firebasestorage.app",
  messagingSenderId: "369637725079",
  appId:             "1:369637725079:web:1cc01c097b2ede4d10ead2"
};

firebase.initializeApp(firebaseConfig);

// Firestore — baza danych (opinie, klienci, projekty)
const db = firebase.firestore();

// Auth — logowanie do dashboardu
const auth = firebase.auth();

// Sesja logowania ma być pamiętana między wizytami w przeglądarce
// (wymóg: "logowanie zapisuje się i zapamiętuje się").
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
