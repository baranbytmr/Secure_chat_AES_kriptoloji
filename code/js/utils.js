const ChatUtils = {
    // Time formatting
    formatTime(date) {
        const now = new Date();
        const messageDate = new Date(date);
        
        if (this.isSameDay(now, messageDate)) {
            return messageDate.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else if (this.isYesterday(now, messageDate)) {
            return 'Yesterday';
        } else {
            return messageDate.toLocaleDateString();
        }
    },

    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    },

    isYesterday(today, date) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toDateString() === date.toDateString();
    },

    // Input validation
    validateUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    },

    validatePassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        return passwordRegex.test(password);
    },

    // Message handling
    sanitizeMessage(message) {
        const div = document.createElement('div');
        div.textContent = message;
        return div.innerHTML;
    },

    // Storage utilities
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },

    getFromLocalStorage(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    },

    // User session management
    setUserSession(userData) {
        this.saveToLocalStorage('chat_user_session', {
            ...userData,
            timestamp: new Date().toISOString()
        });
    },

    getUserSession() {
        return this.getFromLocalStorage('chat_user_session');
    },

    clearUserSession() {
        localStorage.removeItem('chat_user_session');
    },

    // UI helpers
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    },

    // Debounce function for typing indicator
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Generate a unique message ID
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // Check if user is online (has active browser window)
    setupOnlineStatus(callback) {
        window.addEventListener('online', () => callback(true));
        window.addEventListener('offline', () => callback(false));
        window.addEventListener('focus', () => callback(true));
        window.addEventListener('blur', () => callback(false));
    }
};

// Export the utilities
window.ChatUtils = ChatUtils;