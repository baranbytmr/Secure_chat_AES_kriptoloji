class Authentication {
    constructor() {
        this.checkExistingSession();
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');

        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        if (this.registerForm) {
            this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
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

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        // Admin account check
        if (username === 'admin' && password === 'admin123') {
            this.createSession(username);
            return;
        }

        // Regular user login (simplified for demo)
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.username === username && u.password === password);
            if (user) {
                this.createSession(username);
            } else {
                alert('Invalid credentials. Please try again.');
            }
        } catch (error) {
            console.error('Login Error:', error);
            alert('Login failed. Please try again.');
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (username.length < 3) {
            alert('Username must be at least 3 characters long!');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters long!');
            return;
        }

        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            users.push({ username, password });
            localStorage.setItem('users', JSON.stringify(users));

            alert('Registration successful! Please login.');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Registration Error:', error);
            alert('Registration failed. Please try again.');
        }
    }

    createSession(username) {
        const sessionData = {
            username,
            isAuthenticated: true,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('currentSession', JSON.stringify(sessionData));
        localStorage.setItem('username', username);
        window.location.href = 'chat.html';
    }

    logout() {
        localStorage.removeItem('currentSession');
        window.location.href = 'login.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Authentication();
});