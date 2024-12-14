class ChatWebSocket {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000; // 3 seconds
        this.handlers = {};
        
        this.init();
    }

    init() {
        // Replace with your WebSocket server URL
        const wsUrl = 'ws://localhost:8080';
        
        try {
            this.socket = new WebSocket(wsUrl);
            this.setupEventListeners();
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.attemptReconnect();
        }
    }

    setupEventListeners() {
        this.socket.addEventListener('open', () => {
            console.log('WebSocket connection established');
            this.reconnectAttempts = 0;
            
            // Send authentication data
            this.send('auth', {
                username: 'Barcanito',
                timestamp: new Date().toISOString()
            });
        });

        this.socket.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        });

        this.socket.addEventListener('close', () => {
            console.log('WebSocket connection closed');
            this.attemptReconnect();
        });

        this.socket.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.init();
            }, this.reconnectDelay);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    send(type, data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type,
                data,
                timestamp: new Date().toISOString()
            });
            this.socket.send(message);
        } else {
            console.error('WebSocket is not connected');
        }
    }

    handleMessage(message) {
        switch (message.type) {
            case 'chat':
                this.triggerHandler('chat', message.data);
                break;
            case 'user_status':
                this.triggerHandler('status', message.data);
                break;
            case 'error':
                console.error('Server error:', message.data);
                break;
            default:
                console.warn('Unknown message type:', message.type);
        }
    }

    on(event, handler) {
        if (!this.handlers[event]) {
            this.handlers[event] = [];
        }
        this.handlers[event].push(handler);
    }

    triggerHandler(event, data) {
        if (this.handlers[event]) {
            this.handlers[event].forEach(handler => handler(data));
        }
    }

    sendMessage(to, content) {
        this.send('chat', {
            to,
            content,
            from: 'Barcanito'
        });
    }

    sendTypingStatus(to, isTyping) {
        this.send('typing', {
            to,
            isTyping,
            from: 'Barcanito'
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
}

// Create a global instance
window.chatWebSocket = new ChatWebSocket();