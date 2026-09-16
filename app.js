// =====================================================
// FIREBASE SDK v10 (Modular) - REALTIME DATABASE INTEGRATED
// =====================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    getDatabase, ref, push, set, onValue, remove, update
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

// Konfigurasi Firebase Anda
const firebaseConfig = {
    apiKey: "AIzaSyBn-uDAM6-p4mqGlnQE3COQDDY4NZMXdxM",
    authDomain: "data-login-ab566.firebaseapp.com",
    projectId: "data-login-ab566",
    storageBucket: "data-login-ab566.firebasestorage.app",
    messagingSenderId: "657749656398",
    appId: "1:657749656398:web:02b491806c0b55ae4f541f",
    measurementId: "G-W9B1LCP02G"
};

// Inisialisasi Firebase & Realtime Database
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);

// ===== DOM ELEMENTS =====
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const btnLogout = document.getElementById('btn-logout');
const addAccountForm = document.getElementById('add-account-form');
const accountList = document.getElementById('account-list');
const searchInput = document.getElementById('search-input');
const userEmail = document.getElementById('user-email');
const dataCount = document.getElementById('data-count');
const statTotalMini = document.getElementById('stat-total-mini');
const modalConfirm = document.getElementById('modal-confirm');
const modalCancel = document.getElementById('modal-cancel');
const modalYes = document.getElementById('modal-confirm-yes');
const toastContainer = document.getElementById('toast-container');

// PIN Security Elements
const modalPin = document.getElementById('modal-pin');
const pinModalTitle = document.getElementById('pin-modal-title');
const pinModalDesc = document.getElementById('pin-modal-desc');
const pinInputField = document.getElementById('pin-input-field');
const pinModalCancel = document.getElementById('pin-modal-cancel');
const pinModalSubmit = document.getElementById('pin-modal-submit');
const lastPinChangeEl = document.getElementById('last-pin-change');

let accountsCache = {};
let pendingDeleteId = null;
let currentPinAction = null; 

// =====================================================
// TOAST NOTIFICATION
// =====================================================
function showToast(message, type = 'info') {
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =====================================================
// AUTH STATE & SECURITY METADATA LOAD
// =====================================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        userEmail.textContent = user.email;
        loadAccounts();
        loadSecurityMeta();
    } else {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        accountsCache = {};
    }
});

// =====================================================
// LOGIN
// =====================================================
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    loginError.textContent = '';

    signInWithEmailAndPassword(auth, email, password)
        .then(() => showToast('Login berhasil. Selamat datang!', 'success'))
        .catch((err) => {
            loginError.textContent = 'Login gagal: ' + err.message;
            showToast('Login gagal', 'error');
        });
});

// =====================================================
// LOGOUT
// =====================================================
btnLogout.addEventListener('click', () => {
    signOut(auth)
        .then(() => showToast('Berhasil logout', 'info'))
        .catch((err) => showToast('Gagal logout: ' + err.message, 'error'));
});

// =====================================================
// TOGGLE PASSWORD VISIBILITY
// =====================================================
document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        const icon = btn.querySelector('i');
        if (target.type === 'password') {
            target.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            target.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });
});

// =====================================================
// PASSWORD STRENGTH METER
// =====================================================
const accPasswordInput = document.getElementById('acc-password');
const strengthFill = document.getElementById('strength-fill');
const strengthLabel = document.getElementById('strength-label');

if (accPasswordInput) {
    accPasswordInput.addEventListener('input', () => {
        const val = accPasswordInput.value;
        let score = 0;
        if (val.length >= 6) score++;
        if (val.length >= 10) score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;

        const pct = Math.min(score * 20, 100);
        strengthFill.style.width = pct + '%';
        strengthFill.classList.remove('strong', 'medium');

        let label = 'Lemah';
        if (score >= 4) { label = 'Kuat'; strengthFill.classList.add('strong'); }
        else if (score >= 3) { label = 'Sedang'; strengthFill.classList.add('medium'); }
        else if (score >= 2) { label = 'Cukup'; }

        strengthLabel.textContent = label;
    });
}

// =====================================================
// PASSWORD GENERATOR
// =====================================================
const genPassBtn = document.getElementById('gen-pass');
if (genPassBtn) {
    genPassBtn.addEventListener('click', () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
        let pass = '';
        for (let i = 0; i < 16; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        accPasswordInput.value = pass;
        accPasswordInput.dispatchEvent(new Event('input'));
        accPasswordInput.type = 'text';
        const eyeIcon = document.querySelector('[data-target="acc-password"] i');
        if (eyeIcon) eyeIcon.classList.replace('fa-eye', 'fa-eye-slash');
        showToast('Password kuat digenerate!', 'success');
    });
}

