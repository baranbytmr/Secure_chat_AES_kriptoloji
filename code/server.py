import asyncio
import websockets
import json
from datetime import datetime
import ssl


class SecureChatServer:
    def __init__(self):
        self.clients = {}  # {websocket: {"username": username, "key": encryption_key}}
        self.messages = []  # Store message history

    async def register(self, websocket, username, encryption_key):
        """Register a new client"""
        self.clients[websocket] = {
            "username": username,
            "key": encryption_key
        }
        await self.notify_user_list()
        self.log_message(f"New client registered: {username}")

    async def unregister(self, websocket):
        """Unregister a client"""
        if websocket in self.clients:
            username = self.clients[websocket]["username"]
            del self.clients[websocket]
            await self.notify_user_list()
            self.log_message(f"Client unregistered: {username}")

    async def notify_user_list(self):
        """Send updated user list to all clients"""
        if self.clients:
            user_list = [{"username": client_info["username"]}
                         for client_info in self.clients.values()]
            user_list_message = json.dumps({
                "type": "user_list",
                "users": user_list
            })
            await self.broadcast(user_list_message)

    async def broadcast(self, message, exclude=None):
        """Broadcast message to all clients except excluded one"""
        disconnected = set()
        for websocket in self.clients:
            if websocket != exclude:
                try:
                    await websocket.send(message)
                except websockets.ConnectionClosed:
                    disconnected.add(websocket)

        # Clean up disconnected clients
        for websocket in disconnected:
            await self.unregister(websocket)

    def log_message(self, message, message_type="INFO"):
        """Log server messages with timestamp"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] [{message_type}] {message}")

    async def handle_message(self, websocket, message_data):
        """Handle incoming messages"""
        try:
            print(f"Received message: {message_data}")
            message = json.loads(message_data)
            message_type = message.get("type", "")

            if message_type == "register":
                await self.register(
                    websocket,
                    message["username"],
                    message["encryption_key"]
                )
                return {"type": "register_response", "status": "success"}

            elif message_type == "chat_message":
                # Forward encrypted message to recipient
                if "recipient" in message and "encrypted_content" in message:
                    forward_message = json.dumps({
                        "type": "chat_message",
                        "from": self.clients[websocket]["username"],
                        "content": message["encrypted_content"]
                    })
                    # Find recipient websocket
                    for client_ws, client_info in self.clients.items():
                        if client_info["username"] == message["recipient"]:
                            await client_ws.send(forward_message)
                            break
                return {"type": "message_response", "status": "delivered"}

            else:
                return {"type": "error", "message": "Unknown message type"}

        except json.JSONDecodeError:
            return {"type": "error", "message": "Invalid JSON format"}
        except Exception as e:
            return {"type": "error", "message": str(e)}

    async def start_server(self, host='0.0.0.0', port=5555):
        """Start the WebSocket server"""
        self.log_message(f"Starting server on {host}:{port}")

        async def serve(websocket):
            try:
                self.log_message(f"New connection from {websocket.remote_address}")
                async for message in websocket:
                    response = await self.handle_message(websocket, message)
                    if response:
                        await websocket.send(json.dumps(response))
            except websockets.ConnectionClosed:
                self.log_message(f"Client disconnected: {websocket.remote_address}")
            finally:
                await self.unregister(websocket)

        async with websockets.serve(serve, host, port):
            self.log_message("Server is running...")
            await asyncio.Future()  # run forever


def main():
    print("=== Secure Chat Server ===")
    server = SecureChatServer()
    try:
        asyncio.run(server.start_server())
    except KeyboardInterrupt:
        print("\nServer shutting down...")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()