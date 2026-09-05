// public/admin/js/books.js
let categoriesCache = [];

function bookRowHtml(b) {
  return `
    <tr data-id="${b.id}">
      <td>${b.title}<br/><small style="color:var(--muted);">${b.slug}</small></td>
      <td>${b.author}</td>
      <td>${b.category_name || '—'}</td>
      <td>${formatRupees(b.price_paise)}</td>
      <td>${b.stock}</td>
      <td>${b.is_active ? 'सक्रिय' : 'लपवलेले'}</td>
      <td>
        <button class="btn btn-secondary" data-action="edit">संपादित करा</button>
        <button class="btn btn-secondary" data-action="delete">काढा</button>
      </td>
    </tr>
  `;
}

function bookFormHtml(book = {}) {
  const catOptions = categoriesCache
    .map((c) => `<option value="${c.id}" ${book.category_id === c.id ? 'selected' : ''}>${c.name}</option>`)
    .join('');

  return `
    <div class="form-row">
      <div class="form-group"><label>शीर्षक</label><input name="title" value="${book.title || ''}" required /></div>
      <div class="form-group"><label>लेखक</label><input name="author" value="${book.author || ''}" required /></div>
    </div>
    <div class="form-group"><label>विभाग</label><select name="category_id"><option value="">— निवडा —</option>${catOptions}</select></div>
    <div class="form-group"><label>वर्णन</label><textarea name="description" rows="3">${book.description || ''}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label>किंमत (₹)</label><input name="price" type="number" step="0.01" value="${book.price_paise ? book.price_paise / 100 : ''}" required /></div>
      <div class="form-group"><label>MRP (₹, ऐच्छिक)</label><input name="mrp" type="number" step="0.01" value="${book.mrp_paise ? book.mrp_paise / 100 : ''}" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>साठा</label><input name="stock" type="number" value="${book.stock ?? 0}" required /></div>
      <div class="form-group"><label>पाने</label><input name="pages" type="number" value="${book.pages || ''}" /></div>
    </div>
    <div class="form-group"><label>कव्हर इमेज URL</label><input name="cover_image_url" value="${book.cover_image_url || ''}" /></div>
    <div class="form-group">
      <label><input type="checkbox" name="is_featured" ${book.is_featured ? 'checked' : ''} style="width:auto;display:inline;margin-right:6px;" /> निवडक (Featured)</label>
    </div>
    <div class="form-group">
      <label><input type="checkbox" name="is_active" ${book.is_active === 0 ? '' : 'checked'} style="width:auto;display:inline;margin-right:6px;" /> स्टोअरमध्ये दिसावे</label>
    </div>
  `;
}

function openModal(title, formHtml, onSubmit) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h2>${title}</h2>
      <form id="modal-form">${formHtml}</form>
      <p class="form-error" id="modal-error"></p>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="modal-cancel" type="button">रद्द करा</button>
        <button class="btn btn-primary" id="modal-save" type="submit" form="modal-form">जतन करा</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  backdrop.querySelector('#modal-cancel').addEventListener('click', () => backdrop.remove());
  backdrop.querySelector('#modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = backdrop.querySelector('#modal-error');
    try {
      await onSubmit(new FormData(e.target));
      backdrop.remove();
      loadBooks();
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.style.display = 'block';
    }
  });
}

function formToBookPayload(fd) {
  return {
    title: fd.get('title'),
    author: fd.get('author'),
    category_id: fd.get('category_id') ? Number(fd.get('category_id')) : null,
    description: fd.get('description'),
    price_paise: Math.round(Number(fd.get('price')) * 100),
    mrp_paise: fd.get('mrp') ? Math.round(Number(fd.get('mrp')) * 100) : null,
    stock: Number(fd.get('stock')),
    pages: fd.get('pages') ? Number(fd.get('pages')) : null,
    cover_image_url: fd.get('cover_image_url'),
    is_featured: fd.get('is_featured') === 'on',
    is_active: fd.get('is_active') === 'on',
  };
}

async function loadBooks() {
  const tbody = document.getElementById('books-tbody');
  try {
    const { books } = await AdminApi.getBooks();
    tbody.innerHTML = books.length
      ? books.map(bookRowHtml).join('')
      : `<tr><td colspan="7" class="empty-state">अजून पुस्तके जोडलेली नाहीत.</td></tr>`;

    tbody.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.closest('tr').dataset.id);
        const book = books.find((b) => b.id === id);
        if (btn.dataset.action === 'edit') {
          openModal('पुस्तक संपादित करा', bookFormHtml(book), (fd) => AdminApi.updateBook(id, formToBookPayload(fd)));
        } else if (btn.dataset.action === 'delete') {
          if (confirm('हे पुस्तक स्टोअरमधून लपवायचे?')) await AdminApi.deleteBook(id).then(loadBooks);
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">${err.message}</td></tr>`;
  }
}

async function init() {
  await guardAdminPage();
  const { categories } = await AdminApi.getCategories();
  categoriesCache = categories;
  loadBooks();

  document.getElementById('add-book-btn').addEventListener('click', () => {
    openModal('नवीन पुस्तक जोडा', bookFormHtml(), (fd) => AdminApi.createBook(formToBookPayload(fd)));
  });
}

init();
