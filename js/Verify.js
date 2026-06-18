// ── Account verification page (email link status + phone OTP) ─────────────────
const API_BASE = window.location.origin;

const params  = new URLSearchParams(window.location.search);
const email   = params.get("email") || "";
const devOtp  = params.get("dev_otp");

// ── DOM refs ──
const emailAddr      = document.getElementById("emailAddr");
const otpForm        = document.getElementById("otpForm");
const otpInput       = document.getElementById("otp");
const errorMessage   = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");
const verifyBtn      = document.getElementById("verifyBtn");
const resendBtn      = document.getElementById("resendBtn");
const devOtpBanner   = document.getElementById("devOtpBanner");
const devOtpValue    = document.getElementById("devOtpValue");

emailAddr.textContent = email;

// Show the dev OTP (only present when no SMS provider is configured)
if (devOtp) {
  devOtpValue.textContent = devOtp;
  devOtpBanner.classList.remove("hidden");
}

// Digits only in the OTP box
otpInput.addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "").slice(0, 6);
});

function showError(msg) {
  successMessage.classList.add("hidden");
  errorMessage.textContent = msg;
  errorMessage.classList.remove("hidden");
}
function showSuccess(msg) {
  errorMessage.classList.add("hidden");
  successMessage.textContent = msg;
  successMessage.classList.remove("hidden");
}

if (!email) {
  showError("Missing account email. Please sign up again.");
}

// ── Verify phone OTP ──
otpForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  const otp = otpInput.value.trim();
  if (otp.length !== 6) return showError("Enter the 6-digit code.");

  verifyBtn.disabled = true;
  verifyBtn.textContent = "Verifying…";

  try {
    const res = await fetch(`${API_BASE}/api/auth/verify-phone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      let detail = data.detail;
      if (Array.isArray(detail)) detail = detail.map((d) => d.msg).join(" ");
      throw new Error(detail || "Verification failed.");
    }

    showSuccess("Phone verified! If you've also clicked the email link, you can now log in.");
    document.getElementById("phoneStatusIcon").textContent = "✅";
    setTimeout(() => { window.location.href = "../html/Login.html"; }, 1500);

  } catch (err) {
    showError(err.message);
  } finally {
    verifyBtn.disabled = false;
    verifyBtn.textContent = "Verify phone";
  }
});

// ── Resend email link + SMS code ──
resendBtn.addEventListener("click", async function () {
  resendBtn.disabled = true;
  resendBtn.textContent = "Sending…";
  try {
    const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.dev_otp) {
      devOtpValue.textContent = data.dev_otp;
      devOtpBanner.classList.remove("hidden");
    }
    showSuccess("Sent! Check your email and your phone.");
  } catch (err) {
    showError("Could not resend right now. Please try again.");
  } finally {
    resendBtn.disabled = false;
    resendBtn.textContent = "Resend code & email";
  }
});
