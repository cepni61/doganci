// Admin Panel JavaScript

// Oturum kontrolü
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Sayfa yüklendiğinde
window.addEventListener('load', async () => {
    if (!await checkAuth()) return;
    
    // Dashboard'u yükle
    loadDashboard();
    loadMembers();
    loadNews();
});

// Çıkış yap
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        if (link.getAttribute('href') === '#') {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            if (section) {
                showSection(section);
                
                // Active state
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        }
    });
});

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
    try {
        // Üye sayısı
        const { count: memberCount } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true });
        document.getElementById('totalMembers').textContent = memberCount || 0;
        
        // Haber sayısı
        const { count: newsCount } = await supabase
            .from('news')
            .select('*', { count: 'exact', head: true });
        document.getElementById('totalNews').textContent = newsCount || 0;
        
        // Son eklenen üye
        const { data: latestMember } = await supabase
            .from('members')
            .select('name')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        if (latestMember) {
            document.getElementById('latestMember').textContent = latestMember.name;
        }
        
    } catch (error) {
        console.error('Dashboard yükleme hatası:', error);
    }
}

// ============================================
// MEMBERS
// ============================================
let currentMemberId = null;
let memberPhotoFile = null;

async function loadMembers() {
    const loading = document.getElementById('membersLoading');
    const empty = document.getElementById('membersEmpty');
    const table = document.getElementById('membersTable');
    const tbody = document.getElementById('membersTableBody');
    
    try {
        loading.style.display = 'block';
        empty.style.display = 'none';
        table.style.display = 'none';
        
        const { data: members, error } = await supabase
            .from('members')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        loading.style.display = 'none';
        
        if (!members || members.length === 0) {
            empty.style.display = 'block';
            return;
        }
        
        table.style.display = 'table';
        tbody.innerHTML = members.map(member => `
            <tr>
                <td>
                    ${member.photo_url 
                        ? `<img src="${member.photo_url}" class="member-photo" alt="${member.name}">` 
                        : '👤'}
                </td>
                <td>${member.name}</td>
                <td>${member.profession || '-'}</td>
                <td>${member.phone || '-'}</td>
                <td>${member.email || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editMember('${member.id}')">✏️ Düzenle</button>
                        <button class="btn-delete" onclick="deleteMember('${member.id}', '${member.name}')">🗑️ Sil</button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Üyeler yükleme hatası:', error);
        loading.textContent = 'Hata: ' + error.message;
    }
}

// Üye modal aç
document.getElementById('addMemberBtn').addEventListener('click', () => {
    currentMemberId = null;
    memberPhotoFile = null;
    document.getElementById('memberModalTitle').textContent = 'Yeni Üye Ekle';
    document.getElementById('memberForm').reset();
    document.getElementById('memberPhotoPreview').style.display = 'none';
    document.getElementById('photoUploadText').style.display = 'block';
    document.getElementById('memberModal').classList.add('show');
});

function closeMemberModal() {
    document.getElementById('memberModal').classList.remove('show');
}

// Fotoğraf önizleme
function previewMemberPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        memberPhotoFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('memberPhotoPreview').src = e.target.result;
            document.getElementById('memberPhotoPreview').style.display = 'block';
            document.getElementById('photoUploadText').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

// Üye kaydet
document.getElementById('memberForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Kaydediliyor...';
    
    try {
        let photoUrl = null;
        
        // Fotoğraf yükleme
        if (memberPhotoFile) {
            const fileExt = memberPhotoFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('member-photos')
                .upload(fileName, memberPhotoFile);
            
            if (uploadError) throw uploadError;
            
            // Public URL al
            const { data: { publicUrl } } = supabase.storage
                .from('member-photos')
                .getPublicUrl(fileName);
            
            photoUrl = publicUrl;
        }
        
        const memberData = {
            name: document.getElementById('memberName').value,
            profession: document.getElementById('memberProfession').value || null,
            company: document.getElementById('memberCompany').value || null,
            phone: document.getElementById('memberPhone').value || null,
            email: document.getElementById('memberEmail').value || null,
            city: document.getElementById('memberCity').value || null,
            ilce: document.getElementById('memberAddress').value || null,
            keywords: document.getElementById('memberKeywords').value || null,
        };
        
        if (photoUrl) {
            memberData.photo_url = photoUrl;
        }
        
        if (currentMemberId) {
            // Güncelleme
            const { error } = await supabase
                .from('members')
                .update(memberData)
                .eq('id', currentMemberId);
            
            if (error) throw error;
        } else {
            // Yeni kayıt
            const { error } = await supabase
                .from('members')
                .insert([memberData]);
            
            if (error) throw error;
        }
        
        closeMemberModal();
        loadMembers();
        loadDashboard();
        
    } catch (error) {
        console.error('Üye kaydetme hatası:', error);
        alert('Hata: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kaydet';
    }
});

// Üye düzenle
async function editMember(id) {
    try {
        const { data: member, error } = await supabase
            .from('members')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        currentMemberId = id;
        memberPhotoFile = null; // Fotoğraf değişkenini temizle

        document.getElementById('memberModalTitle').textContent = 'Üye Düzenle';
        document.getElementById('memberId').value = id;
        document.getElementById('memberName').value = member.name || '';
        document.getElementById('memberProfession').value = member.profession || '';
        document.getElementById('memberCompany').value = member.company || '';
        document.getElementById('memberPhone').value = member.phone || '';
        document.getElementById('memberEmail').value = member.email || '';
        document.getElementById('memberCity').value = member.city || '';
        document.getElementById('memberAddress').value = member.ilce || '';
        document.getElementById('memberKeywords').value = member.keywords || '';

        // Fotoğraf input'unu temizle
        document.getElementById('memberPhoto').value = '';

        if (member.photo_url) {
            document.getElementById('memberPhotoPreview').src = member.photo_url;
            document.getElementById('memberPhotoPreview').style.display = 'block';
            document.getElementById('photoUploadText').style.display = 'none';
        } else {
            document.getElementById('memberPhotoPreview').style.display = 'none';
            document.getElementById('photoUploadText').style.display = 'block';
        }

        document.getElementById('memberModal').classList.add('show');
        
    } catch (error) {
        console.error('Üye yükleme hatası:', error);
        alert('Hata: ' + error.message);
    }
}

// Üye sil
async function deleteMember(id, name) {
    if (!confirm(`"${name}" adlı üyeyi silmek istediğinize emin misiniz?`)) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        loadMembers();
        loadDashboard();
        
    } catch (error) {
        console.error('Üye silme hatası:', error);
        alert('Hata: ' + error.message);
    }
}

// ============================================
// NEWS
// ============================================
let currentNewsId = null;
let newsImageFile = null;

async function loadNews() {
    const loading = document.getElementById('newsLoading');
    const empty = document.getElementById('newsEmpty');
    const table = document.getElementById('newsTable');
    const tbody = document.getElementById('newsTableBody');
    
    try {
        loading.style.display = 'block';
        empty.style.display = 'none';
        table.style.display = 'none';
        
        const { data: news, error } = await supabase
            .from('news')
            .select('*')
            .order('published_at', { ascending: false });
        
        if (error) throw error;
        
        loading.style.display = 'none';
        
        if (!news || news.length === 0) {
            empty.style.display = 'block';
            return;
        }
        
        table.style.display = 'table';
        tbody.innerHTML = news.map(item => `
            <tr>
                <td>${item.title}</td>
                <td>${item.author || '-'}</td>
                <td>${new Date(item.published_at).toLocaleDateString('tr-TR')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editNews('${item.id}')">✏️ Düzenle</button>
                        <button class="btn-delete" onclick="deleteNews('${item.id}', '${item.title}')">🗑️ Sil</button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Haberler yükleme hatası:', error);
        loading.textContent = 'Hata: ' + error.message;
    }
}

// Haber modal aç
document.getElementById('addNewsBtn').addEventListener('click', () => {
    currentNewsId = null;
    newsImageFile = null;
    document.getElementById('newsModalTitle').textContent = 'Yeni Haber Ekle';
    document.getElementById('newsForm').reset();
    document.getElementById('newsImagePreview').style.display = 'none';
    document.getElementById('newsImageUploadText').style.display = 'block';
    document.getElementById('newsModal').classList.add('show');
});

function closeNewsModal() {
    document.getElementById('newsModal').classList.remove('show');
}

// Haber görseli önizleme
function previewNewsImage(event) {
    const file = event.target.files[0];
    if (file) {
        newsImageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('newsImagePreview').src = e.target.result;
            document.getElementById('newsImagePreview').style.display = 'block';
            document.getElementById('newsImageUploadText').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

// Haber kaydet
document.getElementById('newsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Kaydediliyor...';
    
    try {
        let imageUrl = null;
        
        // Görsel yükleme
        if (newsImageFile) {
            const fileExt = newsImageFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('news-images')
                .upload(fileName, newsImageFile);
            
            if (uploadError) throw uploadError;
            
            // Public URL al
            const { data: { publicUrl } } = supabase.storage
                .from('news-images')
                .getPublicUrl(fileName);
            
            imageUrl = publicUrl;
        }
        
        const newsData = {
            title: document.getElementById('newsTitle').value,
            content: document.getElementById('newsContent').value,
            author: document.getElementById('newsAuthor').value,
        };
        
        if (imageUrl) {
            newsData.image_url = imageUrl;
        }
        
        if (currentNewsId) {
            // Güncelleme
            const { error } = await supabase
                .from('news')
                .update(newsData)
                .eq('id', currentNewsId);
            
            if (error) throw error;
        } else {
            // Yeni kayıt
            const { error } = await supabase
                .from('news')
                .insert([newsData]);
            
            if (error) throw error;
        }
        
        closeNewsModal();
        loadNews();
        loadDashboard();
        
    } catch (error) {
        console.error('Haber kaydetme hatası:', error);
        alert('Hata: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kaydet';
    }
});

// Haber düzenle
async function editNews(id) {
    try {
        const { data: news, error } = await supabase
            .from('news')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        currentNewsId = id;
        document.getElementById('newsModalTitle').textContent = 'Haber Düzenle';
        document.getElementById('newsId').value = id;
        document.getElementById('newsTitle').value = news.title || '';
        document.getElementById('newsContent').value = news.content || '';
        document.getElementById('newsAuthor').value = news.author || '';
        
        if (news.image_url) {
            document.getElementById('newsImagePreview').src = news.image_url;
            document.getElementById('newsImagePreview').style.display = 'block';
            document.getElementById('newsImageUploadText').style.display = 'none';
        }
        
        document.getElementById('newsModal').classList.add('show');
        
    } catch (error) {
        console.error('Haber yükleme hatası:', error);
        alert('Hata: ' + error.message);
    }
}

// Haber sil
async function deleteNews(id, title) {
    if (!confirm(`"${title}" başlıklı haberi silmek istediğinize emin misiniz?`)) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('news')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        loadNews();
        loadDashboard();
        
    } catch (error) {
        console.error('Haber silme hatası:', error);
        alert('Hata: ' + error.message);
    }
}

// Global fonksiyonlar window'a ekle
window.editMember = editMember;
window.deleteMember = deleteMember;
window.editNews = editNews;
window.deleteNews = deleteNews;
window.closeMemberModal = closeMemberModal;
window.closeNewsModal = closeNewsModal;
window.previewMemberPhoto = previewMemberPhoto;
window.previewNewsImage = previewNewsImage;
