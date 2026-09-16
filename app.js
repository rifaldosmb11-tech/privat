javascript
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from
  "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBn-uDAM6-p4mqGlnQE3COQDDY4NZMXdxM",
  authDomain: "data-login-ab566.firebaseapp.com",
  projectId: "data-login-ab566",
  storageBucket: "data-login-ab566.firebasestorage.app",
  messagingSenderId: "657749656398",
  appId: "1:657749656398:web:02b491806c0b55ae4f541f",
  measurementId: "G-W9B1LCP02G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ==================================================
// INITIALIZE FIREBASE
// ==================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ==================================================
// ELEMENT
// ==================================================

const loginPage =
  document.getElementById("loginPage");

const dashboardPage =
  document.getElementById("dashboardPage");

const loginForm =
  document.getElementById("loginForm");

const logoutBtn =
  document.getElementById("logoutBtn");

const dataForm =
  document.getElementById("dataForm");

const dataList =
  document.getElementById("dataList");

const userEmail =
  document.getElementById("userEmail");

const totalData =
  document.getElementById("totalData");

const activeData =
  document.getElementById("activeData");

const dataCount =
  document.getElementById("dataCount");

const loginMessage =
  document.getElementById("loginMessage");

const saveMessage =
  document.getElementById("saveMessage");

const connectionDot =
  document.getElementById("connectionDot");

const connectionText =
  document.getElementById("connectionText");


// ==================================================
// LOGIN
// ==================================================

loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const email =
      document.getElementById("email").value.trim();

    const password =
      document.getElementById("password").value;

    loginMessage.textContent =
      "Memproses login...";

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      loginMessage.textContent = "";

    } catch (error) {

      console.error(error);

      loginMessage.textContent =
        getFirebaseError(error);

    }

  }
);


// ==================================================
// AUTH STATE
// ==================================================

onAuthStateChanged(
  auth,
  (user) => {

    if (user) {

      loginPage.classList.add("hidden");

      dashboardPage.classList.remove("hidden");

      userEmail.textContent =
        user.email;

      startRealtimeData(user.uid);

    } else {

      loginPage.classList.remove("hidden");

      dashboardPage.classList.add("hidden");

      userEmail.textContent = "-";

    }

  }
);


// ==================================================
// LOGOUT
// ==================================================

logoutBtn.addEventListener(
  "click",
  async () => {

    await signOut(auth);

  }
);


// ==================================================
// SIMPAN DATA
// ==================================================

dataForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const user = auth.currentUser;

    if (!user) {

      saveMessage.textContent =
        "Silakan login terlebih dahulu.";

      return;

    }

    const name =
      document.getElementById("dataName").value.trim();

    const value =
      document.getElementById("dataValue").value.trim();

    if (!name || !value) return;

    try {

      await addDoc(
        collection(
          db,
          "dashboardData"
        ),
        {

          uid: user.uid,

          name: name,

          value: value,

          active: true,

          createdAt: serverTimestamp(),

          updatedAt: serverTimestamp()

        }
      );

      dataForm.reset();

      saveMessage.textContent =
        "Data berhasil disimpan.";

      setTimeout(() => {

        saveMessage.textContent = "";

      }, 2000);

    } catch (error) {

      console.error(error);

      saveMessage.textContent =
        "Gagal menyimpan data.";

    }

  }
);


// ==================================================
// REALTIME FIRESTORE
// ==================================================

function startRealtimeData(uid) {

  const q = query(

    collection(
      db,
      "dashboardData"
    ),

    orderBy(
      "createdAt",
      "desc"
    )

  );


  onSnapshot(

    q,

    (snapshot) => {

      const data = [];

      snapshot.forEach(
        (item) => {

          const itemData =
            item.data();

          // Hanya data milik user login
          if (itemData.uid === uid) {

            data.push({

              id: item.id,

              ...itemData

            });

          }

        }
      );


      renderData(data);

      setConnection(
        true
      );

    },

    (error) => {

      console.error(error);

      setConnection(
        false
      );

    }

  );

}


// ==================================================
// RENDER DATA
// ==================================================

function renderData(data) {

  totalData.textContent =
    data.length;

  activeData.textContent =
    data.filter(
      item => item.active === true
    ).length;

  dataCount.textContent =
    `${data.length} DATA`;


  if (data.length === 0) {

    dataList.innerHTML = `
      <div class="empty">
        Belum ada data tersimpan.
      </div>
    `;

    return;

  }


  dataList.innerHTML =
    data.map(
      item => `

        <div class="data-card">

          <div>

            <h3>
              ${escapeHTML(item.name)}
            </h3>

            <p>
              ${escapeHTML(item.value)}
            </p>

          </div>

          <div class="data-actions">

            <button
              class="btn-delete"
              onclick="deleteData('${item.id}')"
            >
              HAPUS
            </button>

          </div>

        </div>

      `
    ).join("");

}


// ==================================================
// DELETE DATA
// ==================================================

window.deleteData =
  async function(id) {

    const user =
      auth.currentUser;

    if (!user) return;


    const confirmDelete =
      confirm(
        "Hapus data ini?"
      );

    if (!confirmDelete) return;


    try {

      await deleteDoc(
        doc(
          db,
          "dashboardData",
          id
        )
      );

    } catch (error) {

      console.error(error);

      alert(
        "Gagal menghapus data."
      );

    }

  };


// ==================================================
// CONNECTION
// ==================================================

function setConnection(online) {

  if (online) {

    connectionDot.style.background =
      "#00ff88";

    connectionText.textContent =
      "REALTIME ONLINE";

  } else {

    connectionDot.style.background =
      "#ff4444";

    connectionText.textContent =
      "CONNECTION ERROR";

  }

}


// ==================================================
// FIREBASE ERROR
// ==================================================

function getFirebaseError(error) {

  switch (error.code) {

    case "auth/invalid-credential":
      return "Email atau password salah.";

    case "auth/user-not-found":
      return "User tidak ditemukan.";

    case "auth/wrong-password":
      return "Password salah.";

    case "auth/invalid-email":
      return "Format email tidak valid.";

    case "auth/too-many-requests":
      return "Terlalu banyak percobaan login.";

    default:
      return "Login gagal. Silakan coba lagi.";

  }

}


// ==================================================
// SECURITY HTML
// ==================================================

function escapeHTML(value) {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}
