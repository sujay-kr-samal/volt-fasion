// CURSOR
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
function animCursor() {
  rx += (mx - rx) * 0.15;
  ry += (my - ry) * 0.15;
  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
  ring.style.left = rx + 'px';
  ring.style.top = ry + 'px';
  requestAnimationFrame(animCursor);
}
animCursor();

document.querySelectorAll('a, button, .product-card, .testi-card, .strip-item').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.classList.add('cursor-expand');
    ring.classList.add('ring-shrink');
  });
  el.addEventListener('mouseleave', () => {
    cursor.classList.remove('cursor-expand');
    ring.classList.remove('ring-shrink');
  });
});

// LOADER
setTimeout(() => {
  document.getElementById('loader').classList.add('hide');
}, 2000);

// SCROLL REVEAL
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// COUNTER ANIMATION
function animateCounter(el, target) {
  let start = 0;
  const suffix = target > 999 ? '+' : (target <= 40 ? '' : '+');
  const duration = 2000;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting && !e.target.dataset.counted) {
      e.target.dataset.counted = true;
      animateCounter(e.target, parseInt(e.target.dataset.target));
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

// PARALLAX
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const heroGiant = document.querySelector('.hero-giant-text');
  if (heroGiant) heroGiant.style.transform = `translateY(${y * 0.3}px)`;

  const heroCard = document.querySelector('.hero-card');
  if (heroCard) heroCard.style.transform = `translateY(${y * 0.15}px)`;
});

// MAGNETIC BUTTONS
document.querySelectorAll('.btn-primary, .btn-outline, .btn-dark').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.15}px, ${y * 0.3}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

// --- AUTH & USER STATE ---
function applyAuthState() {
  const user = JSON.parse(sessionStorage.getItem('volt_user') || 'null');
  const authGroup = document.getElementById('nav-auth-group');
  const navUser = document.getElementById('nav-user');
  const nameEl = document.getElementById('nav-user-name');
  const avatarEl = document.getElementById('nav-avatar');

  if (user) {
    if (authGroup) authGroup.style.display = 'none';
    if (navUser) navUser.style.display = 'flex';
    const first = user.name ? user.name.split(' ')[0] : 'You';
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
    if (nameEl) nameEl.textContent = 'Hey, ' + first;
    if (avatarEl) avatarEl.childNodes[0].textContent = initials;
    updateCartCount();
  } else {
    if (authGroup) authGroup.style.display = 'flex';
    if (navUser) navUser.style.display = 'none';
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

// Initial Auth Apply
applyAuthState();

// HOVER tilt on product cards
document.querySelectorAll('.product-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(600px) rotateY(0) rotateX(0) scale(1)';
    card.style.transition = 'transform 0.5s ease';
  });
  card.addEventListener('mouseenter', () => {
    card.style.transition = 'none';
  });
});

// EMAIL SUBMIT
document.querySelector('.email-btn').addEventListener('click', () => {
  const input = document.querySelector('.email-input');
  if (input.value) {
    document.querySelector('.email-btn').textContent = 'You\'re In ✓';
    document.querySelector('.email-btn').style.background = 'var(--accent2)';
    document.querySelector('.email-btn').style.color = 'var(--black)';
    input.value = '';
  }
});