// =====================================================
// SUBMIT NEW ACCOUNT (REAL-TIME SAVE TO DATABASE)
// =====================================================
addAccountForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const serviceName = document.getElementById('service-name').value.trim();
    const username = document.getElementById('acc-username').value.trim();
    const password = accPasswordInput.value;
    const expiry = document.getElementById('acc-expiry').value;

    if (!serviceName || !username || !password || !expiry) {
        showToast('Semua field wajib diisi!', 'error');
        return;
    }

    const accountsRef = ref(db, 'accounts');
    const newAccountRef = push(accountsRef);

    set(newAccountRef, {
        service: serviceName,
        username: username,
        password: password,
        expiry: expiry,
        createdAt: Date.now()
    })
    .then(() => {
        addAccountForm.reset();
        if (strengthFill) strengthFill.style.width = '0%';
        if (strengthLabel) strengthLabel.textContent = 'Lemah';
        showToast('Kredensial berhasil disimpan secara real-time!', 'success');
    })
    .catch((err) => showToast('Gagal menyimpan: ' + err.message, 'error'));
});

// =====================================================
// LOAD ACCOUNTS & SECURITY META (REALTIME LISTENERS)
// =====================================================
function loadAccounts() {
    const accountsRef = ref(db, 'accounts');
    onValue(accountsRef, (snapshot) => {
        accountsCache = snapshot.val() || {};
        renderAccounts();
    });
}

function loadSecurityMeta() {
    const metaRef = ref(db, 'security/meta');
    onValue(metaRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.lastPinChange) {
            lastPinChangeEl.textContent = data.lastPinChange;
        } else {
            lastPinChangeEl.textContent = 'Belum pernah';
        }
    });
}

// =====================================================
// RENDER ACCOUNTS
// =====================================================
function renderAccounts() {
    const search = (searchInput.value || '').toLowerCase().trim();
    const entries = Object.entries(accountsCache)
        .filter(([id, acc]) => {
            if (!search) return true;
            return (acc.service || '').toLowerCase().includes(search)
                || (acc.username || '').toLowerCase().includes(search);
        })
        .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));

    dataCount.textContent = entries.length;
    statTotalMini.textContent = Object.keys(accountsCache).length;

    if (entries.length === 0) {
        accountList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-inbox"></i>
                <p>${search ? 'Tidak ada hasil pencarian' : 'Belum ada data kredensial tersimpan'}</p>
            </div>
        `;
        return;
    }

    accountList.innerHTML = entries.map(([id, acc]) => {
        const initial = (acc.service || '?').charAt(0).toUpperCase();
        const expiryBadge = getExpiryBadge(acc.expiry);
        return `
            <div class="account-item" data-id="${id}">
                <div class="acc-avatar">${initial}</div>
                <div class="acc-info">
                    <div class="acc-service">${escapeHtml(acc.service || '-')}</div>
                    <div class="acc-meta">
                        <span class="user"><i class="fa-regular fa-user" style="margin-right:4px"></i>${escapeHtml(acc.username || '-')}</span>
                        <span class="pass masked" data-pass="${escapeHtml(acc.password || '')}">••••••••••</span>
                        ${expiryBadge}
                    </div>
                </div>
                <div class="acc-actions">
                    <button class="action-btn toggle-view" data-id="${id}" title="Lihat password">
                        <i class="fa-regular fa-eye"></i>
                    </button>
                    <button class="action-btn copy-user" data-id="${id}" title="Copy username">
                        <i class="fa-regular fa-user"></i>
                    </button>
                    <button class="action-btn copy-pass" data-id="${id}" title="Copy password">
                        <i class="fa-solid fa-key"></i>
                    </button>
                    <button class="action-btn danger delete-acc" data-id="${id}" title="Hapus">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Attach dynamic events
    accountList.querySelectorAll('.toggle-view').forEach(btn => {
        btn.addEventListener('click', () => toggleView(btn));
    });
    accountList.querySelectorAll('.copy-user').forEach(btn => {
        btn.addEventListener('click', () => {
            const acc = accountsCache[btn.dataset.id];
            if (acc) copyText(acc.username, 'Username disalin!');
        });
    });
    accountList.querySelectorAll('.copy-pass').forEach(btn => {
        btn.addEventListener('click', () => {
            const acc = accountsCache[btn.dataset.id];
            if (acc) copyText(acc.password, 'Password disalin!');
        });
    });
    accountList.querySelectorAll('.delete-acc').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
    });
}

