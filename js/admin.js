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

const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');

// Oturum Durumu Kontrolü
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        // Oturum varsa login ekranını gizle, paneli göster
        if(loginSection) loginSection.style.display = 'none';
        if(dashboardSection) dashboardSection.style.display = 'block';
        
        loadDashboardData();
    } else {
        // Oturum yoksa paneli gizle, login göster
        if(dashboardSection) dashboardSection.style.display = 'none';
        if(loginSection) loginSection.style.display = 'flex';
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

// Portföy DOM
const addPortfolioForm = document.getElementById('addPortfolioForm');
const portfolioList = document.getElementById('portfolioList');

import { fetchPortfolioItems, addPortfolioItem, deletePortfolioItem } from './supabase-client.js';

// Portföy Listesini Yenile
async function renderPortfolioList() {
    if (!portfolioList) return;
    
    portfolioList.innerHTML = '<p class="text-sm text-[#c6c6cd]">Yükleniyor...</p>';
    const items = await fetchPortfolioItems();
    
    if (items.length === 0) {
        portfolioList.innerHTML = '<p class="text-sm text-[#c6c6cd]">Henüz eklenmiş bir proje yok.</p>';
        return;
    }
    
    portfolioList.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between bg-[#101415] p-3 rounded-lg border border-[#45464d]';
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${item.image_url}" alt="${item.title}" class="w-12 h-12 rounded object-cover">
                <div>
                    <h4 class="text-white font-medium text-sm">${item.title}</h4>
                    <p class="text-xs text-[#c6c6cd] truncate w-40">${item.description}</p>
                </div>
            </div>
            <button class="delete-btn px-3 py-1 bg-[#93000a] text-white rounded text-xs hover:bg-red-800" data-id="${item.id}">Sil</button>
        `;
        portfolioList.appendChild(div);
    });

    // Silme butonlarına olay ekle
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Bu projeyi silmek istediğinize emin misiniz?')) {
                e.target.textContent = 'Siliniyor...';
                const err = await deletePortfolioItem(id);
                if (err) alert('Silme hatası: ' + err.message);
                else renderPortfolioList();
            }
        });
    });
}

// Dashboard Verilerini Yükle fonksiyonunu güncelle
async function loadDashboardData() {
    const content = await fetchSiteContent();
    if (content) {
        if (heroTitleInput && content.hero_title) heroTitleInput.value = content.hero_title;
        if (heroDescInput && content.hero_desc) heroDescInput.value = content.hero_desc;
    }
    renderPortfolioList();
}

// Form Ekleme Olayı
if (addPortfolioForm) {
    addPortfolioForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('addPortfolioBtn');
        btn.textContent = 'Ekleniyor...';
        
        const item = {
            title: document.getElementById('p_title').value,
            description: document.getElementById('p_desc').value,
            category_tags: document.getElementById('p_tags').value,
            image_url: document.getElementById('p_image').value,
            link: document.getElementById('p_link').value
        };
        
        const err = await addPortfolioItem(item);
        if (err) {
            alert('Ekleme hatası: ' + err.message);
        } else {
            addPortfolioForm.reset();
            renderPortfolioList();
        }
        btn.textContent = 'Uygulamayı Ekle';
    });
}

// Sayfa yüklendiğinde oturumu kontrol et
document.addEventListener('DOMContentLoaded', checkSession);
