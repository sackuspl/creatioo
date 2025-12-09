// Import Firebase App i Database
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
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

// Obsługa przycisków like
document.querySelectorAll('.like-btn').forEach(btn => {
  const postId = btn.dataset.id;
  const countEl = btn.querySelector('.like-count');
  const likeRef = ref(database, 'likes/' + postId);

  // Pobieranie wartości w czasie rzeczywistym
  onValue(likeRef, snapshot => {
    const val = snapshot.val() || 0;
    countEl.textContent = val;
  });

  // Kliknięcie
  btn.addEventListener('click', () => {
    runTransaction(likeRef, current => (current || 0) + 1);

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