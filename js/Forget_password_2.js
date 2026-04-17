
// Strict single digit validation for OTP inputs
const otpInputs = document.querySelectorAll('#otp-container input, [maxlength="1"]');
otpInputs.forEach(input => {
    input.addEventListener('input', function (e) {
        // Only allow digits
        this.value = this.value.replace(/[^0-9]/g, '');
        // Limit to 1 digit
        if (this.value.length > 1) {
            this.value = this.value.slice(0, 1);
        }
    });

    // Prevent pasting multiple digits
    input.addEventListener('paste', function (e) {
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


// Authentication verification logic
document.addEventListener('DOMContentLoaded', () => {
    // Find the Verify button
    const verifyBtn = document.querySelector('button.w-full.bg-primary');
    const resendLink = document.querySelector('a.text-blue-500');

    if (verifyBtn) {
        verifyBtn.addEventListener('click', async () => {
            const errorElement = document.getElementById('error-message');
            errorElement.classList.add('hidden');
            errorElement.textContent = '';

            const email = localStorage.getItem('reset_email');
            if (!email) {
                errorElement.textContent = 'No email found in session. Please start again.';
                errorElement.classList.remove('hidden');
                setTimeout(() => { window.location.href = 'Forget_password_1.html'; }, 2000);
                return;
            }

            // Collect OTP
            const inputs = document.querySelectorAll('#otp-container input');
            let otp = '';
            inputs.forEach(input => {
                otp += input.value;
            });

            if (otp.length !== 6) {
                errorElement.textContent = 'Please enter all 6 digits of the OTP.';
                errorElement.classList.remove('hidden');
                return;
            }

            const originalText = verifyBtn.textContent;
            verifyBtn.textContent = 'Verifying...';
            verifyBtn.disabled = true;

            try {
                const response = await fetch('/api/auth/verify-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: email, otp: otp })
                });

                const data = await response.json();

                if (response.ok) {
                    // Success! Store the reset token securely
                    localStorage.setItem('reset_token', data.reset_token);
                    window.location.href = 'Forget_password_3.html';
                } else {
                    errorElement.textContent = data.detail || 'Invalid OTP. Please try again.';
                    errorElement.classList.remove('hidden');
                    verifyBtn.textContent = originalText;
                    verifyBtn.disabled = false;
                }
            } catch (error) {
                console.error('Error:', error);
                errorElement.textContent = 'A network error occurred. Please try again.';
                errorElement.classList.remove('hidden');
                verifyBtn.textContent = originalText;
                verifyBtn.disabled = false;
            }
        });
    }

    if (resendLink) {
        resendLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = localStorage.getItem('reset_email');
            if (!email) {
                alert('Session expired. Please start again.');
                window.location.href = 'Forget_password_1.html';
                return;
            }

            try {
                const response = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                });

                if (response.ok) {
                    alert('A new OTP has been sent to your email.');
                } else {
                    const data = await response.json();
                    alert(data.detail || 'Failed to resend OTP.');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }
});