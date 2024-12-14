class Authentication {
    constructor() {
        // Check if already logged in
        this.checkExistingSession();
        
        this.loginForm = document.getElementById('loginForm');
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    checkExistingSession() {
        const session = localStorage.getItem('currentSession');
        if (session) {
            const sessionData = JSON.parse(session);
            if (sessionData.isAuthenticated) {
                window.location.href = 'chat.html';
            }
        }
    }

    handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        // For demo purposes, using hardcoded credentials
        if (username === "Barcanito" && password === "123456") {
            // Create session
            const sessionData = {
                username: username,
                isAuthenticated: true,
                loginTime: new Date().toISOString()
            };

            // Save to localStorage
            localStorage.setItem('currentSession', JSON.stringify(sessionData));

            // Redirect to chat page
            window.location.href = 'chat.html';
        } else {
            alert('Invalid credentials. Please try again.');
        }
    }
}

// Initialize only if we're on the login page
if (document.getElementById('loginForm')) {
    new Authentication();
}