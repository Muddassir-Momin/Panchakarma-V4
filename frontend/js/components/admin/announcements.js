/* ================================================
   ADMIN — Announcements, Broadcast
   ================================================ */

}
const LOW_STOCK_THRESHOLD = 5;

function checkAndNotifyLowStock(product) {
  if (!product) return;
  if (product.stock <= LOW_STOCK_THRESHOLD && product.stock >= 0) {
    // Only notify once per day per product (check if already notified today)
    const todayKey = `low_stock_${product.id}_${getDateStr(0)}`;
    if (sessionStorage.getItem(todayKey)) return;
    sessionStorage.setItem(todayKey, '1');

    const doctorId = product.doctorId;
    const label = product.stock === 0 ? '❌ Out of Stock' : `⚠️ Only ${product.stock} left`;
    DB.notifications.push({
      id: genId('n'), userId: doctorId, type: 'system',
      priority: product.stock === 0 ? 'critical' : 'high', read: false,
      title: `${label} — ${product.name}`,
      message: `Your product "${product.name}" ${product.stock === 0 ? 'is now out of stock' : `has only ${product.stock} unit(s) remaining`}. Please restock soon to avoid missed orders.`,
      createdAt: new Date().toISOString(),
    });
    // If current user is a doctor, rebuild nav badge
    buildNav();
  }
}

function saveProduct(id) {
  const p = getProduct(id);
  if (!p) return;
  const prevStock = p.stock;
  p.name        = document.getElementById('ep-name').value  || p.name;
  p.price       = parseInt(document.getElementById('ep-price').value) || p.price;
  p.mrp         = parseInt(document.getElementById('ep-mrp').value)   || p.mrp;
  p.stock       = parseInt(document.getElementById('ep-stock').value) ?? p.stock;
  p.description = document.getElementById('ep-desc').value  || p.description;

  // Notify doctor if stock dropped to low threshold
  checkAndNotifyLowStock(p);

  closeMod();
  showToast(`${p.name} updated! Stock: ${p.stock} units`, 'success');
  showPage('doctor-shop');
}
function deleteProduct(id) {
  const p = getProduct(id);
  openModal(`<div class="modal-header"><div class="modal-title">Delete Product</div><button class="modal-close" onclick="closeMod()">✕</button></div><p style="color:var(--text-med);margin-bottom:20px">Delete <strong>${p?.name}</strong> from the shop?</p><div class="modal-footer"><button class="btn btn-outline" onclick="closeMod()">Cancel</button><button class="btn btn-danger" onclick="doDeleteProduct('${id}')">Delete</button></div>`);
}
function doDeleteProduct(id) {
  const idx = DB.products.findIndex(p => p.id === id);
  if (idx >= 0) DB.products.splice(idx, 1);
  closeMod(); showToast('Product removed', 'warning'); showPage('doctor-shop');
}
function markOrderCollected(orderId) {
  const o = DB.orders.find(o => o.id === orderId);
  if (o) {
    o.status = 'delivered';
    DB.notifications.push({ id: genId('n'), userId: o.patientId, type: 'system', title: '✅ Pickup Completed!', message: `Your herbal remedies have been collected successfully. Thank you! If you have any questions, contact your doctor.`, priority: 'normal', read: false, createdAt: new Date().toISOString() });
    showToast('Order marked as collected. Patient notified!', 'success');
    showPage('doctor-shop');
  }
}
function notifyPatientPickup(orderId) {
  const o = DB.orders.find(o => o.id === orderId);
  if (!o) return;
  DB.notifications.push({ id: genId('n'), userId: o.patientId, type: 'system', title: '📦 Your Order is Ready for Pickup!', message: `Your herbal remedy order (${o.items.length} items) is ready at the clinic pharmacy. Pickup code: ${o.pickupCode}. Please collect at your convenience.`, priority: 'high', read: false, createdAt: new Date().toISOString() });
  showToast('Patient notified for pickup!', 'success');
}

