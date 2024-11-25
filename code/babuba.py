import socket
import time

CHAT_LOG_FILE = "chat_log.txt"
SERVER_HOST = "127.0.0.1"
SERVER_PORT = 5000

def read_chat_log():
    """Read the chat log and send to the server."""
    with open(CHAT_LOG_FILE, 'r') as file:
        return file.read()

def send_to_server(message):
    """Send the message to the server."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as client_socket:
        client_socket.connect((SERVER_HOST, SERVER_PORT))
        client_socket.sendall(message.encode('utf-8'))
        response = client_socket.recv(1024).decode('utf-8')
        print(f"Server response: {response}")

if __name__ == '__main__':
    while True:
        try:
            logs = read_chat_log()
            send_to_server(logs)
            time.sleep(10)  # Send logs every 10 seconds
        except FileNotFoundError:
            print(f"{CHAT_LOG_FILE} not found. Waiting...")
            time.sleep(10)
        except Exception as e:
            print(f"Error: {e}")
            break
