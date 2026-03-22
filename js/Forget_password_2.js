
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



const otpContainer = document.getElementById('otp-container');
    const inputs = [...otpContainer.children];
    inputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          inputs[index - 1].focus();
        } else if (e.key === 'ArrowLeft' && index > 0) {
          inputs[index - 1].focus();
        } else if (e.key === 'ArrowRight' && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });
    });