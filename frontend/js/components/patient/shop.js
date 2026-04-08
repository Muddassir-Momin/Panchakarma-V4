/* ================================================
   PATIENT — Herbal Shop + Prescribed-Not-In-Shop
   ================================================ */

          ['smsReminders',  'SMS Reminders',          'Session reminders sent by SMS',             prefs.smsReminders],
          ['preProcedure',  'Pre-Procedure Alerts',   '24h and 2h reminders before sessions',      prefs.preProcedure],
          ['postProcedure', 'Post-Procedure Care',    'Post-session care instructions',             prefs.postProcedure],
          ['generalUpdates','General Updates',        'Clinic news and announcements',             prefs.generalUpdates],
          ['shopUpdates',   'Shop & Order Updates',   'Order confirmations and pickup alerts',      prefs.shopUpdates],
        ].map(([key, label, desc, checked]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)">
          <div><div style="font-weight:600;font-size:0.88rem">${label}</div><div style="font-size:0.75rem;color:var(--text-light)">${desc}</div></div>
          <label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer;flex-shrink:0">
            <input type="checkbox" ${checked?'checked':''} onchange="togglePref('${key}',this.checked)"
                   style="opacity:0;width:0;height:0;position:absolute">
            <span id="toggle-${key}" style="position:absolute;inset:0;border-radius:12px;background:${checked?'var(--primary)':'#ccc'};transition:0.3s;cursor:pointer"></span>
          </label>
        </div>`).join('')}
      </div>

      <!-- Account Security -->
      <div>
        <div class="card" style="margin-bottom:20px">
          <div class="card-title" style="margin-bottom:16px">🔒 Account Security</div>
          <div class="form-row">
            <label>Session Timeout</label>
            <select id="st-session-timeout" onchange="prefs.sessionTimeout=this.value">
              ${['15','30','60','120'].map(m=>`<option value="${m}" ${prefs.sessionTimeout===m?'selected':''}>${m} minutes</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <label>Language</label>
            <select id="st-language" onchange="prefs.language=this.value">
              <option value="en" ${prefs.language==='en'?'selected':''}>English</option>
              <option value="hi" ${prefs.language==='hi'?'selected':''}>हिंदी (Hindi)</option>
              <option value="ml" ${prefs.language==='ml'?'selected':''}>മലയാളം (Malayalam)</option>
            </select>
          </div>

          <div style="background:var(--bg);border-radius:var(--radius-md);padding:14px;margin-top:4px">
            <div style="font-size:0.82rem;color:var(--text-med);margin-bottom:10px"><strong>Account Details</strong></div>
            <div style="font-size:0.82rem;color:var(--text-med);margin-bottom:4px">📧 ${u.email}</div>
            <div style="font-size:0.82rem;color:var(--text-med);margin-bottom:4px">👤 Role: <span style="text-transform:capitalize;font-weight:600">${u.role}</span></div>
            ${u.role==='doctor'?`<div style="font-size:0.82rem;color:var(--text-med)">✅ Status: <span style="color:${u.verificationStatus==='approved'?'var(--success)':'var(--warning)'};font-weight:600">${u.verificationStatus||'Approved'}</span></div>`:''}
            <div style="font-size:0.82rem;color:var(--text-light);margin-top:6px">Member since: Today's session</div>
          </div>

          <div style="display:flex;gap:10px;margin-top:16px">
            <button class="btn btn-green" onclick="showToast('Preferences saved! ✅','success')">💾 Save Preferences</button>
            <button class="btn btn-outline" onclick="showPage('profile')">👤 Edit Profile</button>
          </div>

          <hr style="margin:20px 0;border:none;border-top:1px solid var(--border)">
          <div style="font-weight:700;color:var(--danger);margin-bottom:10px;font-size:0.9rem">⚠️ Danger Zone</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-danger" onclick="confirmLogout()">🚪 Sign Out</button>
            <button class="btn btn-outline" style="border-color:var(--danger);color:var(--danger)" onclick="showDeactivateConfirm()">🗑️ Deactivate Account</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity Log -->
    <div class="card" style="margin-top:4px">
      <div class="card-header">
        <span class="card-title">📋 Recent Activity</span>
        <button class="btn btn-sm btn-outline" onclick="clearAllNotifications()">Clear All</button>
      </div>
      ${recentActivity.length ? `
      <div style="max-height:340px;overflow-y:auto">
        ${recentActivity.map(n => {
          const typeIcons = { pre_procedure:'🌿', post_procedure:'💊', general:'📋', system:'⚙️' };
          const priorityColors = { critical:'var(--danger)', high:'var(--warning)', normal:'var(--text-light)' };
          return `<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);cursor:pointer;align-items:flex-start" onclick="markSingleNotifRead('${n.id}')">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">${typeIcons[n.type]||'📢'}</div>
            <div style="flex:1">
              <div style="font-weight:${n.read?'500':'700'};font-size:0.88rem;color:var(--text)">${n.title}</div>
              <div style="font-size:0.78rem;color:var(--text-light);margin-top:2px">${n.message.slice(0,90)}${n.message.length>90?'…':''}</div>
              <div style="font-size:0.72rem;margin-top:4px;color:${priorityColors[n.priority]||'var(--text-light)'}">${n.priority==='critical'?'🚨 Critical · ':n.priority==='high'?'⚡ High · ':''}${relativeTime?.(n.createdAt)||'recently'}</div>
            </div>
            ${!n.read?'<div style="width:8px;height:8px;border-radius:50%;background:var(--primary);flex-shrink:0;margin-top:6px"></div>':''}
          </div>`;
        }).join('')}
      </div>` : '<div class="empty-state"><span class="empty-state-icon">📋</span><p>No activity yet</p></div>'}
    </div>`;
}

function togglePref(key, val) {
  const u = currentUser;
  USER_PREFS[u.id] = USER_PREFS[u.id] || {};
  USER_PREFS[u.id][key] = val;
  const span = document.getElementById('toggle-' + key);
  if (span) span.style.background = val ? 'var(--primary)' : '#ccc';
}

function markSingleNotifRead(id) {
  const n = DB.notifications.find(n => n.id === id);
  if (n) { n.read = true; buildNav(); }
}

function clearAllNotifications() {
  DB.notifications.filter(n => n.userId === currentUser.id).forEach(n => n.read = true);
  buildNav();
  showToast('All notifications cleared', 'success');
  showPage('settings');
}

function confirmLogout() {
  openModal(`
    <div class="modal-header"><div class="modal-title">Sign Out</div><button class="modal-close" onclick="closeMod()">✕</button></div>
    <p style="color:var(--text-med);margin-bottom:20px;font-size:0.9rem">Are you sure you want to sign out of your account?</p>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeMod()">Cancel</button>
      <button class="btn btn-danger" onclick="closeMod();logout()">Yes, Sign Out</button>
    </div>`);
}

function showDeactivateConfirm() {
  openModal(`
    <div class="modal-header"><div class="modal-title" style="color:var(--danger)">⚠️ Deactivate Account</div><button class="modal-close" onclick="closeMod()">✕</button></div>
    <div style="background:#fff5f5;border:1px solid #f48fb1;border-radius:var(--radius-md);padding:14px;margin-bottom:16px;font-size:0.85rem;color:var(--danger)">
      This action will deactivate your account. You will not be able to sign in until an administrator reactivates it.
    </div>
    <div class="form-row"><label>Enter your password to confirm</label><input type="password" id="deactivate-confirm-pw" placeholder="Your current password"></div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeMod()">Cancel</button>
      <button class="btn btn-danger" onclick="doDeactivate()">Deactivate My Account</button>
    </div>`);
}

function doDeactivate() {
  const pw = document.getElementById('deactivate-confirm-pw')?.value;
  if (pw !== currentUser.password) { showToast('Incorrect password','error'); return; }
  closeMod();
  showToast('Account deactivated. Signing you out...','warning');
  setTimeout(() => logout(), 1500);
}

// ═══════════════════════════════════════════════════════════
// HERBAL SHOP — PATIENT SIDE
// ═══════════════════════════════════════════════════════════
let shopCategoryFilter = 'All';
let shopSearchQuery = '';

function getProduct(id) { return DB.products.find(p => p.id === id); }
function getCartItems() { return DB.cart.filter(c => c.userId === currentUser.id); }
function getCartTotal() { return getCartItems().reduce((s,c) => s + (getProduct(c.productId)?.price||0)*c.qty, 0); }
function getCartCount() { return getCartItems().reduce((s,c) => s + c.qty, 0); }

function renderPatientShop(el) {
  const myOrders = DB.orders.filter(o => o.patientId === currentUser.id);
  const myCart = getCartItems();
  const recommended = DB.products.filter(p => {
    const myPrescriptions = DB.prescriptions.filter(pr => pr.patientId === currentUser.id);
    const prescribedNames = myPrescriptions.flatMap(pr => pr.medicines.map(m => m.name.toLowerCase()));
    return prescribedNames.some(n => p.name.toLowerCase().includes(n.split(' ')[0]));
  });
  const categories = ['All', ...new Set(DB.products.map(p => p.category))];
  const filtered = DB.products.filter(p => {
    const catOk = shopCategoryFilter === 'All' || p.category === shopCategoryFilter;
    const searchOk = !shopSearchQuery || p.name.toLowerCase().includes(shopSearchQuery.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(shopSearchQuery.toLowerCase()));
    return catOk && searchOk;
  });

  el.innerHTML = `
    <div class="shop-hero">
      <div>
        <div class="shop-hero-title">🌿 Ayurvedic Herbal Shop</div>
        <div class="shop-hero-sub">Doctor-recommended remedies, herbs & wellness products</div>
        <div style="display:flex;gap:10px;margin-top:16px">
          <button class="btn" style="background:white;color:var(--primary);font-weight:700;padding:10px 20px" onclick="showPage('patient-orders')">📦 My Orders (${myOrders.length})</button>
          ${myCart.length ? `<button class="btn" style="background:var(--accent);color:white;font-weight:700;padding:10px 20px" onclick="openCartModal()">🛒 Cart (${getCartCount()}) — ₹${getCartTotal().toLocaleString()}</button>` : ''}
        </div>
      </div>
      <div class="shop-hero-stats">
        <div class="shop-hero-stat"><div class="shop-hero-stat-val">${DB.products.length}</div><div class="shop-hero-stat-lbl">Products</div></div>
        <div class="shop-hero-stat"><div class="shop-hero-stat-val">${myOrders.filter(o=>o.status==='delivered').length}</div><div class="shop-hero-stat-lbl">Delivered</div></div>
        <div class="shop-hero-stat"><div class="shop-hero-stat-val">Free</div><div class="shop-hero-stat-lbl">Pickup Option</div></div>
      </div>
    </div>

    ${(() => {
      // Also show prescribed medicines not available in shop
      const myPrescriptions = DB.prescriptions.filter(pr => pr.patientId === currentUser.id);
      const prescribedNames  = myPrescriptions.flatMap(pr => pr.medicines.map(m => m.name));
      const unavailableMeds  = prescribedNames.filter(name => {
        const lower = name.toLowerCase();
        return !DB.products.some(p =>
          p.name.toLowerCase().includes(lower.split(' ')[0]) ||
          lower.includes(p.name.toLowerCase().split(' ')[0])
        );
      });
      return unavailableMeds.length ? `
    <div class="card" style="margin-bottom:16px;border:2px solid var(--warning)">
      <div class="card-header">
        <span class="card-title">⚠️ Prescribed — Not Available in Shop</span>
        <span class="badge badge-yellow">${unavailableMeds.length} medicine${unavailableMeds.length>1?'s':''}</span>
      </div>
      <p style="font-size:0.85rem;color:var(--text-med);margin-bottom:12px">
        The following medicines from your prescription are <strong>not available</strong> in our Herbal Shop. Please contact your doctor or the clinic.
      </p>
      <div style="display:flex;flex-wrap:wrap;gap:10px">
        ${unavailableMeds.map(name => `
          <div style="background:#fff3e0;border:1.5px solid var(--warning);border-radius:var(--radius-md);padding:12px 16px;min-width:160px">
            <div style="font-size:1.5rem;margin-bottom:5px">💊</div>
            <div style="font-weight:700;font-size:0.9rem;margin-bottom:2px">${name}</div>
            <div style="font-size:0.75rem;color:var(--danger);font-weight:600">❌ Not in Shop</div>
          </div>`).join('')}
      </div>
    </div>` : '';
    })()}

    ${recommended.length ? `
    <div class="card" style="margin-bottom:20px;border:2px solid var(--primary)">
      <div class="card-header">
        <span class="card-title">⭐ Recommended for You</span>
        <span class="badge badge-green">Based on your prescription</span>
      </div>
      <div style="display:flex;gap:14px;overflow-x:auto;padding-bottom:6px">
        ${recommended.map(p => {
          const isOOS = p.stock <= 0;
          const isLow = p.stock > 0 && p.stock <= 5;
          return `
          <div style="min-width:200px;background:var(--bg);border-radius:var(--radius-md);padding:16px;flex-shrink:0;border:2px solid ${isOOS?'var(--danger)':'var(--border)'};">
            <div style="font-size:2.8rem;margin-bottom:8px">${p.emoji}</div>
            <div style="font-weight:700;font-size:0.95rem;margin-bottom:4px">${p.name}</div>
            <div style="font-size:0.78rem;color:var(--text-light);margin-bottom:8px">${p.unit}</div>
            <div style="font-size:0.8rem;font-weight:600;margin-bottom:10px;${isOOS?'color:var(--danger)':isLow?'color:var(--warning)':'color:var(--success)'}">
              ${isOOS ? '❌ Out of Stock' : isLow ? `⚠️ Only ${p.stock} left` : `✅ In Stock`}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
              <span style="font-family:var(--font-serif);font-weight:700;color:var(--primary);font-size:1.05rem">₹${p.price}</span>
              ${isOOS
                ? '<span style="font-size:0.78rem;color:var(--danger);font-weight:700;background:#fce4ec;padding:5px 10px;border-radius:6px">Unavailable</span>'
                : `<button class="add-cart-btn ${isInCart(p.id)?'in-cart':''}" onclick="addToCart('${p.id}')">${isInCart(p.id)?'✓ In Cart':'🛒 Add'}</button>`
              }
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    <div class="shop-filters">
      <input class="shop-search" type="text" placeholder="🔍 Search herbs, remedies..." value="${shopSearchQuery}" oninput="shopSearch(this.value)">
      ${categories.map(c => `<button class="filter-btn ${shopCategoryFilter===c?'active':''}" onclick="setShopCat('${c}')">${c}</button>`).join('')}
    </div>

    <div class="product-grid" id="product-grid">
      ${filtered.map(p => productCardHTML(p)).join('')}
    </div>

    ${myCart.length ? `
    <div class="cart-bar" id="cart-bar">
      <span>🛒</span>
      <span class="cart-bar-count">${getCartCount()} items</span>
      <span class="cart-bar-total">₹${getCartTotal().toLocaleString()}</span>
      <button class="cart-bar-btn" onclick="openCartModal()">View Cart →</button>
    </div>` : ''}`;
}

function productCardHTML(p) {
  const inCart = isInCart(p.id);
  const discountPct = Math.round((1 - p.price/p.mrp)*100);
  const dr = getUser(p.doctorId);
  const isOOS = p.stock <= 0;
  const isLow = p.stock > 0 && p.stock <= 5;
  return `<div class="product-card">
    <div class="product-img" style="background:linear-gradient(135deg,${p.price>500?'#f0ead8':'#e8f5e9'},${p.price>500?'#fff8f0':'#f1f8e9'})">
      <span style="font-size:5rem">${p.emoji}</span>
      ${isOOS ? '<span class="product-badge-corner" style="background:#DC3545">Out of Stock</span>' :
        p.isNew ? '<span class="product-badge-corner new">NEW</span>' :
        p.recommended ? '<span class="product-badge-corner rec">⭐ Rec</span>' :
        discountPct >= 10 ? `<span class="product-badge-corner">${discountPct}% OFF</span>` : ''}
    </div>
    <div class="product-body">
      <div class="product-name">${p.name}</div>
      <div style="font-size:0.82rem;color:var(--text-light);margin-bottom:6px">By ${dr?.name||'Clinic'} · ${p.unit}</div>
      <div class="product-desc">${p.description}</div>
      <div class="product-tags">${(p.tags||[]).map(t=>`<span class="product-tag">${t}</span>`).join('')}</div>
    </div>
    <div class="product-footer">
      <div>
        <div><span class="product-price">₹${p.price}</span> <span class="product-price-orig">₹${p.mrp}</span></div>
        <div class="product-stock" style="${isOOS?'color:var(--danger);font-weight:700':isLow?'color:var(--warning);font-weight:700':''}">
          ${isOOS ? '❌ Out of Stock' : isLow ? `⚠️ Only ${p.stock} left!` : `✅ In Stock (${p.stock})`}
        </div>
      </div>
      ${isOOS
        ? '<div class="product-out-of-stock">❌ Unavailable</div>'
        : `<button class="add-cart-btn ${inCart?'in-cart':''}" onclick="addToCart('${p.id}')">${inCart ? '✓ In Cart' : '🛒 Add'}</button>`
      }
    </div>
  </div>`;
}

function isInCart(productId) {
  return DB.cart.some(c => c.userId === currentUser.id && c.productId === productId);
}
function addToCart(productId) {
  const existing = DB.cart.find(c => c.userId === currentUser.id && c.productId === productId);
  if (existing) { existing.qty++; }
  else { DB.cart.push({ userId: currentUser.id, productId, qty: 1 }); }
  const p = getProduct(productId);
  showToast(`${p?.name} added to cart 🛒`, 'success');
  buildNav();
  showPage('patient-shop');
}
function removeFromCart(productId) {
  const idx = DB.cart.findIndex(c => c.userId === currentUser.id && c.productId === productId);
  if (idx >= 0) DB.cart.splice(idx, 1);
}
function updateCartQty(productId, delta) {
  const item = DB.cart.find(c => c.userId === currentUser.id && c.productId === productId);
  if (!item) return;
  const newQty = item.qty + delta;
  if (newQty <= 0) {
    // Confirm before removing
    item.qty = 1; // don't go below 1 — use Remove button to delete
    if (delta < 0) {
      // qty is already 1, pressing minus → offer to remove
      openModal(`
        <div class="modal-header"><div class="modal-title">Remove Item?</div><button class="modal-close" onclick="closeMod()">✕</button></div>
        <p style="color:var(--text-med);margin-bottom:20px">Remove <strong>${getProduct(productId)?.name}</strong> from your cart?</p>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeMod();openCartModal()">Keep</button>
          <button class="btn btn-danger" onclick="removeFromCart('${productId}');closeMod();openCartModal()">Remove</button>
        </div>`);
      return;
    }
  } else {
    // Check stock availability
    const p = getProduct(productId);
    if (p && newQty > p.stock) {
      showToast(`Only ${p.stock} units available`, 'warning');
      return;
    }
    item.qty = newQty;
  }
  openCartModal(); // refresh modal