// ═══════════════════════════════════════════════════════════
// ADMIN — SHOP MANAGEMENT
// ═══════════════════════════════════════════════════════════
function renderAdminShop(el) {
  const totalRev = DB.orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+o.total,0);
  const pendingPickups = DB.orders.filter(o=>o.mode==='pickup'&&o.status==='ready');
  const filterStatus = window._adminShopFilter || 'all';
  const orders = filterStatus === 'all' ? DB.orders : DB.orders.filter(o => o.status === filterStatus || o.mode === filterStatus);

  el.innerHTML = `
    <div class="page-header"><h2>🏪 Shop Administration</h2><p>Manage all herbal products and orders system-wide</p></div>
    <div class="stats-grid">
      <div class="stat-card"><span class="stat-icon">🌿</span><div class="stat-label">Total Products</div><div class="stat-value">${DB.products.length}</div></div>
      <div class="stat-card"><span class="stat-icon">📦</span><div class="stat-label">All Orders</div><div class="stat-value">${DB.orders.length}</div></div>
      <div class="stat-card"><span class="stat-icon">🏪</span><div class="stat-label">Pickup Pending</div><div class="stat-value">${pendingPickups.length}</div></div>
      <div class="stat-card"><span class="stat-icon">💰</span><div class="stat-label">Shop Revenue</div><div class="stat-value">₹${(totalRev/1000).toFixed(1)}K</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
      <div class="card">
        <div class="card-header"><span class="card-title">All Products</span><button class="btn btn-sm btn-green" onclick="openAdminAddProductModal()">+ Add</button></div>
        <div style="max-height:360px;overflow-y:auto">
          ${DB.products.map(p => {
            const dr = getUser(p.doctorId);
            return `<div class="product-mgmt-row">
              <div class="product-mgmt-icon">${p.emoji}</div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:0.88rem">${p.name}</div>
                <div style="font-size:0.75rem;color:var(--text-light)">${dr?.name||'—'} · ₹${p.price} · ${p.stock} left</div>
              </div>
              <div style="display:flex;gap:4px">
                <button class="btn btn-sm btn-outline" onclick="editProduct('${p.id}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')">✕</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">⚡ Pending Pickups</span><span class="badge badge-orange">${pendingPickups.length}</span></div>
        ${pendingPickups.length ? pendingPickups.map(o => {
          const pt=getUser(o.patientId);
          return `<div style="padding:12px;background:var(--bg);border-radius:var(--radius-md);margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <strong>${pt?.name}</strong><span style="font-size:0.82rem;font-weight:700;color:var(--primary)">${o.pickupCode}</span>
            </div>
            <div style="font-size:0.78rem;color:var(--text-light)">${o.items.length} items · ₹${o.total}${o.pickupDate?` · ${formatDate(o.pickupDate)}`:''}</div>
            <div class="order-items-list" style="margin-top:6px">${o.items.map(i=>{const p=getProduct(i.productId);return`<span class="order-item-chip" style="font-size:0.72rem">${p?.emoji} ${p?.name} ×${i.qty}</span>`;}).join('')}</div>
            <button class="btn btn-sm btn-green" style="margin-top:8px" onclick="markOrderCollected('${o.id}');showPage('admin-shop')">✓ Mark Collected</button>
          </div>`;
        }).join('') : '<div class="empty-state" style="padding:20px"><p>No pending pickups</p></div>'}
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">All Orders</span>
        <div class="section-tabs" style="margin-bottom:0">
          ${[['all','All'],['processing','Processing'],['ready','Pickup Ready'],['delivered','Delivered'],['online','Online'],['pickup','Pickup']].map(([v,l])=>
            `<button class="section-tab ${filterStatus===v?'active':''}" onclick="window._adminShopFilter='${v}';showPage('admin-shop')">${l}</button>`
          ).join('')}
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Order ID</th><th>Patient</th><th>Items</th><th>Total</th><th>Mode</th><th>Pickup Code</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${orders.sort((a,b)=>b.placedAt.localeCompare(a.placedAt)).map(o=>{
              const pt=getUser(o.patientId);
              const statusBadge={processing:'badge-blue',ready:'badge-orange',shipped:'badge-info',delivered:'badge-green',cancelled:'badge-red'};
              return `<tr>
                <td><strong>#${o.id.replace('ord','').toUpperCase()}</strong><br><small style="color:var(--text-light)">${formatDate(o.placedAt)}</small></td>
                <td>${pt?.name||'—'}</td>
                <td>${o.items.map(i=>{const p=getProduct(i.productId);return`${p?.emoji||'📦'}×${i.qty}`;}).join(' ')}</td>
