// public/js/cart-store.js
// Simple localStorage cart: { [bookId]: { bookId, title, author, price_paise, cover_image_url, quantity } }

const CART_KEY = 'cmp_cart_v1';

const CartStore = {
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || {};
    } catch {
      return {};
    }
  },

  save(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    CartStore.updateBadge();
  },

  add(book, quantity = 1) {
    const cart = CartStore.getAll();
    if (cart[book.id]) {
      cart[book.id].quantity += quantity;
    } else {
      cart[book.id] = {
        bookId: book.id,
        title: book.title,
        author: book.author,
        price_paise: book.price_paise,
        cover_image_url: book.cover_image_url,
        quantity,
      };
    }
    CartStore.save(cart);
  },

  setQuantity(bookId, quantity) {
    const cart = CartStore.getAll();
    if (!cart[bookId]) return;
    if (quantity <= 0) {
      delete cart[bookId];
    } else {
      cart[bookId].quantity = quantity;
    }
    CartStore.save(cart);
  },

  remove(bookId) {
    const cart = CartStore.getAll();
    delete cart[bookId];
    CartStore.save(cart);
  },

  clear() {
    localStorage.removeItem(CART_KEY);
    CartStore.updateBadge();
  },

  count() {
    return Object.values(CartStore.getAll()).reduce((sum, item) => sum + item.quantity, 0);
  },

  subtotalPaise() {
    return Object.values(CartStore.getAll()).reduce((sum, item) => sum + item.price_paise * item.quantity, 0);
  },

  updateBadge() {
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = CartStore.count();
    });
  },
};

document.addEventListener('DOMContentLoaded', () => CartStore.updateBadge());
