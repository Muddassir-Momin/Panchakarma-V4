/* ================================================
   ADMIN — Shop + Inventory + Mark Collected (admin only)
   ================================================ */

            <div class="product-mgmt-icon">${p.emoji}</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:0.9rem">${p.name}</div>
              <div style="font-size:0.78rem;color:var(--text-light)">${p.category} · ${p.unit} · ₹${p.price}</div>
              <div style="font-size:0.75rem;margin-top:2px">${p.stock>10?`<span style="color:var(--success)">✅ ${p.stock} in stock</span>`:p.stock>0?`<span style="color:var(--warning)">⚠️ ${p.stock} left</span>`:'<span style="color:var(--danger)">❌ Out of stock</span>'}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">
              <button class="btn btn-sm btn-outline" onclick="editProduct('${p.id}')">Edit</button>
              <button class="btn btn-sm btn-danger"  onclick="deleteProduct('${p.id}')">Del</button>
            </div>
          </div>`).join('') : '<div class="empty-state"><span class="empty-state-icon">🌿</span><p>No products listed yet</p></div>'}
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">💰 Revenue Summary</span></div>
        <div style="padding:8px 0">
          ${['processing','ready','shipped','delivered','cancelled'].map(s=>{
            const cnt=allOrders.filter(o=>o.status===s).length;
            const rev=allOrders.filter(o=>o.status===s).reduce((sum,o)=>sum+o.total,0);
            return cnt>0?`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span><span class="badge ${statusBadge[s]||'badge-gray'}" style="font-size:0.72rem">${statusLabel[s]||s}</span></span><span style="font-weight:600">₹${rev.toLocaleString()} (${cnt})</span></div>`:'';
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Order History — read-only for doctor -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">📋 Order History — My Products</span>
        <span class="badge badge-blue">${allOrders.length} orders</span>
      </div>
      <p style="font-size:0.8rem;color:var(--text-light);margin-bottom:12px">
        ℹ️ Pickup collection is handled by Admin. You can view order history below.
      </p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Patient</th><th>Items</th><th>Amount</th><th>Mode</th><th>Status</th></tr></thead>
          <tbody>
            ${allOrders.length ? allOrders.sort((a,b)=>b.placedAt.localeCompare(a.placedAt)).map(o=>{
              const pt=getUser(o.patientId);
              return `<tr>
                <td style="font-size:0.82rem">${formatDate(o.placedAt)}</td>
                <td><strong>${pt?.name||'—'}</strong><div style="font-size:0.72rem;color:var(--text-light)">${pt?.patientCode||'—'}</div></td>
                <td style="font-size:0.8rem">${o.items.map(i=>{const p=getProduct(i.productId);return p?`${p.emoji} ${p.name} ×${i.qty}`:''}).join(', ')}</td>
                <td><strong>₹${o.total}</strong></td>
                <td><span class="order-mode-badge ${o.mode}" style="font-size:0.72rem">${o.mode==='online'?'💳 Online':'🏪 Pickup'}</span></td>
                <td><span class="badge ${statusBadge[o.status]||'badge-gray'}" style="font-size:0.72rem">${statusLabel[o.status]||o.status}</span></td>
              </tr>`;
            }).join('') : '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-light)">No orders yet for your products</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;
}

function openAddProductModal() {
  openModal(`
    <div class="modal-header"><div class="modal-title">Add Herbal Product</div><button class="modal-close" onclick="closeMod()">✕</button></div>
    <div class="form-grid">
      <div class="form-row required full"><label>Product Name</label><input type="text" id="np-name" placeholder="e.g. Triphala Churna"></div>
      <div class="form-row required"><label>Category</label><select id="np-cat"><option>Churna</option><option>Capsules</option><option>Oil</option><option>Ghrita</option><option>Tablet</option><option>Kwatha</option><option>Rasayana</option><option>Powder</option><option>Syrup</option></select></div>
      <div class="form-row required"><label>Unit / Pack Size</label><input type="text" id="np-unit" placeholder="e.g. 100g or 60 caps"></div>
      <div class="form-row required"><label>Selling Price (₹)</label><input type="number" id="np-price" placeholder="299"></div>
      <div class="form-row"><label>MRP (₹)</label><input type="number" id="np-mrp" placeholder="350"></div>
      <div class="form-row"><label>Stock Quantity</label><input type="number" id="np-stock" placeholder="20"></div>
      <div class="form-row full"><label>Description</label><textarea id="np-desc" placeholder="Brief description of the product and its benefits..."></textarea></div>
      <div class="form-row full"><label>Tags (comma separated)</label><input type="text" id="np-tags" placeholder="Digestive, Detox, Vata"></div>
      <div class="form-row"><label>Emoji Icon</label><input type="text" id="np-emoji" placeholder="🌿" maxlength="2" value="🌿"></div>
      <div class="form-row" style="display:flex;align-items:center;gap:10px">
        <label><input type="checkbox" id="np-rec"> Mark as Recommended</label>
      </div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeMod()">Cancel</button><button class="btn btn-green" onclick="addProduct()">Add Product</button></div>`);
}
function addProduct() {
  const name = document.getElementById('np-name').value;
  const price = parseInt(document.getElementById('np-price').value);
  if (!name || !price) { showToast('Name and price required', 'error'); return; }
  DB.products.push({
    id: genId('p'), name, category: document.getElementById('np-cat').value,
    price, mrp: parseInt(document.getElementById('np-mrp').value) || price,
    stock: parseInt(document.getElementById('np-stock').value) || 10,
    unit: document.getElementById('np-unit').value || '—',
    emoji: document.getElementById('np-emoji').value || '🌿',
    description: document.getElementById('np-desc').value || '',
    tags: (document.getElementById('np-tags').value || '').split(',').map(t=>t.trim()).filter(Boolean),
    doctorId: currentUser.id, recommended: document.getElementById('np-rec').checked, isNew: true, dosha: []
  });
  closeMod(); showToast('Product added to shop!', 'success'); showPage('doctor-shop');
}
function editProduct(id) {
  const p = getProduct(id);
  if (!p) return;
  openModal(`
    <div class="modal-header"><div class="modal-title">Edit: ${p.name}</div><button class="modal-close" onclick="closeMod()">✕</button></div>
    <div class="form-grid">
      <div class="form-row full"><label>Name</label><input type="text" id="ep-name" value="${p.name}"></div>
      <div class="form-row"><label>Price (₹)</label><input type="number" id="ep-price" value="${p.price}"></div>
      <div class="form-row"><label>MRP (₹)</label><input type="number" id="ep-mrp" value="${p.mrp}"></div>
      <div class="form-row"><label>Stock</label><input type="number" id="ep-stock" value="${p.stock}"></div>
      <div class="form-row full"><label>Description</label><textarea id="ep-desc">${p.description}</textarea></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeMod()">Cancel</button><button class="btn btn-green" onclick="saveProduct('${id}')">Save</button></div>`);
