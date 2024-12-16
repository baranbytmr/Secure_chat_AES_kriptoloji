import os
import binascii
from PIL import Image
import io


def binary_to_png(binary_file_path, output_path):
    try:
        # Read the binary string from file
        with open(binary_file_path, 'r') as file:
            binary_string = file.read().strip()

        # Make sure the binary string length is a multiple of 8
        padding = len(binary_string) % 8
        if padding:
            binary_string = '0' * (8 - padding) + binary_string

        # Convert binary string to bytes
        byte_data = int(binary_string, 2).to_bytes((len(binary_string) + 7) // 8, byteorder='big')

        # Write the bytes to the output PNG file
        with open(output_path, 'wb') as png_file:
            png_file.write(byte_data)

        print(f"Successfully converted {binary_file_path} to {output_path}")

    except FileNotFoundError:
        print(f"Error: File '{binary_file_path}' not found")
    except Exception as e:
        print(f"Error converting file: {str(e)}")


def convert_directory(input_dir, output_dir):
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Process all binary files in the directory
    for filename in os.listdir(input_dir):
        if filename.lower().endswith('.bin'):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename.rsplit('.', 1)[0] + '.png')

            print(f"Converting {filename}...")
            binary_to_png(input_path, output_path)


# Example usage
if __name__ == "__main__":
    # Convert a single file
    binary_file = "example.bin"
    output_png = "restored_example.png"

    # Convert single file
    binary_to_png(binary_file, output_png)

    # Convert all binary files in a directory
    input_directory = "binary_files"
    output_directory = "restored_pngs"
    convert_directory(input_directory, output_directory)