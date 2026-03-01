// --- CURSOR ---
const cur = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
(function anim() {
    rx += (mx - rx) * .13; ry += (my - ry) * .13;
    cur.style.cssText += `left:${mx}px;top:${my}px;`;
    ring.style.cssText += `left:${rx}px;top:${ry}px;`;
    requestAnimationFrame(anim);
})();

document.addEventListener('mouseover', e => {
    if (e.target.matches('a,button,.product-card,.swatch,.modal-size,.modal-swatch,.size-tag')) {
        cur.classList.add('cur-big'); ring.classList.add('ring-hide');
    } else {
        cur.classList.remove('cur-big'); ring.classList.remove('ring-hide');
    }
});

// --- PRODUCTS DATA ---
let products = [];

async function fetchProducts() {
    try {
        const res = await fetch('http://localhost:5000/api/products');
        products = await res.json();
        renderProducts(products);
    } catch (e) {
        console.error('Failed to fetch products:', e);
    }
}

let cartCount = 0;
let currentModal = null;
let showing = 12;

function renderProducts(list) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';
    list.forEach((p, i) => {
        const badgeHTML = p.badge ? `<div class="badge badge-${p.badge}">${p.badge === 'new' ? 'NEW' : p.badge === 'limited' ? 'LIMITED' : p.badge === 'sold' ? 'SOLD OUT' : 'PRE-ORDER'}</div>` : '';
        const offPct = p.orig ? Math.round((1 - p.price / p.orig) * 100) : 0;
        const sizes = p.sizes.length ? p.sizes.map(s => `<div class="size-tag${s === '' ? ' unavailable' : ''}">${s}</div>`).join('') : '<div class="size-tag unavailable">N/A</div>';

        grid.innerHTML += `
    <div class="product-card" style="animation-delay:${i * 0.05}s">
      <div class="card-image">
        <div class="card-img-bg" style="background:${p.bg}">
          <div class="card-big-letter">${p.letter}</div>
        </div>
        ${badgeHTML}
        <button class="wishlist-btn" onclick="toggleWishlist(this)">♡</button>
        <div class="card-overlay">
          <button class="quick-add" onclick="addToCart(${p.id})">Quick Add</button>
          <button class="quick-view" onclick="openModal(${p.id})">Quick View →</button>
        </div>
        <div class="card-sizes">${sizes}</div>
      </div>
      <div class="card-info">
        <div class="card-brand">VOLT STUDIO</div>
        <div class="card-name">${p.name}</div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
          ${p.colors.slice(0, 3).map(c => `<div style="width:10px;height:10px;border-radius:50%;background:${c};border:1px solid rgba(245,240,232,.2)"></div>`).join('')}
        </div>
        <div class="card-price-row">
          <div class="card-price">$${p.price}</div>
          ${p.orig ? `<div class="card-original">$${p.orig}</div><div class="card-off">-${offPct}%</div>` : ''}
        </div>
        <div class="card-rating">
          <div class="stars">${'★'.repeat(Math.floor(p.rating))}</div>
          <div class="rating-count">(${p.reviews})</div>
        </div>
      </div>
    </div>`;
    });
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) resultsCount.textContent = `${list.length} Products`;
}

function openModal(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    currentModal = p;
    document.getElementById('modal-name').textContent = p.name;
    document.getElementById('modal-price').textContent = `$${p.price}`;
    document.getElementById('modal-bg').style.background = p.bg;
    document.getElementById('modal-letter').textContent = p.letter;
    document.getElementById('modal-desc').textContent = p.desc;
    const off = p.orig ? Math.round((1 - p.price / p.orig) * 100) : 0;
    document.getElementById('modal-orig').textContent = p.orig ? `$${p.orig}` : '';
    document.getElementById('modal-off').textContent = p.orig ? `-${off}%` : '';
    document.getElementById('modal-sizes').innerHTML = p.sizes.map(s => `<div class="modal-size" onclick="selectSize(this)">${s}</div>`).join('') || '<div class="modal-size unavail">N/A</div>';
    document.getElementById('modal-colors').innerHTML = p.colors.map(c => `<div class="modal-swatch" style="background:${c};border:2px solid transparent" onclick="this.parentNode.querySelectorAll('.modal-swatch').forEach(x=>x.classList.remove('active'));this.classList.add('active')"></div>`).join('');
    document.getElementById('modal-overlay').classList.add('open');
}

function closeModal(e) { if (e.target === document.getElementById('modal-overlay')) closeModalDirect(); }
function closeModalDirect() { document.getElementById('modal-overlay').classList.remove('open'); }
function selectSize(el) {
    el.closest('.modal-sizes').querySelectorAll('.modal-size').forEach(x => x.classList.remove('selected'));
    el.classList.add('selected');
}

