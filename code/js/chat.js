class ChatApp {
    constructor() {
        if (!this.checkAuth()) {
            return;
        }

        // Set current user and time
        this.currentUser = {
            username: 'Barcanito',
            avatar: '../assets/images/default-avatar.png',
            loginTime: '2024-12-14 20:33:47'
        };

        // Initialize contacts with messages
        this.contacts = [
            {
                id: 1,
                name: 'John Doe',
                avatar: '../assets/images/default-avatar1.png',
                lastMessage: 'Hey, how are you?',
                lastMessageTime: '20:10',
                online: true,
                messages: [
                    { content: 'Hi Barcanito!', type: 'received', timestamp: '20:05' },
                    { content: 'How are you doing?', type: 'received', timestamp: '20:06' },
                    { content: "Hey John! I'm good, thanks!", type: 'sent', timestamp: '20:08' },
                    { content: 'Hey, how are you?', type: 'received', timestamp: '20:10' }
                ]
            },
            {
                id: 2,
                name: 'Jane Smith',
                avatar: '../assets/images/default-avatar2.png',
                lastMessage: 'See you tomorrow!',
                lastMessageTime: '19:55',
                online: true,
                messages: [
                    { content: 'Did you finish the project?', type: 'received', timestamp: '19:45' },
                    { content: 'Yes, just submitted it', type: 'sent', timestamp: '19:50' },
                    { content: 'Great work!', type: 'received', timestamp: '19:52' },
                    { content: 'See you tomorrow!', type: 'received', timestamp: '19:55' }
                ]
            },
            {
                id: 3,
                name: 'Mike Johnson',
                avatar: '../assets/images/default-avatar3.png',
                lastMessage: 'The meeting is at 3 PM',
                lastMessageTime: '18:30',
                online: false,
                messages: [
                    { content: 'When is the team meeting?', type: 'sent', timestamp: '18:25' },
                    { content: 'The meeting is at 3 PM', type: 'received', timestamp: '18:30' }
                ]
            },
            {
                id: 4,
                name: 'Sarah Wilson',
                avatar: '../assets/images/default-avatar4.png',
                lastMessage: 'Thanks for your help!',
                lastMessageTime: '17:45',
                online: false,
                messages: [
                    { content: 'Can you help me with the code?', type: 'received', timestamp: '17:30' },
                    { content: 'Sure, what do you need?', type: 'sent', timestamp: '17:35' },
                    { content: 'I fixed it now', type: 'received', timestamp: '17:40' },
                    { content: 'Thanks for your help!', type: 'received', timestamp: '17:45' }
                ]
            }
        ];

        this.activeContact = null;
        this.initializeElements();
        this.initializeListeners();
        this.loadUserInfo();
        this.loadContacts();
        this.updateDateTime();
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
    }

    updateDateTime() {
        if (this.dateTimeDisplay) {
            const now = new Date('2024-12-14T20:33:47Z');
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'UTC'
            };
            this.dateTimeDisplay.textContent = now.toLocaleString('en-US', options) + ' UTC';
        }
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
                    <div class="last-message">${contact.lastMessage}</div>
                </div>
                <div class="message-time">${contact.lastMessageTime}</div>
            `;

            contactDiv.addEventListener('click', () => this.selectContact(contact));
            this.contactsList.appendChild(contactDiv);
        });
    }

    selectContact(contact) {
        this.activeContact = contact;
        
        // Update UI
        document.querySelectorAll('.contact-item').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');

        // Update chat header
        if (this.currentChatName) {
            this.currentChatName.textContent = contact.name;
        }
        if (this.currentChatAvatar) {
            this.currentChatAvatar.src = contact.avatar;
        }

        // Load messages
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

    addMessageToChat(content, type, timestamp) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-timestamp';
        messageTime.textContent = timestamp || new Date('2024-12-14T20:33:47Z').toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        this.chatMessages.appendChild(messageDiv);

        // Scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    sendMessage() {
        if (!this.activeContact) {
            alert('Please select a contact first');
            return;
        }

        const message = this.messageInput.value.trim();
        if (!message) return;

        const timestamp = new Date('2024-12-14T20:33:47Z').toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

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
                    <div class="last-message">${contact.lastMessage}</div>
                </div>
                <div class="message-time">${contact.lastMessageTime}</div>
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
}

// Initialize the chat app
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});