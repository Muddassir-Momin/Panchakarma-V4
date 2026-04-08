/* ================================================
   PATIENT — My Orders
   ================================================ */

}
function setShopCat(cat) { shopCategoryFilter = cat; showPage('patient-shop'); }
function shopSearch(q) { shopSearchQuery = q; const pg=document.getElementById('product-grid'); if(pg) pg.innerHTML = DB.products.filter(p=>{const catOk=shopCategoryFilter==='All'||p.category===shopCategoryFilter;const sOk=!q||p.name.toLowerCase().includes(q.toLowerCase())||p.tags.some(t=>t.toLowerCase().includes(q.toLowerCase()));return catOk&&sOk;}).map(p=>productCardHTML(p)).join('') || '<div class="empty-state"><span class="empty-state-icon">🔍</span><p>No products found</p></div>'; }

function openCartModal() {
  const cartItems = getCartItems();
  if (!cartItems.length) { showToast('Your cart is empty', 'warning'); return; }
  const subtotal = getCartTotal();
  const shipping = 80;
  const total = subtotal + shipping;

  openModal(`
    <div class="modal-header"><div class="modal-title">🛒 Your Cart</div><button class="modal-close" onclick="closeMod()">✕</button></div>
    <div id="cart-items-list">
      ${cartItems.map(c => {
        const p = getProduct(c.productId);
        return `<div class="cart-item">
          <div class="cart-item-img">${p?.emoji||'📦'}</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${p?.name}</div>
            <div class="cart-item-meta">${p?.unit} · ₹${p?.price} each</div>
          </div>
          <div class="qty-ctrl">
            <button class="qty-btn" onclick="updateCartQty('${c.productId}',-1)">−</button>
            <span class="qty-val">${c.qty}</span>
            <button class="qty-btn" onclick="updateCartQty('${c.productId}',1)">+</button>
          </div>
          <div style="min-width:70px;text-align:right">
            <div style="font-weight:700;color:var(--primary)">₹${(p?.price||0)*c.qty}</div>
            <button onclick="removeFromCart('${c.productId}');openCartModal()" style="font-size:0.72rem;color:var(--danger);background:none;border:none;cursor:pointer;margin-top:2px">Remove</button>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div style="padding:16px;background:var(--bg);border-radius:var(--radius-md);margin-top:12px">
      <div style="display:flex;justify-content:space-between;font-size:0.88rem;margin-bottom:6px"><span style="color:var(--text-med)">Subtotal</span><span>₹${subtotal.toLocaleString()}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:0.88rem;margin-bottom:10px"><span style="color:var(--text-med)">Delivery</span><span>₹${shipping} <span style="font-size:0.72rem;color:var(--success)">(Free for Pickup)</span></span></div>
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:1rem"><span>Total</span><span style="color:var(--primary)">₹${total.toLocaleString()}</span></div>
    </div>
    <div class="modal-footer" style="flex-direction:column;gap:10px">
      <button class="btn btn-green" style="width:100%;padding:13px;font-size:1rem" onclick="closeMod();openCheckoutModal('online')">💳 Pay Online — ₹${total.toLocaleString()}</button>
      <button class="btn btn-accent" style="width:100%;padding:13px;font-size:1rem" onclick="closeMod();openCheckoutModal('pickup')">🏪 Schedule Pickup — ₹${subtotal.toLocaleString()} (Free Pickup)</button>
      <div style="text-align:center;font-size:0.78rem;color:var(--text-light)">Pickup: Collect from clinic counter. Show your pickup code.</div>
    </div>`);
}

function openCheckoutModal(mode) {
  const cartItems = getCartItems();
  const subtotal = getCartTotal();
  const total = mode === 'online' ? subtotal + 80 : subtotal;

  openModal(`
    <div class="modal-header"><div class="modal-title">${mode==='online'?'💳 Online Payment':'🏪 Schedule Pickup'}</div><button class="modal-close" onclick="closeMod()">✕</button></div>
    <div style="background:var(--bg);border-radius:var(--radius-md);padding:14px;margin-bottom:20px">
      <div style="font-size:0.85rem;color:var(--text-med);margin-bottom:8px">Order Summary (${cartItems.length} items)</div>
      ${cartItems.map(c=>{const p=getProduct(c.productId);return`<div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px"><span>${p?.emoji} ${p?.name} ×${c.qty}</span><span>₹${(p?.price||0)*c.qty}</span></div>`;}).join('')}
      <div style="border-top:1px solid var(--border);margin-top:8px;padding-top:8px;font-weight:700;display:flex;justify-content:space-between">
