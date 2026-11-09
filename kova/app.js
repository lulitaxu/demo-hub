/* KOVA demo storefront — shared front-end logic */
const PRODUCTS = {
  spectra: { name: 'Spectra Hoodie',  price: 4850, img: 'assets/img/hoodie.jpg',       sized: true,  def: 'M'  },
  tote:    { name: 'Carry All Tote',  price: 3290, img: 'assets/img/tote.jpg',         sized: false },
  void:    { name: 'Void Shades',     price: 2150, img: 'assets/img/shades.jpg',       sized: false },
  cargo:   { name: 'Balcony Cargo',   price: 5490, img: 'assets/img/cargo.jpg',        sized: true,  def: 'M'  },
  court:   { name: 'Court Sneaker',   price: 8990, img: 'assets/img/sneaker-white.jpg',sized: true,  def: '42' },
  pine:    { name: 'Court Low — Pine',price: 8450, img: 'assets/img/sneaker-green.jpg',sized: true,  def: '42' },
  hazard:  { name: 'Hazard High',     price: 9490, img: 'assets/img/sneaker-yellow.jpg',sized: true, def: '42' },
};
const fmt = n => '৳ ' + n.toLocaleString('en-IN');
const $ = s => document.querySelector(s);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- cart state ---------- */
let cart = new Map();
try { cart = new Map(JSON.parse(localStorage.getItem('kova_cart') || '[]')); } catch (e) { cart = new Map(); }
const saveCart = () => { try { localStorage.setItem('kova_cart', JSON.stringify([...cart])); } catch (e) {} };
const cartCount = () => [...cart.values()].reduce((a, b) => a + b, 0);
const cartTotal = () => [...cart.entries()].reduce((a, [k, q]) => a + PRODUCTS[k.split('|')[0]].price * q, 0);

function addToCart(id, size, qty = 1, silent = false) {
  const p = PRODUCTS[id]; if (!p) return;
  const sz = size || (p.sized ? p.def : 'OS');
  const key = id + '|' + sz;
  cart.set(key, (cart.get(key) || 0) + qty);
  saveCart(); renderCart();
  const badge = $('#bagCount');
  badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop');
  if (!silent) toast(`Added — <b>${p.name}</b>${p.sized ? ' · size ' + sz : ''}`);
}
function renderCart() {
  const n = cartCount();
  $('#bagCount').textContent = n;
  $('#dCount').textContent = '(' + n + ')';
  const box = $('#dItems');
  if (!cart.size) {
    box.innerHTML = '<p class="d-empty">Your bag is empty.<br>The drop will not wait.</p>';
  } else {
    box.innerHTML = [...cart.entries()].map(([key, q]) => {
      const [id, sz] = key.split('|'); const p = PRODUCTS[id];
      return `<div class="d-item">
        <img src="${p.img}" alt="">
        <div>
          <p class="d-name">${p.name}</p>
          <p class="d-variant">${p.sized ? 'Size ' + sz : 'One size'} · ${fmt(p.price)}</p>
          <span class="d-qty">
            <button data-dec="${key}" aria-label="Decrease">−</button>
            <output>${q}</output>
            <button data-inc="${key}" aria-label="Increase">+</button>
          </span>
        </div>
        <div class="d-right">
          <span class="d-line">${fmt(p.price * q)}</span>
          <button class="d-rm" data-rm="${key}">Remove</button>
        </div>
      </div>`;
    }).join('');
  }
  $('#dSubtotal').textContent = fmt(cartTotal());
  $('#checkoutBtn').disabled = !cart.size;
  $('#dNote').textContent = '';
}
$('#dItems').addEventListener('click', e => {
  const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]'), rm = e.target.closest('[data-rm]');
  if (inc) { const k = inc.dataset.inc; cart.set(k, cart.get(k) + 1); }
  else if (dec) { const k = dec.dataset.dec; const v = cart.get(k) - 1; v <= 0 ? cart.delete(k) : cart.set(k, v); }
  else if (rm) { cart.delete(rm.dataset.rm); }
  else return;
  saveCart(); renderCart();
});

/* ---------- drawer ---------- */
const drawer = $('#drawer'), overlay = $('#overlay');
const openBag = () => { drawer.classList.add('show'); overlay.classList.add('show'); document.body.style.overflow = 'hidden'; };
const closeBag = () => { drawer.classList.remove('show'); overlay.classList.remove('show'); document.body.style.overflow = ''; };
$('#bagBtn').addEventListener('click', openBag);
$('#dClose').addEventListener('click', closeBag);
overlay.addEventListener('click', closeBag);
addEventListener('keydown', e => { if (e.key === 'Escape') closeBag(); });
$('#checkoutBtn').addEventListener('click', () => {
  if (!cart.size) return;
  $('#dNote').textContent = 'Demo checkout — no payment is taken.';
});

