// public/admin/js/login.js
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const errorBox = document.getElementById('login-error');
  errorBox.style.display = 'none';

  try {
    await AdminApi.login(form.email.value.trim(), form.password.value);
    location.href = '/admin/html/dashboard.html';
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.style.display = 'block';
  }
});

// If already logged in, skip straight to the dashboard.
AdminApi.me()
  .then(() => (location.href = '/admin/html/dashboard.html'))
  .catch(() => {});
