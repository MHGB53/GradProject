// ── Base URL for the FastAPI backend ──────────────────────────────────────────
const API_BASE = window.location.origin;

// ── Clear any existing session so registration starts fresh ───────────────────
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

// ── Sign up form submission ───────────────────────────────────────────────────
const signupForm     = document.getElementById("signupForm");
const errorMessage   = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");
const signupBtn      = document.getElementById("signupBtn");

function showError(msg) {
  successMessage.classList.add("hidden");
  errorMessage.textContent = msg;
  errorMessage.classList.remove("hidden");
}

// ── Validation rules (mirror the backend) ─────────────────────────────────────
const STUDENT_ID_RE = /^4\d{7}$/;                              // 8 digits, starts with 4
const ACU_EMAIL_RE  = /^(\d{8})\.[A-Za-z]+(?:\.[A-Za-z]+)*@acu\.edu\.eg$/;
const PHONE_RE      = /^\+?\d{10,15}$/;

// Keep the Student ID field digits-only for a smoother experience
document.getElementById("student_id").addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "").slice(0, 8);
});

signupForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const full_name        = document.getElementById("full_name").value.trim();
  const username         = document.getElementById("username").value.trim();
  const student_id       = document.getElementById("student_id").value.trim();
  const email            = document.getElementById("email").value.trim();
  const phone_number     = document.getElementById("phone_number").value.trim().replace(/\s/g, "");
  const password         = passwordInput.value;
  const confirm_password = document.getElementById("confirm_password").value;

  // Clear previous messages
  errorMessage.classList.add("hidden");
  successMessage.classList.add("hidden");

  // ── Client-side validation (mirrors backend constraints) ────────────────────
  if (username.length < 3) {
    return showError("Username must be at least 3 characters.");
  }
  if (!STUDENT_ID_RE.test(student_id)) {
    return showError(`Invalid ID. The student ID must be exactly 8 digits and start with 4 (you entered "${student_id}").`);
  }
  const emailMatch = ACU_EMAIL_RE.exec(email);
  if (!emailMatch) {
    return showError("Email must be a valid university address like 42210134.Name@acu.edu.eg");
  }
  if (emailMatch[1] !== student_id) {
    return showError("The student ID inside the email does not match the Student ID field.");
  }
  if (!PHONE_RE.test(phone_number)) {
    return showError("Enter a valid phone number (10–15 digits, optionally starting with +).");
  }
  if (password.length < 8) {
    return showError("Password must be at least 8 characters.");
  }
  if (password !== confirm_password) {
    return showError("Passwords do not match.");
  }

  // Button loading state
  signupBtn.disabled = true;
  signupBtn.textContent = "Creating account…";

  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        full_name: full_name || null,
        student_id,
        phone_number,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // FastAPI validation errors come back as an array under `detail`
      let detail = data.detail;
      if (Array.isArray(detail)) {
        detail = detail.map((d) => d.msg).join(" ");
      }
      throw new Error(detail || "Sign up failed. Please try again.");
    }

    // ── Success: account created but NOT logged in until verified ──────────────
    successMessage.textContent = "Account created! Redirecting to verification…";
    successMessage.classList.remove("hidden");

    // Pass the email (and dev OTP if present) to the verification page
    const params = new URLSearchParams({ email: data.email });
    if (data.dev_otp) params.set("dev_otp", data.dev_otp);

    setTimeout(() => {
      window.location.href = `../html/Verify.html?${params.toString()}`;
    }, 700);

  } catch (err) {
    showError(err.message);
    signupBtn.disabled = false;
    signupBtn.textContent = "Sign Up";
  }
});
