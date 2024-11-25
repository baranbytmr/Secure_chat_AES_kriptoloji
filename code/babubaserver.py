import socket

HOST = "127.0.0.1"
PORT = 5000

def start_server():
    """Start the chat server."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server_socket:
        server_socket.bind((HOST, PORT))
        server_socket.listen()
        print(f"Server listening on {HOST}:{PORT}")
        while True:
            conn, addr = server_socket.accept()
            with conn:
                print(f"Connection established with {addr}")
                data = conn.recv(1024).decode('utf-8')
                print(f"Received data:\n{data}")
                conn.sendall(b"Log received successfully.")

if __name__ == '__main__':
    start_server()
