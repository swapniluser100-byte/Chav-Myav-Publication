// public/js/cart.js
function render() {
  const cart = CartStore.getAll();
  const items = Object.values(cart);
  const tableWrap = document.getElementById('cart-table-wrap');
  const summaryWrap = document.getElementById('cart-summary');

  if (items.length === 0) {
    tableWrap.innerHTML = `<p class="empty-state">Your cart is empty. <a href="/html/index.html" style="color:var(--maroon);">Browse books →</a></p>`;
    summaryWrap.innerHTML = '';
    return;
  }

  tableWrap.innerHTML = `
    <table class="cart-table">
      <thead>
        <tr><th>Book</th><th>Quantity</th><th>Price</th><th></th></tr>
      </thead>
      <tbody>
        ${items
          .map(
            (item) => `
          <tr data-id="${item.bookId}">
            <td class="cart-item-title">${item.title}<small>${item.author}</small></td>
            <td>
              <div class="qty-control">
                <button data-action="dec">−</button>
                <span>${item.quantity}</span>
                <button data-action="inc">+</button>
              </div>
            </td>
            <td>${formatRupees(item.price_paise * item.quantity)}</td>
            <td><button class="remove-link" data-action="remove">Remove</button></td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  const subtotal = CartStore.subtotalPaise();
  const shipping = subtotal >= 50000 || subtotal === 0 ? 0 : 5000;
  summaryWrap.innerHTML = `
    <div class="summary-card">
      <div class="summary-row"><span>Subtotal</span><span>${formatRupees(subtotal)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${shipping ? formatRupees(shipping) : 'Free'}</span></div>
      <div class="summary-row total"><span>Total</span><span>${formatRupees(subtotal + shipping)}</span></div>
      <a class="btn btn-primary btn-block" href="/html/checkout.html" style="margin-top:16px;">Proceed to Checkout</a>
    </div>
  `;

  tableWrap.querySelectorAll('button[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      const id = Number(row.dataset.id);
      const current = cart[id].quantity;
      if (btn.dataset.action === 'inc') CartStore.setQuantity(id, current + 1);
      if (btn.dataset.action === 'dec') CartStore.setQuantity(id, current - 1);
      if (btn.dataset.action === 'remove') CartStore.remove(id);
      render();
    });
  });
}

render();
