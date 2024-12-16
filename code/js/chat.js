class ChatApp {
    constructor() {
        if (!this.checkAuth()) {
            return;
        }

        // Set current user and time
        this.currentDateTime = new Date(); // Get current date/time
        this.currentUser = {
            username: 'Barcanito',
            avatar: '../assets/images/default-avatar.png',
            loginTime: this.formatDateTime(this.currentDateTime)
        };

        // Initialize contacts
        this.contacts = [
            {
                id: 1,
                name: 'John Doe',
                avatar: '../assets/images/default-avatar1.png',
                lastMessage: 'Hey, how are you?',
                lastMessageTime: this.formatTimeShort(this.currentDateTime),
                online: true,
                messages: [
                    { content: 'Hi Barcanito!', type: 'received', timestamp: this.formatTimeShort(this.currentDateTime) },
                    { content: 'How are you doing?', type: 'received', timestamp: this.formatTimeShort(this.currentDateTime) },
                    { content: "Hey John! I'm good, thanks!", type: 'sent', timestamp: this.formatTimeShort(this.currentDateTime) },
                    { content: 'Hey, how are you?', type: 'received', timestamp: this.formatTimeShort(this.currentDateTime) }
                ]
            },
            {
                id: 2,
                name: 'Jane Smith',
                avatar: '../assets/images/default-avatar2.png',
                lastMessage: 'See you tomorrow!',
                lastMessageTime: this.formatTimeShort(this.currentDateTime),
                online: true,
                messages: [
                    { content: 'Did you finish the project?', type: 'received', timestamp: this.formatTimeShort(this.currentDateTime) },
                    { content: 'Yes, just submitted it', type: 'sent', timestamp: this.formatTimeShort(this.currentDateTime) },
                    { content: 'Great work!', type: 'received', timestamp: this.formatTimeShort(this.currentDateTime) },
                    { content: 'See you tomorrow!', type: 'received', timestamp: this.formatTimeShort(this.currentDateTime) }
                ]
            }
        ];

        // Initialize empty contacts list
        this.contacts = [];
        this.ws = null;
        this.connectToServer();

        this.activeContact = null;
        this.initializeElements();
        this.initializeListeners();
        this.loadUserInfo();
        this.startTimeUpdate();
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
        // Update date time display every second
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

        // Send message to server
        this.sendToServer({
            type: 'chat_message',
            recipient: this.activeContact.name,
            encrypted_content: message // In a real app, you'd encrypt this
        });

        // Add message to UI and storage
        this.addMessageToChat(message, 'sent', timestamp);

        // Store message
        if (!this.activeContact.messages) {
            this.activeContact.messages = [];
        }
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

    handleIncomingMessage(message) {
        const sender = message.from;
        const content = message.content;
        const timestamp = this.formatTimeShort(new Date());

        // Find the contact
        const contact = this.contacts.find(c => c.name === sender);
        if (contact) {
            if (!contact.messages) {
                contact.messages = [];
            }

            // Add message to contact's message history
            contact.messages.push({
                content: content,
                type: 'received',
                timestamp: timestamp
            });

            // Update last message
            contact.lastMessage = content;
            contact.lastMessageTime = timestamp;

            // If this is the active contact, update the chat window
            if (this.activeContact && this.activeContact.name === sender) {
                this.addMessageToChat(content, 'received', timestamp);
            }

            // Reload contacts to update last message
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

        // Scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    filterContacts() {
        const searchTerm = this.searchInput.value.toLowerCase();

        // If search is empty, show all contacts
        if (!searchTerm) {
            this.loadContacts();
            return;
        }

        // Filter contacts based on search term
        const filteredContacts = this.contacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm)
        );

        // Clear and rebuild contacts list
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
        localStorage.removeItem('currentSession');
        window.location.href = 'login.html';
    }

    async connectToServer() {
        try {
            this.ws = new WebSocket('ws://localhost:5555');

            this.ws.onopen = () => {
                console.log('Connected to server');
                // Register user with server
                this.sendToServer({
                    type: 'register',
                    username: this.currentUser.username,
                    encryption_key: 'temporary-key' // You'll want to generate this properly
                });
            };

            this.ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.handleServerMessage(message);
            };

            this.ws.onclose = () => {
                console.log('Disconnected from server');
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.connectToServer(), 5000);
            };
        } catch (error) {
            console.error('Failed to connect:', error);
        }
    }

    handleServerMessage(message) {
        switch (message.type) {
            case 'user_list':
                this.updateContactsList(message.users);
                break;
            case 'chat_message':
                this.handleIncomingMessage(message);
                break;
            case 'register_response':
                if (message.status === 'success') {
                    console.log('Successfully registered with server');
                }
                break;
        }
    }

    updateContactsList(users) {
        // Filter out current user from the users list
        this.contacts = users
            .filter(user => user.username !== this.currentUser.username)
            .map(user => ({
                id: user.username, // Use username as ID
                name: user.username,
                avatar: '../assets/images/default-avatar.png',
                online: true,
                messages: [],
                lastMessage: '',
                lastMessageTime: ''
            }));
        this.loadContacts();
    }

    sendToServer(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

}

// Initialize the chat app
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});