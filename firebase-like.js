// Import Firebase App, Auth i Database
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getDatabase, ref, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBz3774VzTNAIVXleWPURd01gf2EOPktQ8",
  authDomain: "github-likes.firebaseapp.com",
  databaseURL: "https://github-likes-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "github-likes",
  storageBucket: "github-likes.firebasestorage.app",
  messagingSenderId: "956056061366",
  appId: "1:956056061366:web:23591fcfb2507ecc54ed17"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Bezpieczne obsłużenie ewentualnego canvas.getContext (guard) — jeśli masz canvas w innym miejscu
try {
  const maybeCanvas = document.getElementById('myCanvas'); // zmień id jeśli masz inne
  if (maybeCanvas) {
    // const ctx = maybeCanvas.getContext('2d'); // odkomentuj jeśli używasz
  } else {
    // console.log('Brak #myCanvas — pomijam getContext');
  }
} catch (e) {
  console.warn('Błąd przy getContext (ignoruję):', e);
}

// Zaloguj anonimowo (jeżeli nie jest jeszcze)
signInAnonymously(auth)
  .then(() => console.log("Użytkownik anonimowy zalogowany (inited)"))
  .catch(err => console.error("Anon login error:", err));

// Pomocniczy mechanizm: czekamy na DOM i na auth; dopiero wtedy inicjujemy binding
let domReady = false;
let authReady = false;
let currentUser = null;

function tryInitBindings() {
  if (!domReady || !authReady) {
    console.log("Init bindings: czekam — domReady:", domReady, "authReady:", authReady);
    return;
  }
  console.log("Init bindings: START (DOM i AUTH gotowe). uid:", currentUser?.uid);

  // Podpinamy listenery — zabezpieczenie przed dublem: dataset.bound
  const buttons = document.querySelectorAll('.like-btn');
  console.log("Znaleziono przycisków .like-btn:", buttons.length);
  buttons.forEach(btn => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    const postId = btn.dataset.id;
    const countEl = btn.querySelector('.like-count');
    if (!postId) {
      console.warn("Przycisk like bez data-id:", btn);
      return;
    }
    if (!countEl) {
      console.warn("Brak elementu .like-count wewnątrz przycisku dla postId:", postId);
    }
    const likeRef = ref(database, 'likes/' + postId);
    console.log("Podpinam onValue dla", postId);

    // onValue
    onValue(likeRef, snapshot => {
      const post = snapshot.val();
      // DEBUG: pokaż snapshot wartości
      console.debug("onValue:", postId, post);

      const newVal = post?.count || 0;
      if (countEl) countEl.textContent = newVal;

      const user = auth.currentUser;
      if (user && post?.users && post.users[user.uid]) {
        btn.classList.add('liked');
      } else {
        btn.classList.remove('liked');
      }
    }, (err) => {
      console.error("Błąd onValue dla", postId, err);
    });

    // click handler
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      if (!user) {
        alert("Trwa logowanie użytkownika — spróbuj za moment.");
        return;
      }
      const userId = user.uid;
      console.log("Klik on", postId, "uid=", userId);

      // natychmiastowy toggle UI dla responsywności (odwracamy w razie błędu)
      const already = btn.classList.contains('liked');
      if (already) btn.classList.remove('liked'); else btn.classList.add('liked');

      // animacje
      btn.classList.add('pulsate');
      setTimeout(() => btn.classList.remove('pulsate'), 300);
      if (!already) {
        for (let i = 0; i < 6; i++) {
          const bubble = document.createElement('span');
          bubble.className = 'burst';
          const x = (Math.random() - 0.5) * 60 + 'px';
          const y = (Math.random() - 0.5) * 60 + 'px';
          bubble.style.setProperty('--x', x);
          bubble.style.setProperty('--y', y);
          btn.appendChild(bubble);
          setTimeout(() => bubble.remove(), 600);
        }
      }

      // transaction toggle
      try {
        const result = await runTransaction(likeRef, (post) => {
          if (!post) {
            return { count: 1, users: { [userId]: true } };
          }
          if (!post.users) post.users = {};
          if (post.users[userId]) {
            post.count = Math.max((post.count || 1) - 1, 0);
            delete post.users[userId];
          } else {
            post.count = (post.count || 0) + 1;
            post.users[userId] = true;
          }
          return post;
        });
        console.log("Transaction finished for", postId, result);
        // onValue zaktualizuje UI na podstawie DB - to jest źródło prawdy
      } catch (err) {
        console.error("Transaction error dla", postId, err);
        // cofamy UI toggle w razie błędu
        if (btn.classList.contains('liked') && already === false) btn.classList.remove('liked');
        if (!btn.classList.contains('liked') && already === true) btn.classList.add('liked');
        alert("Błąd zapisu. Sprawdź reguły DB (permission_denied).");
      }
    });
  });
}

// DOM ready
window.addEventListener('DOMContentLoaded', () => {
  domReady = true;
  console.log("DOM gotowy");
  tryInitBindings();
});

// Auth ready
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    authReady = true;
    console.log("Auth ready, uid=", user.uid);
  } else {
    authReady = false;
    currentUser = null;
    console.log("Auth: brak użytkownika (null)");
  }
  tryInitBindings();
});
