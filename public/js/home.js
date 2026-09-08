// public/js/home.js
function bookCardHtml(book) {
  const cover = book.cover_image_url
    ? `<img src="${book.cover_image_url}" alt="${book.title}" />`
    : book.title;

  return `
    <a class="book-card" href="/html/book.html?slug=${book.slug}">
      <div class="book-cover">${cover}</div>
      ${book.is_featured ? '<span class="badge">Featured</span>' : ''}
      <h3>${book.title}</h3>
      <p class="book-author">${book.author}</p>
      <div>
        <span class="book-price">${formatRupees(book.price_paise)}</span>
        ${book.mrp_paise ? `<span class="book-mrp">${formatRupees(book.mrp_paise)}</span>` : ''}
      </div>
    </a>
  `;
}

async function loadFeatured() {
  const el = document.getElementById('featured-grid');
  try {
    const { books } = await Api.getBooks({ featured: '1' });
    el.innerHTML = books.length
      ? books.map(bookCardHtml).join('')
      : `<p class="empty-state">No featured books available right now.</p>`;
  } catch (err) {
    el.innerHTML = `<p class="empty-state">${err.message}</p>`;
  }
}

async function loadCategoriesAndBooks() {
  const chipRow = document.getElementById('category-chips');
  const grid = document.getElementById('all-books-grid');

  try {
    const { categories } = await Api.getCategories();
    chipRow.innerHTML =
      `<button class="category-chip active" data-slug="">All</button>` +
      categories.map((c) => `<button class="category-chip" data-slug="${c.slug}">${c.name}</button>`).join('');

    chipRow.querySelectorAll('.category-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        chipRow.querySelectorAll('.category-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        loadBooks(chip.dataset.slug);
      });
    });
  } catch (err) {
    chipRow.innerHTML = '';
  }

  async function loadBooks(categorySlug) {
    grid.innerHTML = `<p class="loading-state">Loading books...</p>`;
    try {
      const { books } = await Api.getBooks(categorySlug ? { category: categorySlug } : {});
      grid.innerHTML = books.length
        ? books.map(bookCardHtml).join('')
        : `<p class="empty-state">No books in this category yet.</p>`;
    } catch (err) {
      grid.innerHTML = `<p class="empty-state">${err.message}</p>`;
    }
  }

  loadBooks('');
}

loadFeatured();
loadCategoriesAndBooks();
