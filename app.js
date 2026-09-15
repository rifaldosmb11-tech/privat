// =====================================================
// FIREBASE SDK v10 (Modular)
// =====================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    getDatabase, ref, push, set, onValue, remove
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

// ===== KONFIGURASI (TETAP SAMA) =====
const firebaseConfig = {
    apiKey: "AIzaSyBn-uDAM6-p4mqGlnQE3COQDDY4NZMXdxM",
    authDomain: "data-login-ab566.firebaseapp.com",
    projectId: "data-login-ab566",
    storageBucket: "data-login-ab566.firebasestorage.app",
    messagingSenderId: "657749656398",
    appId: "1:657749656398:web:02b491806c0b55ae4f541f",
    measurementId: "G-W9B1LCP02G"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);

// ===== DOM =====
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

let accountsCache = {};
let pendingDeleteId = null;

// =====================================================
// STARFIELD
// =====================================================
(function initStars() {
    const canvas = document.getElementById('stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        stars = Array.from({ length: 120 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.4 + 0.3,
            a: Math.random(),
            s: Math.random() * 0.015 + 0.005
        }));
    }
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(st => {
            st.a += st.s;
            const alpha = 0.3 + Math.abs(Math.sin(st.a)) * 0.7;
            ctx.beginPath();
            ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(0, 212, 255, 0.6)';
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    window.addEventListener('resize', resize);
    resize();
    draw();
})();

// =====================================================
// TOAST
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
// AUTH STATE
// =====================================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        userEmail.textContent = user.email;
        loadAccounts();
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

// =====================================================
// PASSWORD GENERATOR
// =====================================================
document.getElementById('gen-pass').addEventListener('click', () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 16; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    accPasswordInput.value = pass;
    accPasswordInput.dispatchEvent(new Event('input'));
    accPasswordInput.type = 'text';
    document.querySelector('[data-target="acc-password"] i')
        .classList.replace('fa-eye', 'fa-eye-slash');
    showToast('Password kuat digenerate!', 'success');
});

// =====================================================
// SUBMIT NEW ACCOUNT
// =====================================================
addAccountForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const serviceName = document.getElementById('service-name').value.trim();
    const username = document.getElementById('acc-username').value.trim();
    const password = accPasswordInput.value;
    const expiry = document.getElementById('acc-expiry').value;

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
        strengthFill.style.width = '0%';
        strengthLabel.textContent = 'Lemah';
        showToast('Kredensial tersimpan ke vault!', 'success');
    })
    .catch((err) => showToast('Gagal menyimpan: ' + err.message, 'error'));
});

// =====================================================
// LOAD ACCOUNTS (REALTIME)
// =====================================================
function loadAccounts() {
    const accountsRef = ref(db, 'accounts');
    onValue(accountsRef, (snapshot) => {
        accountsCache = snapshot.val() || {};
        renderAccounts();
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

    // Attach events
    accountList.querySelectorAll('.toggle-view').forEach(btn => {
        btn.addEventListener('click', () => toggleView(btn));
    });
    accountList.querySelectorAll('.copy-user').forEach(btn => {
        btn.addEventListener('click', () => {
            const acc = accountsCache[btn.dataset.id];
            if (acc) copyText(acc.username, 'Username dicopy!');
        });
    });
    accountList.querySelectorAll('.copy-pass').forEach(btn => {
        btn.addEventListener('click', () => {
            const acc = accountsCache[btn.dataset.id];
            if (acc) copyText(acc.password, 'Password dicopy!');
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
    if (!text) return showToast('Tidak ada data untuk dicopy', 'error');
    navigator.clipboard.writeText(text)
        .then(() => showToast(message, 'success'))
        .catch(() => showToast('Gagal copy', 'error'));
}

// =====================================================
// DELETE MODAL
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
        .then(() => showToast('Kredensial dihapus', 'success'))
        .catch((err) => showToast('Gagal hapus: ' + err.message, 'error'));
    modalConfirm.classList.add('hidden');
    pendingDeleteId = null;
});
modalConfirm.addEventListener('click', (e) => {
    if (e.target === modalConfirm) {
        modalConfirm.classList.add('hidden');
        pendingDeleteId = null;
    }
});

// =====================================================
// SEARCH
// =====================================================
searchInput.addEventListener('input', renderAccounts);

// =====================================================
// PIN BUTTONS (placeholder)
// =====================================================
document.getElementById('btn-change-pin').addEventListener('click', () => {
    showToast('Fitur Change PIN segera hadir', 'info');
});
document.getElementById('btn-reset-pin').addEventListener('click', () => {
    showToast('Reset PIN memerlukan Master Admin', 'error');
});

// =====================================================
// HELPERS
// =====================================================
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}