function addToCart(id) {
    const user = sessionStorage.getItem('volt_user');
    if (!user) {
        const prompt = document.getElementById('login-prompt');
        if (prompt) {
            prompt.classList.add('show');
            setTimeout(() => prompt.classList.remove('show'), 5000);
        }
        return;
    }

    let productToAdd = null;
    if (id) {
        productToAdd = products.find(p => p.id === id);
    } else if (currentModal) {
        productToAdd = currentModal;
    }

    if (productToAdd) {
        const cart = JSON.parse(localStorage.getItem('volt_cart')) || [];
        const existing = cart.find(i => i.id === productToAdd.id);
        if (existing) {
            existing.qty++;
        } else {
            cart.push({
                id: productToAdd.id,
                name: productToAdd.name,
                cat: productToAdd.cat,
                price: productToAdd.price,
                orig: productToAdd.orig,
                qty: 1,
                bg: productToAdd.bg,
                letter: productToAdd.letter,
                color: productToAdd.colors[0],
                colorName: 'Default',
                size: 'M'
            });
        }
        localStorage.setItem('volt_cart', JSON.stringify(cart));
        updateCartCount();
    }

    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2800);
    }
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('volt_cart')) || [];
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.textContent = count;
}

function logOut() {
    sessionStorage.removeItem('volt_user');
    applyAuthState();
}

function applyAuthState() {
    const user = JSON.parse(sessionStorage.getItem('volt_user') || 'null');
    const authGroup = document.getElementById('nav-auth-group');
    const navUser = document.getElementById('nav-user');
    const navCart = document.getElementById('nav-cart');
    const nameEl = document.getElementById('nav-user-name');
    const avatarEl = document.getElementById('nav-avatar');

    if (user) {
        if (authGroup) authGroup.style.display = 'none';
        if (navUser) navUser.classList.add('show');
        if (navCart) navCart.classList.add('show');
        const first = user.name ? user.name.split(' ')[0] : 'You';
        const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
        if (nameEl) nameEl.textContent = 'Hey, ' + first;
        if (avatarEl) avatarEl.childNodes[0].textContent = initials;
        updateCartCount();
    } else {
        if (authGroup) authGroup.style.display = 'flex';
        if (navUser) navUser.classList.remove('show');
        if (navCart) navCart.classList.remove('show');
        const countEl = document.getElementById('cart-count');
        if (countEl) countEl.textContent = '0';
    }
}

function toggleWishlist(btn) {
    btn.classList.toggle('liked');
    btn.textContent = btn.classList.contains('liked') ? '♥' : '♡';
}

function toggleFilter(el) { el.classList.toggle('checked'); }

function filterCategory(cat, btn) {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const filtered = cat === 'all' ? products : cat === 'new' ? products.filter(p => p.badge === 'new') : cat === 'sale' ? products.filter(p => p.orig) : products.filter(p => p.cat === cat);
    renderProducts(filtered);
    animateCards();
}

function sortProducts(val) {
    let list = [...products];
    if (val === 'low') list.sort((a, b) => a.price - b.price);
    else if (val === 'high') list.sort((a, b) => b.price - a.price);
    else if (val === 'popular') list.sort((a, b) => b.reviews - a.reviews);
    renderProducts(list);
    animateCards();
}

function setView(cols, btn) {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const grid = document.getElementById('products-grid');
    grid.className = 'products-grid';
    if (cols === 2) grid.classList.add('view-2');
    else if (cols === 'list') grid.classList.add('view-list');
}

function loadMore() {
    const btn = document.querySelector('.load-more-btn span');
    if (!btn) return;
    btn.textContent = 'Loading...';
    setTimeout(() => {
        showing = 24;
        const countEl = document.getElementById('load-count');
        if (countEl) countEl.textContent = 'Showing all 24 products';
        btn.textContent = 'All Products Loaded ✓';
        document.querySelector('.load-more-btn').style.borderColor = 'var(--accent2)';
        document.querySelector('.load-more-btn').style.color = 'var(--accent2)';
    }, 1000);
}

function animateCards() {
    document.querySelectorAll('.product-card').forEach((c, i) => {
        c.style.opacity = '0'; c.style.transform = 'translateY(16px)';
        setTimeout(() => { c.style.opacity = '1'; c.style.transform = 'translateY(0)'; c.style.transition = 'opacity .4s ease, transform .4s ease'; }, i * 40);
    });
}

// Scroll reveal
const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); }), { threshold: .1 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// Tilt on cards
document.addEventListener('mousemove', e => {
    const card = e.target.closest('.product-card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    const bg = card.querySelector('.card-img-bg');
    if (bg) bg.style.transform = `scale(1.08) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
});
document.addEventListener('mouseleave', e => {
    const card = e.target.closest?.('.product-card');
    const bg = card?.querySelector('.card-img-bg');
    if (bg) bg.style.transform = '';
}, true);

// Initial render
renderProducts(products);
applyAuthState();
