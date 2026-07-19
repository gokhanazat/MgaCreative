import { supabase, fetchSiteContent } from './supabase-client.js';

// DOM Elementleri
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

const logoutBtn = document.getElementById('logoutBtn');

const heroTitleInput = document.getElementById('hero_title');
const heroDescInput = document.getElementById('hero_desc');
const saveContentBtn = document.getElementById('saveContentBtn');
const contentStatus = document.getElementById('contentStatus');

// Oturum Durumu Kontrolü
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        // Oturum varsa login ekranını gizle, paneli göster
        if(document.querySelector('.h-\\[80vh\\]')) document.querySelector('.h-\\[80vh\\]').style.display = 'none';
        if(logoutBtn) logoutBtn.closest('div').parentElement.style.display = 'block';
        
        loadDashboardData();
    } else {
        // Oturum yoksa paneli gizle, login göster
        if(logoutBtn) logoutBtn.closest('div').parentElement.style.display = 'none';
        if(document.querySelector('.h-\\[80vh\\]')) document.querySelector('.h-\\[80vh\\]').style.display = 'flex';
    }
}

// Login İşlemi
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginBtn.textContent = 'Giriş Yapılıyor...';
        loginError.style.display = 'none';

        const { data, error } = await supabase.auth.signInWithPassword({
            email: emailInput.value,
            password: passwordInput.value,
        });

        if (error) {
            loginError.textContent = 'Giriş başarısız: ' + error.message;
            loginError.style.display = 'block';
            loginBtn.textContent = 'Giriş Yap';
        } else {
            window.location.reload(); // Başarılı girişte sayfayı yenile
        }
    });
}

// Çıkış İşlemi
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.reload();
    });
}

// Dashboard Verilerini Yükle
async function loadDashboardData() {
    const content = await fetchSiteContent();
    if (content) {
        if (heroTitleInput && content.hero_title) heroTitleInput.value = content.hero_title;
        if (heroDescInput && content.hero_desc) heroDescInput.value = content.hero_desc;
    }
}

// İçerik Kaydetme
if (saveContentBtn) {
    saveContentBtn.addEventListener('click', async () => {
        saveContentBtn.textContent = 'Kaydediliyor...';
        
        // Upsert işlemi (id varsa günceller, yoksa ekler)
        const updates = [
            { id: 'hero_title', content: heroTitleInput.value },
            { id: 'hero_desc', content: heroDescInput.value }
        ];

        const { error } = await supabase
            .from('site_content')
            .upsert(updates);

        if (error) {
            alert('Kaydetme hatası: ' + error.message);
        } else {
            contentStatus.style.display = 'inline';
            setTimeout(() => {
                contentStatus.style.display = 'none';
            }, 3000);
        }
        saveContentBtn.textContent = 'Değişiklikleri Kaydet';
    });
}

// Sayfa yüklendiğinde oturumu kontrol et
document.addEventListener('DOMContentLoaded', checkSession);
