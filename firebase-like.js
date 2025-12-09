// Import Firebase App, Auth i Database
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getDatabase, ref, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// Konfiguracja Firebase
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

// Logowanie anonimowe
signInAnonymously(auth)
  .then(() => console.log("Użytkownik anonimowy zalogowany"))
  .catch(err => console.error(err));

// Obsługa przycisków like
document.querySelectorAll('.like-btn').forEach(btn => {
  const postId = btn.dataset.id;
  const countEl = btn.querySelector('.like-count');
  const likeRef = ref(database, 'likes/' + postId);

  // Pobieranie wartości w czasie rzeczywistym i animacja liczby
  onValue(likeRef, snapshot => {
    const post = snapshot.val();
    const newVal = post?.count || 0;

    // Aktualizacja licznika
    countEl.textContent = newVal;

    // Zmiana koloru jeśli użytkownik polubił
    const user = auth.currentUser;
    if (user && post?.users?.[user.uid]) {
      btn.classList.add('liked');
    } else {
      btn.classList.remove('liked');
    }
  });

  // Kliknięcie w przycisk
  btn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) return alert("Trwa logowanie użytkownika...");

    const userId = user.uid;

    // Transakcja Like / Unlike
    runTransaction(likeRef, post => {
      if (!post) {
        // jeśli post nie istnieje, tworzymy nowy obiekt z 1 like
        return { count: 1, users: { [userId]: true } };
      }

      if (!post.users) post.users = {};

      if (post.users[userId]) {
        // użytkownik już polubił -> odkliknięcie
        post.count = Math.max((post.count || 1) - 1, 0);
        delete post.users[userId];
      } else {
        // użytkownik nie polubił -> kliknięcie
        post.count = (post.count || 0) + 1;
        post.users[userId] = true;
      }

      return post;
    });

    // Animacja pulsate
    btn.classList.add('pulsate');
    setTimeout(() => btn.classList.remove('pulsate'), 300);

    // Efekt burst
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
  });
});
