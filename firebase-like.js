// Import Firebase App, Auth i Database
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
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

// Zaloguj anonimowo (jeśli jeszcze nie)
signInAnonymously(auth)
  .then(() => console.log("Użytkownik anonimowy zalogowany (inited)"))
  .catch(err => console.error("Anon login error:", err));

// Czekamy na stan auth, dopiero wtedy podpinamy listeners
onAuthStateChanged(auth, (user) => {
  if (!user) {
    console.log("Brak użytkownika jeszcze...");
    return;
  }
  console.log("Auth ready, uid =", user.uid);

  // Teraz bezpiecznie podpinamy listeners do przycisków (można wywołać to wielokrotnie — zbindowanie w pętli)
  document.querySelectorAll('.like-btn').forEach(btn => {
    // unikamy dubli - jeśli już mamy 'data-bound' to pomijamy
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    const postId = btn.dataset.id;
    const countEl = btn.querySelector('.like-count');
    const likeRef = ref(database, 'likes/' + postId);

    // Pobieranie wartości w czasie rzeczywistym
    onValue(likeRef, snapshot => {
      const post = snapshot.val();
      const newVal = post?.count || 0;

      // Aktualizacja licznika (prosto — animację można zachować, tu prostsze ustawienie)
      // Jeśli chcesz animację zachowaj poprzednią implementację animacji liczbowej.
      countEl.textContent = newVal;

      // Ustawiamy klasę .liked na podstawie tego, czy UID jest zapisany w post.users
      const currentUser = auth.currentUser;
      if (currentUser && post?.users && post.users[currentUser.uid]) {
        btn.classList.add('liked');
      } else {
        btn.classList.remove('liked');
      }
    }, (err) => {
      console.error("onValue error:", err);
    });

    // Kliknięcie w przycisk -> toggle like/unlike
    btn.addEventListener('click', async (e) => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("Trwa logowanie użytkownika... spróbuj za moment.");
        return;
      }
      const userId = currentUser.uid;

      // Dla lepszego UX: od razu toggle klasy i animuj (później DB zweryfikuje stan)
      const alreadyLiked = btn.classList.contains('liked');
      if (alreadyLiked) {
        btn.classList.remove('liked');
      } else {
        btn.classList.add('liked');
      }

      // Animacja pulsate
      btn.classList.add('pulsate');
      setTimeout(() => btn.classList.remove('pulsate'), 300);

      // Efekt burst tylko kiedy dodajemy like (nie przy unlike)
      if (!alreadyLiked) {
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

      // Wykonujemy transakcję która toggle'uje like
      try {
        await runTransaction(likeRef, (post) => {
          if (!post) {
            // jeśli nie ma posta -> stworzyć i dodać UID
            return { count: 1, users: { [userId]: true } };
          }

          if (!post.users) post.users = {};

          if (post.users[userId]) {
            // już polubił -> odkliknięcie
            post.count = Math.max((post.count || 1) - 1, 0);
            delete post.users[userId];
          } else {
            // nie polubił -> kliknięcie
            post.count = (post.count || 0) + 1;
            post.users[userId] = true;
          }

          return post;
        });
        // Transakcja zakończona — onValue zaktualizuje UI do stanu z DB.
      } catch (err) {
        console.error("Transaction error:", err);
        // Jeśli DB odrzuciła zapytanie, cofamy wizualnie zmianę klasy
        if (btn.classList.contains('liked') && !alreadyLiked) {
          btn.classList.remove('liked');
        } else if (!btn.classList.contains('liked') && alreadyLiked) {
          btn.classList.add('liked');
        }
        alert("Błąd podczas zapisu (sprawdź reguły w Firebase).");
      }
    });
  }); // koniec forEach przycisków
}); // koniec onAuthStateChanged