// =====================================================
// EXPIRY BADGE
// =====================================================
function getExpiryBadge(expiry) {
    if (!expiry) return '';
    const today = new Date(); today.setHours(0,0,0,0);
    const exp = new Date(expiry);
    const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

    let cls = 'ok', text = '';
    if (diff < 0) { cls = 'expired'; text = 'EXPIRED'; }
    else if (diff <= 7) { cls = 'warning'; text = `${diff}H`; }
    else { text = `${diff}H`; }

    return `<span class="badge ${cls}" style="
        padding: 3px 8px; border-radius: 6px; font-size: 10px;
        font-weight: 700; letter-spacing: 1px;
        ${cls === 'ok' ? 'background:rgba(0,255,136,0.1);color:var(--green);border:1px solid rgba(0,255,136,0.3)' : ''}
        ${cls === 'warning' ? 'background:rgba(255,187,51,0.1);color:var(--yellow);border:1px solid rgba(255,187,51,0.3)' : ''}
        ${cls === 'expired' ? 'background:rgba(255,51,102,0.1);color:var(--red);border:1px solid rgba(255,51,102,0.3)' : ''}
    ">${text}</span>`;
}

// =====================================================
// TOGGLE VIEW PASSWORD
// =====================================================
function toggleView(btn) {
    const item = btn.closest('.account-item');
    const passEl = item.querySelector('.pass');
    const realPass = passEl.dataset.pass;
    const icon = btn.querySelector('i');

    if (passEl.classList.contains('masked')) {
        passEl.textContent = realPass || '(kosong)';
        passEl.classList.remove('masked');
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passEl.textContent = '••••••••••';
        passEl.classList.add('masked');
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// =====================================================
// COPY TO CLIPBOARD
// =====================================================
function copyText(text, message) {
    if (!text) return showToast('Tidak ada data untuk disalin', 'error');
    navigator.clipboard.writeText(text)
        .then(() => showToast(message, 'success'))
        .catch(() => showToast('Gagal menyalin', 'error'));
}

// =====================================================
// DELETE MODAL (REALTIME REMOVE)
// =====================================================
function openDeleteModal(id) {
    pendingDeleteId = id;
    modalConfirm.classList.remove('hidden');
}
modalCancel.addEventListener('click', () => {
    modalConfirm.classList.add('hidden');
    pendingDeleteId = null;
});
modalYes.addEventListener('click', () => {
    if (!pendingDeleteId) return;
    const accountRef = ref(db, `accounts/${pendingDeleteId}`);
    remove(accountRef)
        .then(() => showToast('Kredensial berhasil dihapus secara real-time', 'success'))
        .catch((err) => showToast('Gagal hapus: ' + err.message, 'error'));
    modalConfirm.classList.add('hidden');
    pendingDeleteId = null;
});

// =====================================================
// PIN SECURITY FUNCTIONS (CHANGE & RESET PIN)
// =====================================================
document.getElementById('btn-change-pin').addEventListener('click', () => {
    currentPinAction = 'change';
    pinModalTitle.textContent = 'CHANGE PIN';
    pinModalDesc.textContent = 'Masukkan PIN keamanan baru Anda (4-6 digit).';
    pinInputField.value = '';
    modalPin.classList.remove('hidden');
});

document.getElementById('btn-reset-pin').addEventListener('click', () => {
    currentPinAction = 'reset';
    pinModalTitle.textContent = 'RESET MASTER PIN';
    pinModalDesc.textContent = 'Masukkan PIN master baru untuk mereset sistem.';
    pinInputField.value = '';
    modalPin.classList.remove('hidden');
});

pinModalCancel.addEventListener('click', () => {
    modalPin.classList.add('hidden');
    pinInputField.value = '';
});

pinModalSubmit.addEventListener('click', () => {
    const newPin = pinInputField.value.trim();
    if (!newPin || newPin.length < 4) {
        showToast('PIN minimal harus 4 digit!', 'error');
        return;
    }

    const formattedDate = new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    const securityRef = ref(db, 'security/meta');
    update(securityRef, {
        pin: newPin,
        lastPinChange: formattedDate,
        actionType: currentPinAction
    })
    .then(() => {
        showToast(currentPinAction === 'change' ? 'PIN berhasil diubah secara real-time!' : 'PIN berhasil di-reset secara real-time!', 'success');
        modalPin.classList.add('hidden');
        pinInputField.value = '';
    })
    .catch((err) => {
        showToast('Gagal memperbarui PIN: ' + err.message, 'error');
    });
});

// =====================================================
// SEARCH
// =====================================================
searchInput.addEventListener('input', renderAccounts);

// =====================================================
// HELPERS
// =====================================================
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}
