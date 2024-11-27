import asyncio
import websockets
import socket

BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 5000
FRONTEND_PORT = 8000

async def handle_websocket(websocket, path):
    """Handle incoming WebSocket messages and forward to the backend server."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as backend_socket:
        backend_socket.connect((BACKEND_HOST, BACKEND_PORT))
        async for message in websocket:
            print(f"Message from frontend: {message}")
            
            # Forward the message to the backend server
            backend_socket.sendall(message.encode('utf-8'))
            
            # Receive the response from the backend
            response = backend_socket.recv(1024).decode('utf-8')
            print(f"Response from backend: {response}")
            
            # Send the response back to the frontend
            await websocket.send(response)

async def start_server():
    """Start the WebSocket server."""
    print(f"WebSocket server running on ws://127.0.0.1:{FRONTEND_PORT}")
    async with websockets.serve(handle_websocket, "127.0.0.1", FRONTEND_PORT):
        await asyncio.Future()  # Run forever

if __name__ == '__main__':
    asyncio.run(start_server())
