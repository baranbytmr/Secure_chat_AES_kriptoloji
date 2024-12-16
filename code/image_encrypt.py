import concurrent
import os
from PIL import Image
import binascii
from aes import AES
from ctr import CTR
import secrets
import hmac
import hashlib
def png_to_binary(png_file_path, output_path=None):
    try:
        # Open the PNG file in binary mode
        with open(png_file_path, 'rb') as file:
            # Read the binary data
            binary_data = file.read()

            # Convert binary data to a binary string representation
            binary_string = bin(int.from_bytes(binary_data, byteorder='big'))[2:]

            # Ensure the binary string has 8-bit padding
            binary_string = binary_string.zfill(8 * ((len(binary_string) + 7) // 8))

            # If output path is specified, save to file
            if output_path:
                with open(output_path, 'w') as output_file:
                    output_file.write(binary_string)
                print(f"Binary data saved to {output_path}")

            return binary_string

    except FileNotFoundError:
        print(f"Error: File '{png_file_path}' not found")
        return None
    except Exception as e:
        print(f"Error converting file: {str(e)}")
        return None

def convert_directory(input_dir, output_dir):
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Process all PNG files in the directory
    for filename in os.listdir(input_dir):
        if filename.lower().endswith('.png'):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename.rsplit('.', 1)[0] + '.bin')

            print(f"Converting {filename}...")
            png_to_binary(input_path, output_path)

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

def parallel(func, chunks, salt, IV, count_start):
    counters = range(count_start, len(chunks) + count_start)
    with concurrent.futures.ProcessPoolExecutor() as executor:
        results = executor.map(func, chunks, counters)
        return salt + IV + b"".join(results)
# Example usage
if __name__ == "__main__":
    # Convert a single file
    png_file = "color1.png"
    output_file = "example.bin"

    # Convert single file
    result = png_to_binary(png_file, output_file)
    result =  encrypt_file("password", 16, result)

    # Convert all PNGs in a directory
    input_directory = "png_files"
    output_directory = "binary_files"
    convert_directory(input_directory, output_directory)


