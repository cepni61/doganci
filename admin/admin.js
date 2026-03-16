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
    loadRequests();
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

                // Mobilde sidebar'i kapa
                const sidebar = document.getElementById('sidebar');
                const overlay = document.getElementById('sidebarOverlay');
                if (sidebar) sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('show');
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

        // Bekleyen talep sayisi
        const { count: pendingCount } = await supabase
            .from('member_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        const pendingEl = document.getElementById('pendingRequests');
        if (pendingEl) pendingEl.textContent = pendingCount || 0;

        // Badge guncelle
        const badge = document.getElementById('pendingBadge');
        if (badge) {
            badge.textContent = pendingCount || 0;
            badge.style.display = (pendingCount > 0) ? 'inline-flex' : 'none';
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
        tbody.innerHTML = members.map(member => {
            const safeName = (member.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            return `
            <tr>
                <td>
                    ${member.photo_url
                        ? `<img src="${member.photo_url}" class="member-photo" alt="${safeName}">`
                        : '👤'}
                </td>
                <td>${member.name}</td>
                <td>${member.profession || '-'}</td>
                <td>${member.sector || '-'}</td>
                <td>${member.phone || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editMember('${member.id}')">✏️ Düzenle</button>
                        <button class="btn-delete" onclick="deleteMember('${member.id}', '${safeName}')">🗑️ Sil</button>
                    </div>
                </td>
            </tr>
        `}).join('');
        
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
            sector: document.getElementById('memberSector').value || null,
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
        showToast(currentMemberId ? 'Uye guncellendi!' : 'Yeni uye eklendi!');

    } catch (error) {
        console.error('Uye kaydetme hatasi:', error);
        showToast('Hata: ' + error.message, 'error');
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
        document.getElementById('memberSector').value = member.sector || '';
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
        showToast('Hata: ' + error.message, 'error');
    }
}

// Üye sil
async function deleteMember(id, name) {
    if (!confirm(`"${name}" adlı üyeyi silmek istediğinize emin misiniz?`)) {
        return;
    }

    try {
        const { data, error } = await supabase
            .from('members')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            showToast('Üye silinemedi - kayıt bulunamadı.', 'error');
            return;
        }

        await loadMembers();
        await loadDashboard();
        showToast('Uye silindi.');

    } catch (error) {
        console.error('Uye silme hatasi:', error);
        showToast('Hata: ' + error.message, 'error');
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
        tbody.innerHTML = news.map(item => {
            const safeTitle = (item.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            return `
            <tr>
                <td>${item.title}</td>
                <td>${item.category || '-'}</td>
                <td>${item.author || '-'}</td>
                <td>${new Date(item.published_at).toLocaleDateString('tr-TR')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editNews('${item.id}')">✏️ Düzenle</button>
                        <button class="btn-delete" onclick="deleteNews('${item.id}', '${safeTitle}')">🗑️ Sil</button>
                    </div>
                </td>
            </tr>
        `}).join('');
        
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
            category: document.getElementById('newsCategory').value || null,
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
        showToast(currentNewsId ? 'Haber guncellendi!' : 'Yeni haber eklendi!');

    } catch (error) {
        console.error('Haber kaydetme hatasi:', error);
        showToast('Hata: ' + error.message, 'error');
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
        document.getElementById('newsCategory').value = news.category || '';
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
        showToast('Hata: ' + error.message, 'error');
    }
}

// Haber sil
async function deleteNews(id, title) {
    if (!confirm(`"${title}" başlıklı haberi silmek istediğinize emin misiniz?`)) {
        return;
    }

    try {
        const { data, error } = await supabase
            .from('news')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            showToast('Haber silinemedi - kayıt bulunamadı.', 'error');
            return;
        }

        await loadNews();
        await loadDashboard();
        showToast('Haber silindi.');

    } catch (error) {
        console.error('Haber silme hatasi:', error);
        showToast('Hata: ' + error.message, 'error');
    }
}

// ============================================
// NOTIFICATIONS (Push)
// ============================================
async function loadSubscriberCount() {
    try {
        const { count } = await supabase
            .from('push_subscriptions')
            .select('*', { count: 'exact', head: true });
        var el = document.getElementById('totalSubscribers');
        if (el) el.textContent = count || 0;
    } catch (error) {
        console.error('Abone sayısı yüklenemedi:', error);
    }
}

