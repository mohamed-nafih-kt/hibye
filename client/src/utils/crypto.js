// Utility to handle E2E Encryption using Web Crypto API

// Derives an AES-GCM key from a password and salt using PBKDF2
export async function deriveKey(password, saltString) {
    const enc = new TextEncoder();

    // Hash the salt string (e.g. Chat ID) to get a predictable 16-byte salt buffer
    const saltHashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(saltString));
    const salt = new Uint8Array(saltHashBuffer).slice(0, 16);

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// Encrypts a message returning a base64 encoded ciphertext and IV
export async function encryptMessage(key, messageText) {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedMessage = enc.encode(messageText);

    const ciphertextBuf = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedMessage
    );

    const ciphertextArr = Array.from(new Uint8Array(ciphertextBuf));
    const ciphertextBase64 = btoa(String.fromCharCode.apply(null, ciphertextArr));

    const ivArr = Array.from(iv);
    const ivBase64 = btoa(String.fromCharCode.apply(null, ivArr));

    return { ciphertext: ciphertextBase64, iv: ivBase64 };
}

// Decrypts a base64 encoded payload
export async function decryptMessage(key, encryptedData) {
    try {
        const dec = new TextDecoder();

        // Decode base64 iv
        const ivString = atob(encryptedData.iv);
        const iv = new Uint8Array(ivString.length);
        for (let i = 0; i < ivString.length; i++) {
            iv[i] = ivString.charCodeAt(i);
        }

        // Decode base64 ciphertext
        const ctString = atob(encryptedData.ciphertext);
        const ciphertext = new Uint8Array(ctString.length);
        for (let i = 0; i < ctString.length; i++) {
            ciphertext[i] = ctString.charCodeAt(i);
        }

        const decryptedBuf = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );

        return dec.decode(decryptedBuf);
    } catch (err) {
        console.error('Decryption failed. Incorrect password or tampered message.');
        return null; // Return null on decryption failure
    }
}
