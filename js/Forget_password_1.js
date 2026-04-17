document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const emailInput = document.getElementById('username');
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        if (!email) {
            alert('Please enter your email.');
            return;
        }

        // Disable button while processing
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email })
            });

            const data = await response.json();

            if (response.ok) {
                // Save email to local storage so the verify page knows who we are verifying
                localStorage.setItem('reset_email', email);
                
                // Redirect to OTP verification page
                window.location.href = 'Forget_password_2.html';
            } else {
                alert(data.detail || 'An error occurred. Please try again.');
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        } catch (error) {
            console.error('Error:', error);
            alert('A network error occurred. Please try again.');
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
});