var notifForm = document.getElementById('notificationForm');
if (notifForm) {
    notifForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        var btn = document.getElementById('sendNotifBtn');
        var result = document.getElementById('notifResult');
        btn.disabled = true;
        btn.textContent = 'Gönderiliyor...';
        result.style.display = 'none';

        try {
            var session = await supabase.auth.getSession();
            var token = session.data.session.access_token;

            var response = await fetch(
                'https://nxywtyvcqkejvehpnoyw.supabase.co/functions/v1/send-push',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        title: document.getElementById('notifTitle').value,
                        body: document.getElementById('notifBody').value,
                        url: document.getElementById('notifUrl').value || './index.html'
                    })
                }
            );

            var data = await response.json();

            if (response.ok) {
                result.style.display = 'block';
                result.style.background = '#e8f5e9';
                result.style.color = '#2e7d32';
                result.textContent = 'Başarılı! ' + (data.sent || 0) + ' kişiye bildirim gönderildi.' +
                    (data.cleaned > 0 ? ' ' + data.cleaned + ' geçersiz abonelik temizlendi.' : '');
                showToast('Bildirimler gönderildi!');
                notifForm.reset();
                loadSubscriberCount();
            } else {
                throw new Error(data.error || 'Bilinmeyen hata');
            }
        } catch (error) {
            result.style.display = 'block';
            result.style.background = '#ffebee';
            result.style.color = '#c62828';
            result.textContent = 'Hata: ' + error.message;
            showToast('Bildirim gönderilemedi!', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '&#128276; Bildirim Gönder';
        }
    });
}

loadSubscriberCount();

