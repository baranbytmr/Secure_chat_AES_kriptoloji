class AES {
    constructor(passwordStr, salt, keyLen = 256) {
        this.blockSize = 16;
        this.salt = salt;
        this.keyLen = keyLen;
        this.rounds = Math.floor(this.keyLen / 32) + 6;

        // S-box direct from Python implementation
        this.S_box = new Uint8Array([
            0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
            0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
            0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
            0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
            0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
            0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
            0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
            0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
            0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
            0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
            0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
            0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
            0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
            0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
            0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
            0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
        ]);

        // Generate keys
        const { key, hmacKey } = this.keyGeneration(passwordStr, salt);
        this.key = key;
        this.hmacKey = hmacKey;
        this.keys = this.keyExpansion(this.key, this.rounds);
    }

    keyGeneration(password, salt) {
        // Simple key derivation for demonstration (replace with proper scrypt in production)
        const nBytes = this.keyLen / 8;
        const keyBytes = new Uint8Array(nBytes * 2);

        // Simple key derivation (this should be replaced with proper scrypt implementation)
        for (let i = 0; i < nBytes * 2; i++) {
            keyBytes[i] = (password.charCodeAt(i % password.length) ^
                          salt[i % salt.length]) & 0xFF;
        }

        return {
            key: keyBytes.slice(0, nBytes),
            hmacKey: keyBytes.slice(nBytes)
        };
    }

    keyExpansion(key, rounds) {
    // Generate rcon values
    const rcon = new Array(11).fill().map(() => new Uint8Array(4));
    rcon[1][0] = 1;
    for (let i = 2; i < 11; i++) {
        const prevVal = rcon[i - 1][0];
        const newVal = ((prevVal << 1) ^ (0x11B & -(prevVal >> 7))) & 0xFF;
        rcon[i][0] = newVal;
    }

    // N is the length of the key in 32-bit words
    const N = this.keyLen / 32;
    // R is the number of round keys needed
    const R = rounds + 1;

    // Expanded keys for R rounds in 32-bit words
    const keys = new Array(4 * R).fill().map(() => new Uint8Array(4));

    // Convert key to correct format if necessary
    const keyWords = [];
    for (let i = 0; i < N; i++) {
        keyWords.push(new Uint8Array(key.slice(i * 4, (i + 1) * 4)));
    }

    for (let i = 0; i < 4 * R; i++) {
        if (i < N) {
            keys[i] = keyWords[i];
        } else if (i % N === 0) {
            // Perform operations with explicit type casting and bounds checking
            const temp = new Uint8Array(4);

            // Rotate word
            for (let j = 0; j < 4; j++) {
                temp[j] = keys[i - 1][(j + 1) % 4];
            }

            // SubBytes
            for (let j = 0; j < 4; j++) {
                temp[j] = this.S_box[temp[j]];
            }

            // XOR with rcon and previous key word
            for (let j = 0; j < 4; j++) {
                keys[i][j] = ((temp[j] ^ rcon[Math.floor(i / N)][j] ^ keys[i - N][j]) & 0xFF);
            }
        } else if (N > 6 && i % N === 4) {
            // Additional transformation for 256-bit keys
            const temp = new Uint8Array(4);
            for (let j = 0; j < 4; j++) {
                temp[j] = this.S_box[keys[i - 1][j]];
                keys[i][j] = ((temp[j] ^ keys[i - N][j]) & 0xFF);
            }
        } else {
            // Simple XOR with previous and N-previous key words
            for (let j = 0; j < 4; j++) {
                keys[i][j] = ((keys[i - N][j] ^ keys[i - 1][j]) & 0xFF);
            }
        }
    }

    // Split keys for each round and transpose
    const roundKeys = new Array(R);
    for (let i = 0; i < R; i++) {
        const roundKey = new Uint8Array(16);
        for (let j = 0; j < 4; j++) {
            for (let k = 0; k < 4; k++) {
                roundKey[k * 4 + j] = keys[i * 4 + j][k];
            }
        }
        roundKeys[i] = roundKey;
    }

    return roundKeys;
}

    subBytes(state) {
        const result = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            result[i] = this.S_box[state[i]];
        }
        return result;
    }

    shiftRows(state) {
        // Convert to 4x4 matrix
        const matrix = new Uint8Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                matrix[i * 4 + ((j + i) % 4)] = state[i * 4 + j];
            }
        }
        return matrix;
    }

    mixColumns(state) {
        const result = new Uint8Array(16);
        for (let i = 0; i < 4; i++) {
            const col = state.slice(i * 4, (i + 1) * 4);
            // Galois Field multiplication
            result[i * 4] = this.gmul(0x02, col[0]) ^ this.gmul(0x03, col[1]) ^ col[2] ^ col[3];
            result[i * 4 + 1] = col[0] ^ this.gmul(0x02, col[1]) ^ this.gmul(0x03, col[2]) ^ col[3];
            result[i * 4 + 2] = col[0] ^ col[1] ^ this.gmul(0x02, col[2]) ^ this.gmul(0x03, col[3]);
            result[i * 4 + 3] = this.gmul(0x03, col[0]) ^ col[1] ^ col[2] ^ this.gmul(0x02, col[3]);
        }
        return result;
    }

    // Galois Field multiplication
    gmul(a, b) {
        let p = 0;
        for (let i = 0; i < 8; i++) {
            if ((b & 1) !== 0) {
                p ^= a;
            }
            const hi_bit_set = (a & 0x80) !== 0;
            a <<= 1;
            if (hi_bit_set) {
                a ^= 0x1b;
            }
            b >>= 1;
        }
        return p & 0xff;
    }

    addRoundKey(state, roundKey) {
        const result = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            result[i] = state[i] ^ roundKey[i];
        }
        return result;
    }

    encrypt(plaintext) {
        let state = new Uint8Array(plaintext);

        // Initial round
        state = this.addRoundKey(state, this.keys[0]);

        // Main rounds
        for (let round = 1; round < this.rounds; round++) {
            state = this.subBytes(state);
            state = this.shiftRows(state);
            state = this.mixColumns(state);
            state = this.addRoundKey(state, this.keys[round]);
        }

        // Final round (no mixColumns)
        state = this.subBytes(state);
        state = this.shiftRows(state);
        state = this.addRoundKey(state, this.keys[this.rounds]);

        return state;
    }
}

class CTR {
    constructor(cipher, nonce) {
        this.cipher = cipher;
        this.nonce = nonce;
    }

    encrypt(dataBlock, counter) {
        const counterBytes = new Uint8Array(6);
        for (let i = 0; i < 6; i++) {
            counterBytes[5 - i] = counter & 0xff;
            counter >>= 8;
        }

        const iv = new Uint8Array(16);
        iv.set(this.nonce);
        iv.set(counterBytes, this.nonce.length);

        const encryptedBlock = this.cipher.encrypt(iv);
        return this.xor(encryptedBlock, dataBlock);
    }

    decrypt(cipherBlock, counter) {
        return this.encrypt(cipherBlock, counter);
    }

    xor(data1, data2) {
        const minLen = Math.min(data1.length, data2.length);
        const result = new Uint8Array(minLen);
        for (let i = 0; i < minLen; i++) {
            result[i] = data1[i] ^ data2[i];
        }
        return result;
    }
}