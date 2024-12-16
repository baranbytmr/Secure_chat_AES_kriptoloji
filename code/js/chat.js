class ChatApp {
    constructor() {
        if (!this.checkAuth()) {
            return;
        }

        // Get user data from session
        const session = JSON.parse(localStorage.getItem('currentSession'));
        this.currentUser = {
            username: session.username,
            avatar: '../assets/images/default-avatar.png',
            loginTime: new Date(session.loginTime)
        };

        this.contacts = [];
        this.activeContact = null;
        this.ws = null;

        this.initializeElements();
        this.initializeListeners();
        this.loadUserInfo();
        this.connectWebSocket();
        this.startTimeUpdate();
    }

    connectWebSocket() {
        try {
            this.ws = new WebSocket('ws://localhost:5555');

            this.ws.onopen = () => {
                console.log('Connected to chat server');
                // Send authentication message
                this.ws.send(JSON.stringify({
                    type: 'auth',
                    username: this.currentUser.username
                }));
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };

            this.ws.onclose = () => {
                console.log('Disconnected from chat server');
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.connectWebSocket(), 5000);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('WebSocket connection error:', error);
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'user_list':
                this.updateContactsList(data.users);
                break;
            case 'message':
                this.handleIncomingMessage(data);
                break;
            case 'user_joined':
                this.addContact(data.username);
                break;
            case 'user_left':
                this.removeContact(data.username);
                break;
        }
    }

    updateContactsList(users) {
        this.contacts = users.filter(user => user !== this.currentUser.username)
            .map(username => ({
                id: username,
                name: username,
                avatar: '../assets/images/default-avatar.png',
                online: true,
                messages: [],
                lastMessage: '',
                lastMessageTime: ''
            }));
        this.loadContacts();
    }

    formatDateTime(date) {
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }

    formatTimeShort(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    startTimeUpdate() {
        setInterval(() => {
            const now = new Date();
            if (this.dateTimeDisplay) {
                this.dateTimeDisplay.textContent = `Current Date and Time (UTC): ${this.formatDateTime(now)}`;
            }
            if (this.loginInfoDisplay) {
                this.loginInfoDisplay.textContent = `Current User's Login: ${this.currentUser.username}`;
            }
        }, 1000);
    }

    initializeElements() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.usernameDisplay = document.getElementById('username-display');
        this.contactsList = document.getElementById('contactsList');
        this.searchInput = document.getElementById('searchContacts');
        this.currentChatName = document.getElementById('currentChatName');
        this.currentChatAvatar = document.getElementById('currentChatAvatar');
        this.dateTimeDisplay = document.getElementById('dateTime');
        this.loginInfoDisplay = document.getElementById('loginInfo');
    }

    initializeListeners() {
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }

        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.logout());
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.filterContacts());
        }
    }

    loadContacts() {
        if (!this.contactsList) return;
        
        this.contactsList.innerHTML = '';
        
        this.contacts.forEach(contact => {
            const contactDiv = document.createElement('div');
            contactDiv.className = 'contact-item';
            if (this.activeContact && this.activeContact.id === contact.id) {
                contactDiv.classList.add('active');
            }

            contactDiv.innerHTML = `
                <div class="online-status ${contact.online ? 'online' : 'offline'}"></div>
                <img src="${contact.avatar}" alt="${contact.name}" class="avatar">
                <div class="contact-info">
                    <div class="contact-name">${contact.name}</div>
                    <div class="last-message">${contact.lastMessage || ''}</div>
                </div>
                <div class="message-time">${contact.lastMessageTime || ''}</div>
            `;

            contactDiv.addEventListener('click', () => this.selectContact(contact));
            this.contactsList.appendChild(contactDiv);
        });
    }

    selectContact(contact) {
        this.activeContact = contact;
        
        document.querySelectorAll('.contact-item').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');

        if (this.currentChatName) {
            this.currentChatName.textContent = contact.name;
        }
        if (this.currentChatAvatar) {
            this.currentChatAvatar.src = contact.avatar;
        }

        this.loadMessages(contact);
    }

    loadMessages(contact) {
        if (!this.chatMessages) return;
        
        this.chatMessages.innerHTML = '';
        
        if (!contact.messages) contact.messages = [];
        
        contact.messages.forEach(message => {
            this.addMessageToChat(message.content, message.type, message.timestamp);
        });
        
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    sendMessage() {
        if (!this.activeContact) {
            alert('Please select a contact first');
            return;
        }

        const message = this.messageInput.value.trim();
        if (!message) return;

        const now = new Date();
        const timestamp = this.formatTimeShort(now);

        // Send message through WebSocket
        this.ws.send(JSON.stringify({
            type: 'message',
            to: this.activeContact.name,
            content: message,
            timestamp: timestamp
        }));

        // Add message to UI and storage
        this.addMessageToChat(message, 'sent', timestamp);

        // Store message
        this.activeContact.messages.push({
            content: message,
            type: 'sent',
            timestamp: timestamp
        });

        // Update last message
        this.activeContact.lastMessage = message;
        this.activeContact.lastMessageTime = timestamp;

        // Clear input
        this.messageInput.value = '';
        
        // Reload contacts to update last message
        this.loadContacts();
    }

    handleIncomingMessage(data) {
        const contact = this.contacts.find(c => c.name === data.from);
        if (contact) {
            contact.messages.push({
                content: data.content,
                type: 'received',
                timestamp: data.timestamp
            });

            contact.lastMessage = data.content;
            contact.lastMessageTime = data.timestamp;

            if (this.activeContact && this.activeContact.id === contact.id) {
                this.addMessageToChat(data.content, 'received', data.timestamp);
            }

            this.loadContacts();
        }
    }

    addMessageToChat(content, type, timestamp) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-timestamp';
        messageTime.textContent = timestamp || this.formatTimeShort(new Date());
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        this.chatMessages.appendChild(messageDiv);

        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    addContact(username) {
        if (!this.contacts.find(c => c.name === username) && username !== this.currentUser.username) {
            this.contacts.push({
                id: username,
                name: username,
                avatar: '../assets/images/default-avatar.png',
                online: true,
                messages: [],
                lastMessage: '',
                lastMessageTime: ''
            });
            this.loadContacts();
        }
    }

    removeContact(username) {
        const index = this.contacts.findIndex(c => c.name === username);
        if (index !== -1) {
            if (this.activeContact && this.activeContact.name === username) {
                this.activeContact = null;
                this.currentChatName.textContent = 'Select a contact';
                this.currentChatAvatar.src = '../assets/images/default-avatar.png';
                this.chatMessages.innerHTML = '';
            }
            this.contacts.splice(index, 1);
            this.loadContacts();
        }
    }

    filterContacts() {
        const searchTerm = this.searchInput.value.toLowerCase();
        
        if (!searchTerm) {
            this.loadContacts();
            return;
        }

        const filteredContacts = this.contacts.filter(contact => 
            contact.name.toLowerCase().includes(searchTerm)
        );
        
        this.contactsList.innerHTML = '';
        filteredContacts.forEach(contact => {
            const contactDiv = document.createElement('div');
            contactDiv.className = 'contact-item';
            if (this.activeContact && this.activeContact.id === contact.id) {
                contactDiv.classList.add('active');
            }

            contactDiv.innerHTML = `
                <div class="online-status ${contact.online ? 'online' : 'offline'}"></div>
                <img src="${contact.avatar}" alt="${contact.name}" class="avatar">
                <div class="contact-info">
                    <div class="contact-name">${contact.name}</div>
                    <div class="last-message">${contact.lastMessage || ''}</div>
                </div>
                <div class="message-time">${contact.lastMessageTime || ''}</div>
            `;

            contactDiv.addEventListener('click', () => this.selectContact(contact));
            this.contactsList.appendChild(contactDiv);
        });
    }

    checkAuth() {
        const session = JSON.parse(localStorage.getItem('currentSession') || '{}');
        if (!session.isAuthenticated) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    loadUserInfo() {
        if (this.usernameDisplay) {
            this.usernameDisplay.textContent = this.currentUser.username;
        }
    }

    logout() {
        if (this.ws) {
            this.ws.close();
        }
        localStorage.removeItem('currentSession');
        window.location.href = 'login.html';
    }
}

// Initialize the chat app
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});