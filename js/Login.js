// ── Base URL for the FastAPI backend ──────────────────────────────────────────
const API_BASE = window.location.origin;

// ── Close session automatically (Logout) ──────────────────────────────────────
localStorage.removeItem("access_token");
localStorage.removeItem("token_type");
localStorage.removeItem("user");

// ── Password visibility toggle ────────────────────────────────────────────────
const passwordInput  = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const eyeIcon        = document.getElementById("eyeIcon");

togglePassword.addEventListener("click", function () {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  eyeIcon.innerHTML = isPassword
    ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.978 9.978 0 012.042-3.362m1.528-1.68A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.978 9.978 0 01-4.422 5.362M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />'
    : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />';
});

// ── Login form submission ─────────────────────────────────────────────────────
const loginForm    = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");
const loginBtn     = document.getElementById("loginBtn");

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = passwordInput.value;

  // Clear previous error
  errorMessage.textContent = "";
  errorMessage.classList.add("hidden");

  // Button loading state
  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in…";

  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Show the detail message returned by FastAPI (e.g. "Incorrect username or password.")
      throw new Error(data.detail || "Login failed. Please try again.");
    }

    // ── Success: persist token & user info ─────────────────────────────────
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("token_type",   data.token_type ?? "bearer");
    localStorage.setItem("user",         JSON.stringify(data.user));

    // Redirect to the main dashboard / home page
    window.location.href = "../html/dashboard.html";

  } catch (err) {
    errorMessage.textContent = err.message;
    errorMessage.classList.remove("hidden");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
});