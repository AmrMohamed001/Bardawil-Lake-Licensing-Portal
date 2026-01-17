/**
 * Main Client-Side Script
 * Handles API interactions using Axios and updates the UI
 */

const API_URL = '/api/v1';

// Axios Instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for Cookies
});

// Expose api to window for use in other scripts
window.api = api;

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor for auto token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for login/register/refresh endpoints
      if (
        originalRequest.url.includes('/auth/login') ||
        originalRequest.url.includes('/auth/register') ||
        originalRequest.url.includes('/auth/refresh-token')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Wait for the refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const response = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          {
            withCredentials: true,
          }
        );

        if (response.data.status === 'success') {
          processQueue(null, response.data.data.accessToken);
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Helper: Show Alert
const showAlert = (type, message) => {
  const alertDiv = document.createElement('div');
  alertDiv.className = `fixed top-5 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white font-bold z-50 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
};

// LOGIN FORM
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const nationalId = document.getElementById('nationalId').value;
    const password = document.getElementById('password').value;

    try {
      const res = await api.post('/auth/login', { nationalId, password });
      if (res.data.status === 'success') {
        showAlert('success', 'تم تسجيل الدخول بنجاح');
        setTimeout(() => {
          // Redirect based on role (simple check)
          if (res.data.data.user.role === 'admin')
            location.assign('/admin-dashboard');
          else location.assign('/dashboard');
        }, 1500);
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'خطأ في تسجيل الدخول');
    }
  });
}

// REGISTER FORM
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const data = {
      firstNameAr: document.getElementById('firstNameAr').value,
      lastNameAr: document.getElementById('lastNameAr').value,
      nationalId: document.getElementById('nationalId').value,
      phone: document.getElementById('phone').value,
      password: document.getElementById('password').value,
      passwordConfirm: document.getElementById('passwordConfirm').value,
    };

    try {
      const res = await api.post('/auth/register', data);
      if (res.data.status === 'success') {
        showAlert('success', 'تم إنشاء الحساب بنجاح! جاري التوجيه...');
        setTimeout(() => location.assign('/dashboard'), 1500);
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'خطأ في إنشاء الحساب');
    }
  });
}

// LOGOUT
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      const res = await api.post('/auth/logout');
      if (res.data.status === 'success') location.assign('/');
    } catch (err) {
      showAlert('error', 'خطأ في تسجيل الخروج');
    }
  });
}

// NEW LICENSE APPLICATION FORM - Handled in apply.ejs specific script
// Removed generic handler to avoid conflicts
