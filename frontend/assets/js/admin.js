// ======== SHARED ADMIN UTILITIES ========

function paginationHTML(total, current, fn) {
    if (total <= 1) return '';
    let html = '<div class="pagination-inner">';
    html += '<button class="page-btn" onclick="' + fn + '(' + (current - 1) + ')" ' + (current <= 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';
    for (let i = 1; i <= total; i++) {
        html += '<button class="page-btn ' + (i === current ? 'active' : '') + '" onclick="' + fn + '(' + i + ')">' + i + '</button>';
    }
    html += '<button class="page-btn" onclick="' + fn + '(' + (current + 1) + ')" ' + (current >= total ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';
    html += '</div>';
    return html;
}

function downloadCSV(headers, rows, filename) {
    let csv = headers.join(',') + '\n' + rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    URL.revokeObjectURL(a.href);
}

function backupData() {
    const keys = ['transparentdb_products','transparentdb_services','transparentdb_contacts','transparentdb_orders','transparentdb_hero','transparentdb_features','transparentdb_testimonials','transparentdb_gallery','transparentdb_settings','transparentdb_activity'];
    const data = {};
    keys.forEach(k => { const v = localStorage.getItem(k); if (v) data[k] = JSON.parse(v); });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ansh-backup-' + new Date().toISOString().slice(0,10) + '.json'; a.click();
    URL.revokeObjectURL(a.href);
    if (typeof showSuccess === 'function') showSuccess();
}

function restoreData() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                Object.keys(data).forEach(k => localStorage.setItem(k, JSON.stringify(data[k])));
                alert('Data restored successfully! Refreshing page...');
                location.reload();
            } catch(err) { alert('Invalid backup file: ' + err.message); }
        };
        reader.readAsText(file);
    };
    input.click();
}

function logActivity(msg) {
    const logs = JSON.parse(localStorage.getItem('transparentdb_activity') || '[]');
    logs.unshift({msg, time: new Date().toISOString()});
    if (logs.length > 100) logs.length = 100;
    localStorage.setItem('transparentdb_activity', JSON.stringify(logs));
}

function updateBadge() {
    try {
        const contacts = JSON.parse(localStorage.getItem('transparentdb_contacts')) || [];
        const unread = contacts.filter(c => !c.read).length;
        const badge = document.getElementById('msgBadge');
        if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'inline' : 'none'; }
    } catch(e) {}
}

function logout() {
    localStorage.removeItem('admin_logged_in');
    window.location.href = 'index.html';
}

// ======== TOAST NOTIFICATIONS ========
function showToast(message, type) {
    type = type || 'success';
    const existing = document.querySelector('.admin-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'admin-toast admin-toast-' + type;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    toast.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '"></i><span>' + message + '</span>';
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ======== CUSTOM CONFIRM DIALOG ========
function confirmAction(message, callback) {
    const existing = document.querySelector('.admin-confirm-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.className = 'admin-confirm-overlay';
    overlay.innerHTML = '<div class="admin-confirm-box"><div class="admin-confirm-icon"><i class="fas fa-exclamation-triangle"></i></div><p>' + message + '</p><div class="admin-confirm-btns"><button class="btn-sm cancel" id="confirmCancel">Cancel</button><button class="btn-sm delete" id="confirmOk">Delete</button></div></div>';
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 10);
    document.getElementById('confirmCancel').onclick = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 300); };
    document.getElementById('confirmOk').onclick = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 300); callback(); };
    overlay.onclick = (e) => { if (e.target === overlay) { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 300); } };
}

// ======== MODAL HELPERS ========
function closeModalFn(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function initModalOverlay(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.addEventListener('click', function(e) {
        if (e.target === this) this.style.display = 'none';
    });
}

// ======== IMAGE PREVIEW ========
function previewImage(input, previewId) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.getElementById(previewId);
        img.src = e.target.result;
        img.style.display = 'block';
        const hidden = input.nextElementSibling;
        if (hidden && hidden.tagName === 'INPUT' && hidden.type === 'hidden') hidden.value = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ======== BULK SELECTION HELPERS ========
function toggleSelectAll(source, items) {
    items.forEach(cb => cb.checked = source.checked);
    updateBulkBar();
}

function updateBulkBar() {
    const checkboxes = document.querySelectorAll('.select-item:checked');
    const bar = document.getElementById('bulkBar');
    if (!bar) return;
    const count = checkboxes.length;
    bar.style.display = count > 0 ? 'flex' : 'none';
    bar.querySelector('.bulk-count').textContent = count + ' selected';
}

function getSelectedIds(prefix) {
    return Array.from(document.querySelectorAll('.select-item:checked')).map(cb => parseInt(cb.value));
}
