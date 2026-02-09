// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('Service Worker kayıt başarılı:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker kayıt hatası:', error);
            });
    });
}

// CSV Parse Helper - Geliştirilmiş Versiyon
function parseCSV(text) {
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.length > 0);
    
    if (lines.length === 0) {
        console.error('CSV boş!');
        return [];
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    console.log('CSV Headers:', headers);
    
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let char of line) {
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());
        
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        
        data.push(obj);
    }
    
    return data;
}

// Global değişken - üye verilerini sakla
let allMembers = [];

// Load Members - Arama ve Filtreleme ile
async function loadMembers() {
    const container = document.getElementById('members-list');
    const jobFilter = document.getElementById('jobFilter');
    const searchInput = document.getElementById('searchInput');
    
    try {
        const response = await fetch('members.csv');
        if (!response.ok) throw new Error('Üyeler yüklenemedi');
        
        const text = await response.text();
        allMembers = parseCSV(text);
        
        if (allMembers.length === 0) {
            container.innerHTML = '<div class="loading">Henüz üye bulunmuyor.</div>';
            return;
        }
        
        // Meslek filtresi için benzersiz meslekleri al
        const uniqueJobs = [...new Set(allMembers.map(m => m.meslek).filter(j => j))].sort();
        
        // Filtre seçeneklerini doldur
        if (jobFilter) {
            jobFilter.innerHTML = '<option value="">💼 Tüm Meslekler</option>';
            uniqueJobs.forEach(job => {
                const option = document.createElement('option');
                option.value = job;
                option.textContent = job;
                jobFilter.appendChild(option);
            });
            
            // Filtre değiştiğinde
            jobFilter.addEventListener('change', filterMembers);
        }
        
        // Arama kutusu değiştiğinde
        if (searchInput) {
            searchInput.addEventListener('input', filterMembers);
        }
        
        // İlk yükleme - tüm üyeleri göster
        displayMembers(allMembers);
        
    } catch (error) {
        console.error('Üyeler yüklenirken hata:', error);
        container.innerHTML = '<div class="loading">Üyeler yüklenirken bir hata oluştu.</div>';
    }
}

// Üyeleri filtrele
function filterMembers() {
    const searchInput = document.getElementById('searchInput');
    const jobFilter = document.getElementById('jobFilter');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedJob = jobFilter ? jobFilter.value : '';
    
    let filteredMembers = allMembers;
    
    // Meslek filtresi
    if (selectedJob) {
        filteredMembers = filteredMembers.filter(m => m.meslek === selectedJob);
    }
    
    // Arama filtresi (isim, soyisim, şirket, şehir, ilçe)
    if (searchTerm) {
        filteredMembers = filteredMembers.filter(m => {
            const searchText = `${m.name} ${m.soyisim} ${m.company} ${m.il} ${m.ilce}`.toLowerCase();
            return searchText.includes(searchTerm);
        });
    }
    
    displayMembers(filteredMembers);
}

// Üyeleri ekranda göster
function displayMembers(members) {
    const container = document.getElementById('members-list');
    const resultCount = document.getElementById('resultCount');
    
    // Sonuç sayısını güncelle
    if (resultCount) {
        resultCount.textContent = members.length;
    }
    
    if (members.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-text">Sonuç bulunamadı</div>
                <div class="no-results-hint">Farklı bir arama terimi veya filtre deneyin</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = members.map(member => {
        const photoUrl = member.photo || 'https://via.placeholder.com/80?text=Foto';
        const phone = member.phone || '';
        
        return `
            <div class="member-card">
                <img src="${photoUrl}" 
                     alt="${member.name} ${member.soyisim}" 
                     class="member-photo"
                     onerror="this.src='https://via.placeholder.com/80?text=Foto'">
                <div class="member-info">
                    <div class="member-name">${member.name} ${member.soyisim}</div>
                    <div class="member-job">${member.meslek}</div>
                    <div class="member-company">${member.company}</div>
                    <div class="member-location">${member.il} / ${member.ilce}</div>
                    ${phone ? `<div class="member-phone"><a href="tel:${phone}" class="phone-link">📞 Ara</a></div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Load News (Değişiklik yok)
async function loadNews() {
    const container = document.getElementById('news-grid');
    
    try {
        const response = await fetch('news.csv');
        if (!response.ok) throw new Error('Haberler yüklenemedi');
        
        const text = await response.text();
        const news = parseCSV(text);
        
        if (news.length === 0) {
            container.innerHTML = '<div class="loading">Henüz haber bulunmuyor.</div>';
            return;
        }
        
        container.innerHTML = news.map(item => {
            const imageUrl = item.image || 'https://via.placeholder.com/400x200?text=Haber+Görseli';
            
            return `
                <div class="news-card">
                    <img src="${imageUrl}" 
                         alt="${item.title}" 
                         class="news-image"
                         onerror="this.src='https://via.placeholder.com/400x200?text=Haber+Görseli'">
                    <div class="news-content">
                        <h3 class="news-title">${item.title}</h3>
                        <div class="news-date">${item.date}</div>
                        <p class="news-text">${item.content}</p>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Haberler yüklenirken hata:', error);
        container.innerHTML = '<div class="loading">Haberler yüklenirken bir hata oluştu.</div>';
    }
}