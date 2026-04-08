/* ================================================
   DOCTOR — Shop: Products + Read-Only Order History (no Collected button)
   ================================================ */

        <span>Total Payable</span><span style="color:var(--primary)">₹${total.toLocaleString()}</span>
      </div>
    </div>
    ${mode === 'online' ? `
      <div class="form-grid">
        <div class="form-row full required"><label>Delivery Address</label><textarea id="ck-addr" rows="2" placeholder="Full delivery address...">${currentUser.address||''}</textarea></div>
        <div class="form-row required"><label>Card Number</label><input type="text" id="ck-card" placeholder="4242 4242 4242 4242" maxlength="19"></div>
        <div class="form-row required"><label>Expiry</label><input type="text" id="ck-exp" placeholder="MM/YY" maxlength="5"></div>
        <div class="form-row required"><label>CVV</label><input type="text" id="ck-cvv" placeholder="123" maxlength="3"></div>
        <div class="form-row"><label>Card Holder Name</label><input type="text" id="ck-name" placeholder="${currentUser.name}" value="${currentUser.name}"></div>
      </div>
      <div style="display:flex;gap:8px;margin:8px 0 16px;flex-wrap:wrap">
        ${['💳 Visa/MC','📱 UPI','🏦 Net Banking','💰 Wallets'].map(m=>`<button class="btn btn-outline btn-sm">${m}</button>`).join('')}
      </div>` : `
      <div class="pickup-code-box" style="margin-bottom:20px">
        <div style="font-size:0.82rem;color:var(--text-light);margin-bottom:8px">Your Pickup Code will be generated on order:</div>
        <div class="pickup-code">PKP-????</div>
        <div class="pickup-code-label">Show this code at the pharmacy counter</div>
      </div>
      <div class="pickup-steps">
        <div class="pickup-step"><span class="pickup-step-icon">📲</span><div class="pickup-step-text">Order Placed</div></div>
        <div class="pickup-step"><span class="pickup-step-icon">⚗️</span><div class="pickup-step-text">Prepared</div></div>
        <div class="pickup-step"><span class="pickup-step-icon">📍</span><div class="pickup-step-text">Visit Clinic</div></div>
        <div class="pickup-step"><span class="pickup-step-icon">✅</span><div class="pickup-step-text">Collect</div></div>
      </div>
      <div style="background:#e8f5e9;border-radius:var(--radius-md);padding:12px;margin-top:16px;font-size:0.85rem;color:var(--primary)">
        <strong>💡 How Pickup Works:</strong> After placing the order, the clinic pharmacist is notified and prepares your remedies. Visit the pharmacy counter, show your pickup code, and collect everything ready — no waiting!
      </div>
      <div class="form-row" style="margin-top:16px"><label>Preferred Pickup Date</label><input type="date" id="ck-pickup-date" value="${getDateStr(1)}" min="${getDateStr(0)}"></div>
      <div class="form-row"><label>Preferred Pickup Time</label><select id="ck-pickup-time"><option>09:00 AM – 10:00 AM</option><option>10:00 AM – 11:00 AM</option><option>11:00 AM – 12:00 PM</option><option>02:00 PM – 03:00 PM</option><option>03:00 PM – 04:00 PM</option><option>04:00 PM – 05:00 PM</option></select></div>`}
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeMod();openCartModal()">← Back to Cart</button>
      <button class="btn btn-green" style="padding:12px 28px" onclick="placeOrder('${mode}')">${mode==='online'?'Pay Now ₹'+total.toLocaleString():'Confirm Pickup Order'}</button>
    </div>`);
}

function placeOrder(mode) {
  const cartItems = getCartItems();
  if (!cartItems.length) return;
  if (mode === 'online') {
    const card = document.getElementById('ck-card')?.value;
    const addr = document.getElementById('ck-addr')?.value;
    if (!addr) { showToast('Please enter delivery address', 'error'); return; }
    if (!card || card.replace(/\s/g,'').length < 12) { showToast('Please enter valid card details', 'error'); return; }
  }
  const subtotal = getCartTotal();
  const total = mode === 'online' ? subtotal + 80 : subtotal;
  const pickupCode = mode === 'pickup' ? 'PKP-' + Math.floor(1000 + Math.random()*9000) : null;
  const pickupDate = mode === 'pickup' ? document.getElementById('ck-pickup-date')?.value : null;
  const pickupTime = mode === 'pickup' ? document.getElementById('ck-pickup-time')?.value : null;

  const order = {
    id: genId('ord'),
    patientId: currentUser.id,
    items: cartItems.map(c => ({ productId: c.productId, qty: c.qty })),
    mode, status: mode === 'online' ? 'processing' : 'ready',
    total,
    address: mode === 'online' ? document.getElementById('ck-addr')?.value : null,
    placedAt: getDateStr(0),
    pickupCode,
    pickupDate,
    pickupTime,
    estimatedDelivery: mode === 'online' ? getDateStr(3) : null
  };
  DB.orders.push(order);

  // Reduce stock
  cartItems.forEach(c => {
    const p = getProduct(c.productId);
    if (p) {
      p.stock = Math.max(0, p.stock - c.qty);
      checkAndNotifyLowStock(p); // notify doctor if stock now low
    }
  });
  // Clear cart
  DB.cart = DB.cart.filter(c => c.userId !== currentUser.id);
  // Notification to patient
  DB.notifications.push({ id: genId('n'), userId: currentUser.id, type: 'system', title: mode==='online' ? '✅ Order Placed! Delivery in 2-3 days' : `✅ Pickup Order Ready! Code: ${pickupCode}`, message: mode==='online' ? `Your order of ${cartItems.length} item(s) worth ₹${total} is confirmed. Estimated delivery: ${formatDate(getDateStr(3))}` : `Your order is ready for pickup! Visit the clinic pharmacy with code <strong>${pickupCode}</strong> on ${formatDate(pickupDate)} during ${pickupTime}.`, priority: 'high', read: false, createdAt: new Date().toISOString() });
  buildNav();
  closeMod();

  if (mode === 'pickup') {
    openModal(`
      <div class="modal-header"><div class="modal-title">🎉 Pickup Order Confirmed!</div><button class="modal-close" onclick="closeMod()">✕</button></div>
      <div class="pickup-code-box">
        <div class="pickup-code">${pickupCode}</div>
        <div class="pickup-code-label">Your Pickup Code — Show at pharmacy counter</div>
      </div>
      <div style="text-align:center;margin:16px 0">
        <div style="font-size:0.9rem;color:var(--text-med)">📅 Pickup Date: <strong>${formatDate(pickupDate)}</strong></div>
        <div style="font-size:0.9rem;color:var(--text-med);margin-top:4px">⏰ Time: <strong>${pickupTime}</strong></div>
      </div>
      <div class="pickup-steps">
        <div class="pickup-step"><span class="pickup-step-icon">✅</span><div class="pickup-step-text">Ordered</div></div>
        <div class="pickup-step"><span class="pickup-step-icon">⚗️</span><div class="pickup-step-text">Preparing</div></div>
        <div class="pickup-step"><span class="pickup-step-icon">📍</span><div class="pickup-step-text">Visit Clinic</div></div>
        <div class="pickup-step"><span class="pickup-step-icon">🎁</span><div class="pickup-step-text">Collect</div></div>
      </div>
      <div style="background:#e8f5e9;border-radius:var(--radius-md);padding:14px;margin-top:16px;font-size:0.85rem;color:var(--primary-mid)">
        <strong>What happens next:</strong> Our pharmacist has been notified and will prepare all your Ayurvedic remedies before your pickup time. Everything will be packed & labelled. Just walk in and collect!
      </div>
      <div class="modal-footer"><button class="btn btn-green" onclick="closeMod();showPage('patient-orders')">View My Orders</button></div>`);
  } else {
    showToast('Order placed! Delivery in 2-3 days 🎉', 'success');
    showPage('patient-orders');
  }
}

// ═══════════════════════════════════════════════════════════
// PATIENT — MY ORDERS
// ═══════════════════════════════════════════════════════════
function renderPatientOrders(el) {
  const myOrders = DB.orders.filter(o => o.patientId === currentUser.id).sort((a,b) => b.placedAt.localeCompare(a.placedAt));
  const statusConfig = {
    processing: { label:'Processing', badge:'badge-blue', icon:'⏳' },
    ready: { label:'Ready for Pickup', badge:'badge-orange', icon:'📦' },
    shipped: { label:'Shipped', badge:'badge-info', icon:'🚚' },
    delivered: { label:'Delivered', badge:'badge-green', icon:'✅' },
    cancelled: { label:'Cancelled', badge:'badge-red', icon:'❌' }
  };

  el.innerHTML = `
    <div class="page-header">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><h2>📦 My Orders</h2><p>Track your herbal remedy orders</p></div>
        <button class="btn btn-green" onclick="showPage('patient-shop')">🛒 Continue Shopping</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><span class="stat-icon">📦</span><div class="stat-label">Total Orders</div><div class="stat-value">${myOrders.length}</div></div>
      <div class="stat-card"><span class="stat-icon">✅</span><div class="stat-label">Delivered</div><div class="stat-value">${myOrders.filter(o=>o.status==='delivered').length}</div></div>
      <div class="stat-card"><span class="stat-icon">⏳</span><div class="stat-label">In Progress</div><div class="stat-value">${myOrders.filter(o=>['processing','ready','shipped'].includes(o.status)).length}</div></div>
      <div class="stat-card"><span class="stat-icon">💰</span><div class="stat-label">Total Spent</div><div class="stat-value">₹${myOrders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+o.total,0).toLocaleString()}</div></div>
    </div>
    ${myOrders.length ? myOrders.map(o => {
      const cfg = statusConfig[o.status] || { label: o.status, badge:'badge-gray', icon:'📦' };
      return `<div class="order-card ${o.mode} ${o.status}">
        <div class="order-header">
          <div>
            <div class="order-id">Order #${o.id.replace('ord','').toUpperCase()}</div>
            <div class="order-date">Placed: ${formatDate(o.placedAt)}</div>
          </div>
          <div style="text-align:right">
            <span class="badge ${cfg.badge}">${cfg.icon} ${cfg.label}</span>
            <div style="font-family:var(--font-serif);font-size:1.2rem;font-weight:700;color:var(--primary);margin-top:4px">₹${o.total.toLocaleString()}</div>
          </div>
        </div>
        <div class="order-items-list">
          ${o.items.map(i => { const p=getProduct(i.productId); return `<span class="order-item-chip">${p?.emoji||'📦'} ${p?.name||'?'} ×${i.qty}</span>`; }).join('')}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <span class="order-mode-badge ${o.mode}">${o.mode==='online'?'💳 Online Delivery':'🏪 Clinic Pickup'}</span>
          ${o.mode==='online'&&o.estimatedDelivery&&o.status!=='delivered'?`<span style="font-size:0.82rem;color:var(--text-med)">📅 Est. delivery: ${formatDate(o.estimatedDelivery)}</span>`:''}
          ${o.mode==='online'&&o.status==='delivered'?`<span style="font-size:0.82rem;color:var(--success)">✅ Delivered</span>`:''}
          ${o.mode==='pickup'&&o.status==='delivered'?`<span style="font-size:0.82rem;color:var(--success)">✅ Collected</span>`:''}
        </div>
        ${o.pickupCode ? `
        <div class="pickup-code-box" style="margin-top:12px">
          <div class="pickup-code">${o.pickupCode}</div>
          <div class="pickup-code-label">Pickup Code${o.pickupDate?` · Visit: ${formatDate(o.pickupDate)}, ${o.pickupTime||''}`:''}</div>
        </div>` : ''}
      </div>`;
    }).join('') : '<div class="empty-state"><span class="empty-state-icon">📦</span><p>No orders yet. Visit the Herbal Shop!</p><button class="btn btn-green" onclick="showPage(\'patient-shop\')" style="margin-top:12px">🛒 Shop Now</button></div>'}`;
}

// ═══════════════════════════════════════════════════════════
// DOCTOR — SHOP MANAGEMENT
// ═══════════════════════════════════════════════════════════
function renderDoctorShop(el) {
  const myProducts = DB.products.filter(p => p.doctorId === currentUser.id);
  const allOrders  = DB.orders.filter(o => o.items.some(i => { const p=getProduct(i.productId); return p && p.doctorId===currentUser.id; }));
  const revenue    = allOrders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+o.total,0);
  const statusBadge= {processing:'badge-blue',ready:'badge-orange',delivered:'badge-green',cancelled:'badge-red',shipped:'badge-info'};
  const statusLabel= {processing:'⏳ Processing',ready:'📦 Ready Pickup',delivered:'✅ Delivered',cancelled:'❌ Cancelled',shipped:'🚚 Shipped'};

  el.innerHTML = `
    <div class="page-header"><h2>🏪 Herbal Shop Management</h2><p>Manage your product listings and view order history</p></div>
    <div class="stats-grid">
      <div class="stat-card"><span class="stat-icon">🌿</span><div class="stat-label">My Products</div><div class="stat-value">${myProducts.length}</div></div>
      <div class="stat-card"><span class="stat-icon">📦</span><div class="stat-label">Total Orders</div><div class="stat-value">${allOrders.length}</div></div>
      <div class="stat-card"><span class="stat-icon">✅</span><div class="stat-label">Delivered</div><div class="stat-value">${allOrders.filter(o=>o.status==='delivered').length}</div></div>
      <div class="stat-card"><span class="stat-icon">💰</span><div class="stat-label">Revenue</div><div class="stat-value">₹${(revenue/1000).toFixed(1)}K</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
      <div class="card">
        <div class="card-header"><span class="card-title">My Products</span><button class="btn btn-sm btn-green" onclick="openAddProductModal()">+ Add Product</button></div>
        ${myProducts.length ? myProducts.map(p => `
          <div class="product-mgmt-row">
