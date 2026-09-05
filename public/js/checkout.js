// public/js/checkout.js
// Requires https://checkout.razorpay.com/v1/checkout.js to be loaded on the page.

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
      <div class="summary-row"><span>उप-बेरीज</span><span>${formatRupees(subtotal)}</span></div>
      <div class="summary-row"><span>शिपिंग</span><span>${shipping ? formatRupees(shipping) : 'मोफत'}</span></div>
      <div class="summary-row total"><span>एकूण</span><span>${formatRupees(subtotal + shipping)}</span></div>
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
  submitBtn.textContent = 'प्रक्रिया सुरू आहे...';

  const customer = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    address1: form.address1.value.trim(),
    address2: form.address2.value.trim(),
    city: form.city.value.trim(),
    state: form.state.value.trim(),
    pincode: form.pincode.value.trim(),
  };

  const items = Object.values(CartStore.getAll()).map((i) => ({ bookId: i.bookId, quantity: i.quantity }));

  try {
    const orderResult = await Api.createOrder({ customer, items });

    const rzp = new Razorpay({
      key: orderResult.razorpayKeyId,
      amount: orderResult.amountPaise,
      currency: 'INR',
      name: 'चव म्याव प्रकाशन',
      description: `ऑर्डर #${orderResult.orderNumber}`,
      order_id: orderResult.razorpayOrderId,
      prefill: { name: customer.name, email: customer.email, contact: customer.phone },
      theme: { color: '#8C1F28' },
      handler: async function (response) {
        try {
          await Api.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          CartStore.clear();
          location.href = `/html/order-success.html?order=${orderResult.orderNumber}`;
        } catch (err) {
          errorBox.textContent = err.message;
          errorBox.style.display = 'block';
        }
      },
      modal: {
        ondismiss: function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'पैसे भरा';
        },
      },
    });

    rzp.open();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'पैसे भरा';
  }
}

redirectIfEmptyCart();
renderSummary();
document.getElementById('checkout-form').addEventListener('submit', handleSubmit);
