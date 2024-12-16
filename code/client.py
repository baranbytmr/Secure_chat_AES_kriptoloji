# Client (client.py)
import socket
import threading
from aes import AES
from ctr import CTR
import getpass
import secrets
import argparse
import concurrent.futures
import hmac
import hashlib

# from cryptography.fernet import Fernet

blocksize = 16
passwd = ""


class ChatClient:
    def __init__(self, username, host='0.0.0.0', port=5555):
        self.username = username
        self.client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.client.connect((host, port))

        # Generate encryption key
        # self.fernet_key = Fernet.generate_key()
        # self.cipher_suite = Fernet(self.fernet_key)

        # Send key to server
        passwd = getpass.getpass("Enter password: ")
        self.client.send(passwd.encode("utf-8"))
        print("Connected to server and sent encryption key")


    def receive_messages(self):
        while True:
            try:
                encrypted_message = self.client.recv(1024)
                if encrypted_message:
                    # Decrypt the message
                    decrypted_message = decrypt_file_chunks(passwd, blocksize, encrypted_message)
                    print(decrypted_message.decode())
            except Exception as e:
                print(f"Error receiving message: {str(e)}")
                break

    def send_message(self, message):
        try:
            full_message = f"{self.username}: {message}"
            message_bytes = full_message.encode()

            # print(f"Debug - Message length: {len(message_bytes)} bytes")

            encrypted_message = encrypt_file(passwd, blocksize, message_bytes)

            if encrypted_message is not None:
                # print(f"Debug - Encrypted message length: {len(encrypted_message)} bytes")
                self.client.send(encrypted_message)
            else:
                print("Encryption failed - encrypted_message is None")
        except Exception as e:
            print(f"Error sending message: {str(e)}")
            import traceback
            print(traceback.format_exc())

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


def parallel(func, chunks, salt, IV, count_start):
    # Because we're using multiprocessing, CTR counter needs to be pre-computed
    counters = range(count_start, len(chunks) + count_start)
    with concurrent.futures.ProcessPoolExecutor() as executor:
        results = executor.map(func, chunks, counters)
        return salt + IV + b"".join(results)


def decrypt_file_chunks(passwd, block_size, file_in):
    salt = file_in[0:block_size]

    # Extract nonce from the first 10 bytes of the second block of the ciphertext
    nonce = file_in[block_size: block_size + 10]

    # Extract the starting counter value from the next 6 bytes of the ciphertext
    counter = file_in[block_size + 10: block_size + 10 + 6]
    counter = int.from_bytes(counter, "big")

    # Extract the HMAC value from the last 2 blocks of the ciphertext
    hmac_val = file_in[-2 * block_size:]

    # Start AES cipher
    cipher = AES(password_str=passwd, salt=salt, key_len=256)

    # Compare HMAC values (remove the HMAC value from the ciphertext before comparing)
    assert hmac.compare_digest(
        hmac_val,
        hmac.digest(
            key=cipher.hmac_key,
            msg=file_in[: -2 * block_size],
            digest=hashlib.sha256,
        ),
    ), "HMAC check failed."

    # Start CTR mode
    mode = CTR(cipher, nonce)

    # Strip the salt, IV and HMAC from the ciphertext
    file_in = file_in[2 * block_size: -2 * block_size]

    # Preparing file_in chunks to be passed into multiprocessing
    # Stripping the IV which is the first block of the ciphertext
    chunks = [
        file_in[i: i + block_size] for i in range(0, len(file_in), block_size)
    ]

    file_out = parallel(mode.decrypt, chunks, b"", b"", counter)
    return file_out


def encrypt_file(passwd, block_size, file_in):
    try:
        # print(f"Debug - Starting encryption of {len(file_in)} bytes")

        # Generate salt and nonce
        salt = secrets.token_bytes(block_size)
        nonce = secrets.token_bytes(10)
        counter = 0

        # print(f"Debug - Salt length: {len(salt)}, Nonce length: {len(nonce)}")

        IV = nonce + counter.to_bytes(6, "big")
        # print(f"Debug - IV length: {len(IV)}")

        # Initialize cipher
        cipher = AES(password_str=passwd, salt=salt, key_len=256)
        mode = CTR(cipher, nonce)

        # Prepare chunks
        chunks = []
        for i in range(0, len(file_in), block_size):
            chunk = file_in[i:i + block_size]
            if len(chunk) < block_size:
                padding = bytes([block_size - len(chunk)] * (block_size - len(chunk)))
                chunk = chunk + padding
            chunks.append(chunk)

        # print(f"Debug - Number of chunks: {len(chunks)}")

        try:
            file_out = parallel(mode.encrypt, chunks, salt, IV, counter)
            # print(f"Debug - Parallel encryption complete, output length: {len(file_out)}")
        except Exception as e:
            # print(f"Debug - Parallel encryption failed: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return None

        # Generate and append HMAC
        try:
            hmac_val = hmac.digest(key=cipher.hmac_key, msg=file_out, digest=hashlib.sha256)
            #  print(f"Debug - HMAC generated, length: {len(hmac_val)}")
            file_out += hmac_val
            return file_out
        except Exception as e:
            # print(f"Debug - HMAC generation failed: {str(e)}")
            return None

    except Exception as e:
        # print(f"Debug - Encryption failed in main try block: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return None


if __name__ == "__main__":
    username = input("Enter your username: ")
    client = ChatClient(username)
    print(f"Connected as {username}. Type your messages (type 'quit' to exit)")
    client.start()