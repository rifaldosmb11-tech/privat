// Import SDK Firebase v9 (Modular) dari CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    push, 
    set, 
    onValue, 
    remove 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// KONFIGURASI FIREBASE ANDA (Ambil dari Firebase Console -> Project Settings)
const firebaseConfig = {
    apiKey: "GANTI_DENGAN_API_KEY_ANDA",
    authDomain: "GANTI_DENGAN_AUTH_DOMAIN_ANDA",
    databaseURL: "GANTI_DENGAN_DATABASE_URL_ANDA",
    projectId: "GANTI_DENGAN_PROJECT_ID_ANDA",
    storageBucket: "GANTI_DENGAN_STORAGE_BUCKET_ANDA",
    messagingSenderId: "GANTI_DENGAN_MESSAGING_SENDER_ID_ANDA",
    appId: "GANTI_DENGAN_APP_ID_ANDA"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const btnLogout = document.getElementById('btn-logout');
const addAccountForm = document.getElementById('add-account-form');
const accountTableBody = document.getElementById('account-table-body');

// 1. Monitor Status Auth (Login/Logout State)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Jika sudah login, tampilkan dashboard & ambil data
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        loadAccounts();
    } else {
        // Jika belum, tampilkan form login
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
});

// 2. Fungsi Login Admin
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .catch((error) => {
            loginError.textContent = "Login Gagal: " + error.message;
        });
});

// 3. Fungsi Logout
btnLogout.addEventListener('click', () => {
    signOut(auth).catch((error) => {
        console.error("Gagal keluar: ", error);
    });
});

// 4. Fungsi Tambah Data Akun Premium ke Firebase Database
addAccountForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const serviceName = document.getElementById('service-name').value;
    const username = document.getElementById('acc-username').value;
    const password = document.getElementById('acc-password').value;
    const expiry = document.getElementById('acc-expiry').value;

    // Buat referensi unik di database/accounts
    const accountsRef = ref(db, 'accounts');
    const newAccountRef = push(accountsRef);

    set(newAccountRef, {
        service: serviceName,
        username: username,
        password: password,
        expiry: expiry
    }).then(() => {
        addAccountForm.reset();
        alert('Akun berhasil ditambahkan!');
    }).catch((error) => {
        alert('Gagal menyimpan: ' + error.message);
    });
});

// 5. Fungsi Memuat & Menampilkan Data Real-time dari Firebase
function loadAccounts() {
    const accountsRef = ref(db, 'accounts');
    onValue(accountsRef, (snapshot) => {
        accountTableBody.innerHTML = '';
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach((key) => {
                const acc = data[key];
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${acc.service}</td>
                    <td>${acc.username}</td>
                    <td>${acc.password}</td>
                    <td>${acc.expiry}</td>
                    <td><button class="btn-delete" data-id="${key}">Hapus</button></td>
                `;
                accountTableBody.appendChild(row);
            });

            // Tambahkan event listener untuk tombol hapus
            document.querySelectorAll('.btn-delete').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    deleteAccount(id);
                });
            });
        }
    });
}

// 6. Fungsi Hapus Akun dari Database
function deleteAccount(id) {
    if (confirm("Yakin ingin menghapus akun ini?")) {
        const accountRef = ref(db, `accounts/${id}`);
        remove(accountRef).then(() => {
            // Data akan otomatis terupdate secara real-time
        }).catch((error) => {
            alert("Gagal menghapus: " + error.message);
        });
    }
}