// ============================================
// MEMBERSHIP REQUESTS (Talepler)
// ============================================
let allRequests = [];
let currentRequestFilter = 'pending';
let editReqPhotoFile = null;

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function loadRequests() {
    var loading = document.getElementById('requestsLoading');
    var empty = document.getElementById('requestsEmpty');
    var list = document.getElementById('requestsList');

    if (!loading || !empty || !list) return;

    try {
        loading.style.display = 'block';
        empty.style.display = 'none';
        list.innerHTML = '';

        var { data: requests, error } = await supabase
            .from('member_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allRequests = requests || [];
        loading.style.display = 'none';

        displayRequests();
        updatePendingBadge();

    } catch (error) {
        console.error('Talepler yukleme hatasi:', error);
        if (loading) loading.textContent = 'Hata: ' + error.message;
    }
}

function displayRequests() {
    var empty = document.getElementById('requestsEmpty');
    var list = document.getElementById('requestsList');

    var filtered = allRequests;
    if (currentRequestFilter !== 'all') {
        filtered = allRequests.filter(function(r) { return r.status === currentRequestFilter; });
    }

    if (filtered.length === 0) {
        empty.style.display = 'block';
        list.innerHTML = '';
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = filtered.map(function(req) {
        var statusClass = req.status;
        var statusText = req.status === 'pending' ? 'Bekliyor'
            : req.status === 'approved' ? 'Onaylandi' : 'Reddedildi';

        var date = new Date(req.created_at);
        var dateStr = date.toLocaleDateString('tr-TR') + ' ' +
            date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

        return '<div class="request-card ' + statusClass + '">' +
            (req.photo_url ? '<img src="' + escapeHtml(req.photo_url) + '" class="request-photo" alt="' + escapeHtml(req.name) + '">' : '') +
            '<h4>' + escapeHtml(req.name) + '</h4> ' +
            '<span class="request-status-badge ' + statusClass + '">' + statusText + '</span>' +
            '<div class="request-details">' +
                (req.profession ? '<strong>Meslek:</strong> ' + escapeHtml(req.profession) + '<br>' : '') +
                (req.sector ? '<strong>Sektor:</strong> ' + escapeHtml(req.sector) + '<br>' : '') +
                (req.company ? '<strong>Sirket:</strong> ' + escapeHtml(req.company) + '<br>' : '') +
                (req.phone ? '<strong>Telefon:</strong> ' + escapeHtml(req.phone) + '<br>' : '') +
                (req.email ? '<strong>Email:</strong> ' + escapeHtml(req.email) + '<br>' : '') +
                ((req.city || req.ilce) ? '<strong>Konum:</strong> ' + escapeHtml([req.ilce, req.city].filter(Boolean).join(' / ')) + '<br>' : '') +
                (req.keywords ? '<strong>Anahtar Kelimeler:</strong> ' + escapeHtml(req.keywords) + '<br>' : '') +
                (req.admin_note ? '<strong>Admin Notu:</strong> ' + escapeHtml(req.admin_note) + '<br>' : '') +
                '<small style="color:#999;">Basvuru: ' + dateStr + '</small>' +
            '</div>' +
            (req.status === 'pending' ?
                '<div class="request-actions">' +
                    '<button class="btn-edit-req" onclick="editRequest(\'' + req.id + '\')">&#9998; Duzenle</button>' +
                    '<button class="btn-approve" onclick="approveRequest(\'' + req.id + '\')">&#10003; Onayla</button>' +
                    '<button class="btn-reject" onclick="rejectRequest(\'' + req.id + '\')">&#10007; Reddet</button>' +
                '</div>' : '') +
        '</div>';
    }).join('');
}

function filterRequests(status) {
    currentRequestFilter = status;
    document.querySelectorAll('.filter-tab').forEach(function(tab) {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    displayRequests();
}

function updatePendingBadge() {
    var pendingCount = allRequests.filter(function(r) { return r.status === 'pending'; }).length;
    var badge = document.getElementById('pendingBadge');
    if (badge) {
        badge.textContent = pendingCount;
        badge.style.display = pendingCount > 0 ? 'inline-flex' : 'none';
    }
    var pendingEl = document.getElementById('pendingRequests');
    if (pendingEl) pendingEl.textContent = pendingCount;
}

// Talep duzenle
function editRequest(id) {
    var req = allRequests.find(function(r) { return r.id === id; });
    if (!req) return;

    editReqPhotoFile = null;
    document.getElementById('editReqId').value = id;
    document.getElementById('editReqName').value = req.name || '';
    document.getElementById('editReqProfession').value = req.profession || '';
    document.getElementById('editReqSector').value = req.sector || '';
    document.getElementById('editReqCompany').value = req.company || '';
    document.getElementById('editReqPhone').value = req.phone || '';
    document.getElementById('editReqEmail').value = req.email || '';
    document.getElementById('editReqCity').value = req.city || '';
    document.getElementById('editReqIlce').value = req.ilce || '';
    document.getElementById('editReqKeywords').value = req.keywords || '';

    document.getElementById('editReqPhoto').value = '';
    if (req.photo_url) {
        document.getElementById('editReqPhotoPreview').src = req.photo_url;
        document.getElementById('editReqPhotoPreview').style.display = 'block';
        document.getElementById('editReqPhotoUploadText').style.display = 'none';
    } else {
        document.getElementById('editReqPhotoPreview').style.display = 'none';
        document.getElementById('editReqPhotoUploadText').style.display = 'block';
    }

    document.getElementById('requestEditModal').classList.add('show');
}

function closeRequestEditModal() {
    document.getElementById('requestEditModal').classList.remove('show');
}

function previewEditReqPhoto(event) {
    var file = event.target.files[0];
    if (file) {
        editReqPhotoFile = file;
        var reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('editReqPhotoPreview').src = e.target.result;
            document.getElementById('editReqPhotoPreview').style.display = 'block';
            document.getElementById('editReqPhotoUploadText').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

// Talep duzenleme kaydet
var reqEditForm = document.getElementById('requestEditForm');
if (reqEditForm) {
    reqEditForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        var submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Kaydediliyor...';

        try {
            var id = document.getElementById('editReqId').value;
            var updateData = {
                name: document.getElementById('editReqName').value.trim(),
                profession: document.getElementById('editReqProfession').value.trim() || null,
                sector: document.getElementById('editReqSector').value || null,
                company: document.getElementById('editReqCompany').value.trim() || null,
                phone: document.getElementById('editReqPhone').value.trim() || null,
                email: document.getElementById('editReqEmail').value.trim() || null,
                city: document.getElementById('editReqCity').value.trim() || null,
                ilce: document.getElementById('editReqIlce').value.trim() || null,
                keywords: document.getElementById('editReqKeywords').value.trim() || null,
                updated_at: new Date().toISOString()
            };

            // Yeni fotograf yuklendi mi?
            if (editReqPhotoFile) {
                var fileExt = editReqPhotoFile.name.split('.').pop();
                var fileName = Date.now() + '.' + fileExt;
                var { error: uploadError } = await supabase.storage
                    .from('request-photos')
                    .upload(fileName, editReqPhotoFile);
                if (uploadError) throw uploadError;

                var { data: urlData } = supabase.storage
                    .from('request-photos')
                    .getPublicUrl(fileName);
                updateData.photo_url = urlData.publicUrl;
            }

            var { error } = await supabase
                .from('member_requests')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            closeRequestEditModal();
            await loadRequests();
            showToast('Talep guncellendi!');

        } catch (error) {
            console.error('Talep guncelleme hatasi:', error);
            showToast('Hata: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Degisiklikleri Kaydet';
        }
    });
}

// Talep onayla
async function approveRequest(id) {
    if (!confirm('Bu basvuruyu onaylamak istediginize emin misiniz? Uye listesine eklenecektir.')) {
        return;
    }

    try {
        // 1. Talep verisini al
        var { data: request, error: fetchError } = await supabase
            .from('member_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // 2. Fotografi member-photos'a kopyala
        var memberPhotoUrl = request.photo_url;

        if (request.photo_url && request.photo_url.includes('request-photos')) {
            try {
                var fileName = request.photo_url.split('/request-photos/')[1];
                if (fileName) {
                    var { data: fileData, error: downloadError } = await supabase.storage
                        .from('request-photos')
                        .download(fileName);

                    if (!downloadError && fileData) {
                        var newFileName = 'approved_' + Date.now() + '_' + fileName;
                        var { error: uploadError } = await supabase.storage
                            .from('member-photos')
                            .upload(newFileName, fileData);

                        if (!uploadError) {
                            var { data: urlData } = supabase.storage
                                .from('member-photos')
                                .getPublicUrl(newFileName);
                            memberPhotoUrl = urlData.publicUrl;
                        }
                    }
                }
            } catch (photoError) {
                console.warn('Fotograf kopyalama hatasi, orijinal URL kullanilacak:', photoError);
            }
        }

        // 3. Members tablosuna ekle
        var memberData = {
            name: request.name,
            profession: request.profession,
            sector: request.sector,
            company: request.company,
            phone: request.phone,
            email: request.email,
            city: request.city,
            ilce: request.ilce,
            keywords: request.keywords,
            photo_url: memberPhotoUrl
        };

        var { error: insertError } = await supabase
            .from('members')
            .insert([memberData]);

        if (insertError) throw insertError;

        // 4. Talep durumunu guncelle
        var { error: updateError } = await supabase
            .from('member_requests')
            .update({
                status: 'approved',
                reviewed_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) throw updateError;

        showToast('Basvuru onaylandi! Uye listesine eklendi.');
        await loadRequests();
        await loadMembers();
        await loadDashboard();

    } catch (error) {
        console.error('Onaylama hatasi:', error);
        showToast('Hata: ' + error.message, 'error');
    }
}

// Talep reddet
async function rejectRequest(id) {
    var reason = prompt('Red nedeni (opsiyonel):');
    if (reason === null) return;

    try {
        var updateData = {
            status: 'rejected',
            reviewed_at: new Date().toISOString()
        };

        if (reason && reason.trim()) {
            updateData.admin_note = reason.trim();
        }

        var { error } = await supabase
            .from('member_requests')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;

        showToast('Basvuru reddedildi.');
        await loadRequests();
        await loadDashboard();

    } catch (error) {
        console.error('Reddetme hatasi:', error);
        showToast('Hata: ' + error.message, 'error');
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
window.filterRequests = filterRequests;
window.editRequest = editRequest;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
window.closeRequestEditModal = closeRequestEditModal;
window.previewEditReqPhoto = previewEditReqPhoto;
