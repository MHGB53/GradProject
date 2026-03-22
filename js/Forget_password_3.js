
// Strict single digit validation for OTP inputs
const otpInputs = document.querySelectorAll('#otp-container input, [maxlength="1"]');
otpInputs.forEach(input => {
    input.addEventListener('input', function(e) {
        // Only allow digits
        this.value = this.value.replace(/[^0-9]/g, '');
        // Limit to 1 digit
        if (this.value.length > 1) {
            this.value = this.value.slice(0, 1);
        }
    });
    
    // Prevent pasting multiple digits
    input.addEventListener('paste', function(e) {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        this.value = pastedText.replace(/[^0-9]/g, '').slice(0, 1);
    });
});



// Toggle password visibility for new password field
  const newPasswordInput = document.getElementById('new-password');
  const toggleNewPassword = document.getElementById('toggleNewPassword');
  const eyeIconNew = document.getElementById('eyeIconNew');
  
  toggleNewPassword.addEventListener('click', function () {
    const isPassword = newPasswordInput.type === 'password';
    newPasswordInput.type = isPassword ? 'text' : 'password';
    eyeIconNew.innerHTML = isPassword
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.978 9.978 0 012.042-3.362m1.528-1.68A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.978 9.978 0 01-4.422 5.362M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />';
  });

  // Toggle password visibility for confirm password field
  const confirmPasswordInput = document.getElementById('confirm-password');
  const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
  const eyeIconConfirm = document.getElementById('eyeIconConfirm');
  
  toggleConfirmPassword.addEventListener('click', function () {
    const isPassword = confirmPasswordInput.type === 'password';
    confirmPasswordInput.type = isPassword ? 'text' : 'password';
    eyeIconConfirm.innerHTML = isPassword
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.978 9.978 0 012.042-3.362m1.528-1.68A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.978 9.978 0 01-4.422 5.362M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />';
  });