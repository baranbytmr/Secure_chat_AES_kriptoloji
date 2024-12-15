# Client (client.py)
import socket
import threading
from cryptography.fernet import Fernet


class ChatClient:
    def __init__(self, username, host='127.0.0.1', port=5555):
        self.username = username
        self.client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.client.connect((host, port))

        # Generate encryption key
        self.fernet_key = Fernet.generate_key()
        self.cipher_suite = Fernet(self.fernet_key)

        # Send key to server
        self.client.send(self.fernet_key)
        print("Connected to server and sent encryption key")

    def receive_messages(self):
        while True:
            try:
                encrypted_message = self.client.recv(1024)
                if encrypted_message:
                    # Decrypt the message
                    decrypted_message = self.cipher_suite.decrypt(encrypted_message)
                    print(decrypted_message.decode())
            except Exception as e:
                print(f"Error receiving message: {str(e)}")
                break

    def send_message(self, message):
        try:
            full_message = f"{self.username}: {message}"
            encrypted_message = self.cipher_suite.encrypt(full_message.encode())
            self.client.send(encrypted_message)
        except Exception as e:
            print(f"Error sending message: {str(e)}")

    def start(self):
        # Start receiving messages in a separate thread
        receive_thread = threading.Thread(target=self.receive_messages)
        receive_thread.daemon = True
        receive_thread.start()

        # Main loop for sending messages
        try:
            while True:
                message = input("")
                if message.lower() == 'quit':
                    break
                self.send_message(message)
        except KeyboardInterrupt:
            print("\nDisconnecting from server...")
        finally:
            self.client.close()


if __name__ == "__main__":
    username = input("Enter your username: ")
    client = ChatClient(username)
    print(f"Connected as {username}. Type your messages (type 'quit' to exit)")
    client.start()