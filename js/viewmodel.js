import { fetchSiteContent } from './supabase-client.js';

// DOM Elements
const heroTitleElement = document.getElementById('hero-title');
const heroDescElement = document.getElementById('hero-desc');

async function updatePageContent() {
    const contentMap = await fetchSiteContent();
    
    if (contentMap) {
        // Eğer veritabanında hero_title varsa DOM'a bas
        if (heroTitleElement && contentMap.hero_title) {
            heroTitleElement.innerHTML = contentMap.hero_title;
        }
        
        // Eğer veritabanında hero_desc varsa DOM'a bas
        if (heroDescElement && contentMap.hero_desc) {
            heroDescElement.innerHTML = contentMap.hero_desc;
        }
    }
}

// Sayfa yüklendiğinde verileri çek
document.addEventListener('DOMContentLoaded', updatePageContent);
