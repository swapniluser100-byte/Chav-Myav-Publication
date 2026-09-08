// public/js/checkout.js
// Cash on Delivery checkout: no payment gateway. Submitting the form places
// the order immediately and redirects to the confirmation page.

function renderSummary() {
  const subtotal = CartStore.subtotalPaise();
  const shipping = subtotal >= 50000 || subtotal === 0 ? 0 : 5000;
  const items = Object.values(CartStore.getAll());

  document.getElementById('checkout-summary').innerHTML = `
    <div class="summary-card">
      ${items
        .map(
          (i) => `<div class="summary-row"><span>${i.title} × ${i.quantity}</span><span>${formatRupees(i.price_paise * i.quantity)}</span></div>`
        )
        .join('')}
      <div class="summary-row"><span>Subtotal</span><span>${formatRupees(subtotal)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${shipping ? formatRupees(shipping) : 'Free'}</span></div>
      <div class="summary-row total"><span>Total (Pay on Delivery)</span><span>${formatRupees(subtotal + shipping)}</span></div>
    </div>
  `;
}

function redirectIfEmptyCart() {
  if (Object.keys(CartStore.getAll()).length === 0) {
    location.href = '/html/cart.html';
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorBox = document.getElementById('checkout-error');
  errorBox.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Placing your order...';

  const customer = {
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    email: form.email.value.trim() || undefined,
    address1: form.address1.value.trim(),
    address2: form.address2.value.trim(),
    city: form.city.value.trim(),
    state: form.state.value.trim(),
    pincode: form.pincode.value.trim(),
  };

  const items = Object.values(CartStore.getAll()).map((i) => ({ bookId: i.bookId, quantity: i.quantity }));

  try {
    const result = await Api.createOrder({ customer, items });
    CartStore.clear();
    location.href = `/html/order-success.html?order=${result.orderNumber}`;
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Place Order (Cash on Delivery)';
  }
}

redirectIfEmptyCart();
renderSummary();
document.getElementById('checkout-form').addEventListener('submit', handleSubmit);
