class CTR:
    def __init__(self, cipher, nonce):
        # Nonce will be half of the block_size of the cipher
        self.cipher = cipher
        self.nonce = nonce

    def encrypt(self, data_block, counter):
        try:
           # print(f"Debug - CTR encrypting block of size {len(data_block)}")
            counter_bytes = counter.to_bytes(6, byteorder="big")
            IV = self.nonce + counter_bytes

            if len(data_block) != self.cipher.block_size:
            #    print(f"Debug - Block size mismatch: got {len(data_block)}, expected {self.cipher.block_size}")
                data_block = data_block.ljust(self.cipher.block_size, b'\0')

            encrypted_block = self.cipher.encrypt(IV)
            result = self._xor(encrypted_block, data_block)
            #print(f"Debug - Block encryption complete, output size: {len(result)}")
            return result
        except Exception as e:
           # print(f"Debug - CTR encryption error: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return None

    def _xor(self, data_1, data_2):
        try:
            # Ensure both inputs are the same length
            min_len = min(len(data_1), len(data_2))
            return bytes(a ^ b for a, b in zip(data_1[:min_len], data_2[:min_len]))
        except Exception as e:
            print(f"XOR error: {str(e)}")
            return None

    def decrypt(self, cipher_block, counter):
        # Decryption is the same as encryption, but using cipher_block instead
        return self.encrypt(cipher_block, counter)