/* ---------- toast ---------- */
let toastT;
function toast(html) {
  const t = $('#toast'); t.innerHTML = html; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2300);
}

/* ---------- quick add + hearts (both pages) ---------- */
document.addEventListener('click', e => {
  const add = e.target.closest('[data-add]');
  if (add) { addToCart(add.dataset.add); return; }
  const heart = e.target.closest('.heart');
  if (heart) heart.classList.toggle('on');
});

/* ---------- header on scroll ---------- */
const topbar = $('#topbar'), hero = $('#hero');
function onScrollHeader() {
  if (!hero) return;
  topbar.classList.toggle('scrolled', scrollY > hero.offsetHeight - 90);
}
addEventListener('scroll', onScrollHeader, { passive: true }); onScrollHeader();

/* ---------- hero parallax ---------- */
const heroType = $('#heroType'), heroImg = $('#heroImg');
if (heroType && !reduceMotion) {
  addEventListener('scroll', () => {
    const y = scrollY;
    if (y < innerHeight * 1.2) {
      heroType.style.transform = `translateY(${y * 0.22}px)`;
      heroImg.style.transform = `translateY(${y * 0.1}px) scale(1.06)`;
    }
  }, { passive: true });
}

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(es => es.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
}), { threshold: 0.12 });
document.querySelectorAll('.rv').forEach(el => io.observe(el));

/* ---------- home: search filter ---------- */
const searchInput = $('#searchInput'), filterNote = $('#filterNote');
if (searchInput && filterNote) {
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll('#best .p-card').forEach(card => {
      const hit = !q || card.dataset.name.includes(q);
      card.style.display = hit ? '' : 'none';
      if (hit) visible++;
    });
    filterNote.classList.toggle('show', !!q);
    filterNote.innerHTML = q ? `Showing <b>${visible}</b> result${visible === 1 ? '' : 's'} for “${q}” — <a href="#best" id="clearSearch" style="border-bottom:1px solid">clear</a>` : '';
    const clear = $('#clearSearch');
    if (clear) clear.addEventListener('click', ev => { ev.preventDefault(); searchInput.value = ''; searchInput.dispatchEvent(new Event('input')); });
    if (q) $('#best').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}

/* ---------- home: rail arrows ---------- */
const rail = $('#rail');
if (rail) {
  $('#railNext').addEventListener('click', () => rail.scrollBy({ left: 330, behavior: reduceMotion ? 'auto' : 'smooth' }));
  $('#railPrev').addEventListener('click', () => rail.scrollBy({ left: -330, behavior: reduceMotion ? 'auto' : 'smooth' }));
}

/* ---------- home: misc ---------- */
const playBtn = $('#playBtn');
if (playBtn) playBtn.addEventListener('click', () => toast('Campaign film drops with the full site — <b>design demo</b>'));
const newsForm = $('#newsForm');
if (newsForm) newsForm.addEventListener('submit', e => { e.preventDefault(); toast('You are on the list — <b>see you at the drop</b>'); newsForm.reset(); });

/* ---------- product page ---------- */
const galMain = $('#galMain');
if (galMain) {
  document.querySelectorAll('.gal-thumbs button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gal-thumbs button').forEach(b => b.classList.remove('act'));
      btn.classList.add('act');
      galMain.style.opacity = 0;
      setTimeout(() => { galMain.src = btn.dataset.src; galMain.style.opacity = 1; }, 160);
    });
  });
  let selSize = null, qty = 1;
  const qOut = $('#qOut'), sizeErr = $('#sizeErr'), sizeRow = $('#sizeRow');
  sizeRow.addEventListener('click', e => {
    const b = e.target.closest('.size'); if (!b) return;
    sizeRow.querySelectorAll('.size').forEach(x => x.classList.remove('sel'));
    b.classList.add('sel'); selSize = b.dataset.size; sizeErr.classList.remove('show');
  });
  $('#qPlus').addEventListener('click', () => { qty = Math.min(9, qty + 1); qOut.textContent = qty; });
  $('#qMinus').addEventListener('click', () => { qty = Math.max(1, qty - 1); qOut.textContent = qty; });
  const needSize = () => {
    if (selSize) return false;
    sizeErr.classList.add('show');
    sizeRow.classList.remove('shake'); void sizeRow.offsetWidth; sizeRow.classList.add('shake');
    sizeRow.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    return true;
  };
  $('#addBag').addEventListener('click', () => { if (needSize()) return; addToCart('spectra', selSize, qty); });
  $('#buyNow').addEventListener('click', () => { if (needSize()) return; addToCart('spectra', selSize, qty, true); openBag(); });
}

renderCart();
