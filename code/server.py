import socket
import threading
from datetime import datetime
import openpyxl

# Initialize the Excel file
def init_excel(file_name='encrypted_messages.xlsx'):
    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet.title = "Messages"
    sheet.append(["Sender", "Encrypted Message", "Timestamp"])
    workbook.save(file_name)

# Function to store an encrypted message
def store_message(sender, encrypted_message, file_name='encrypted_messages.xlsx'):
    workbook = openpyxl.load_workbook(file_name)
    sheet = workbook.active
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sheet.append([sender, encrypted_message, timestamp])
    workbook.save(file_name)


class SecureChatServer:
    def __init__(self, host='10.38.180.254', port=5555):
        self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server.bind((host, port))
        self.clients = {}
        self.keys = {}

    def log_message(self, message, message_type="INFO"):
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] [{message_type}] {message}")
        store_message("Server", message)

    def start(self):
        self.server.listen()
        self.log_message("Server is listening for connections...")
        while True:
            client, address = self.server.accept()
            thread = threading.Thread(target=self.handle_client, args=(client, address))
            thread.start()
            self.log_message(f"Active connections: {threading.active_count() - 1}")

    def handle_client(self, client, address):
        try:
            # Receive client's key
            client_key = client.recv(1024)
            self.keys[address] = client_key
            self.clients[address] = client

            self.log_message(f"New client connected from {address}")
            self.log_message(f"Client encryption key: {client_key.hex()[:20]}...")

            while True:
                encrypted_message = client.recv(1024)
                if not encrypted_message:
                    break
                self.log_message(f"Encrypted message received: {encrypted_message.hex()[:30]}...", "ENCRYPTED")
                self.broadcast(encrypted_message, address)

        except Exception as e:
            self.log_message(f"Error handling client {address}: {str(e)}", "ERROR")
        finally:
            client.close()
            del self.clients[address]
            if address in self.keys:
                del self.keys[address]
            self.log_message(f"Client {address} disconnected")

    def broadcast(self, message, sender_address):
        disconnected_clients = []
        for addr, client in self.clients.items():
            if addr != sender_address:
                try:
                    client.send(message)
                    self.log_message(f"Message forwarded to {addr}", "BROADCAST")
                except:
                    disconnected_clients.append(addr)

        # Clean up disconnected clients
        for addr in disconnected_clients:
            if addr in self.clients:
                del self.clients[addr]
            if addr in self.keys:
                del self.keys[addr]

if __name__ == "__main__":
    init_excel()
    server = SecureChatServer()
    print("=== Secure Chat Server ===")
    print("Server is starting...")
    server.start()