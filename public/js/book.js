// public/js/book.js
const slug = new URLSearchParams(location.search).get('slug');
const root = document.getElementById('book-detail');

async function loadBook() {
  if (!slug) {
    root.innerHTML = `<p class="empty-state">पुस्तक निवडलेले नाही.</p>`;
    return;
  }
  try {
    const { book } = await Api.getBook(slug);
    document.title = `${book.title} | चव म्याव प्रकाशन`;

    const cover = book.cover_image_url
      ? `<img src="${book.cover_image_url}" alt="${book.title}" />`
      : book.title;

    root.innerHTML = `
      <div class="hero-visual" style="aspect-ratio:3/4;max-width:320px;">${cover}</div>
      <div>
        ${book.category_name ? `<p class="hero-eyebrow">${book.category_name}</p>` : ''}
        <h1 style="font-size:32px;">${book.title}</h1>
        <p class="book-author" style="font-size:15px;">लेखक: ${book.author}</p>
        <p style="margin:20px 0;">${book.description || ''}</p>
        <div style="margin-bottom:20px;">
          <span class="book-price" style="font-size:24px;">${formatRupees(book.price_paise)}</span>
          ${book.mrp_paise ? `<span class="book-mrp">${formatRupees(book.mrp_paise)}</span>` : ''}
        </div>
        <p style="color:var(--muted);font-size:14px;margin-bottom:20px;">
          ${book.stock > 0 ? `साठ्यात उपलब्ध (${book.stock} प्रती)` : 'सध्या स्टॉकमध्ये नाही'}
        </p>
        <button class="btn btn-primary" id="add-to-cart" ${book.stock < 1 ? 'disabled' : ''}>
          कार्टमध्ये टाका
        </button>
      </div>
    `;

    document.getElementById('add-to-cart')?.addEventListener('click', () => {
      CartStore.add(book, 1);
      const btn = document.getElementById('add-to-cart');
      btn.textContent = 'कार्टमध्ये टाकले ✓';
      setTimeout(() => (btn.textContent = 'कार्टमध्ये टाका'), 1500);
    });
  } catch (err) {
    root.innerHTML = `<p class="empty-state">${err.message}</p>`;
  }
}

loadBook();
