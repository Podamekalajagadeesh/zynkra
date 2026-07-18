
import libsodium from 'libsodium-wrappers';

let sodium: typeof libsodium;

export const initCrypto = async () => {
  if (!sodium) {
    await libsodium.ready;
    sodium = libsodium;
  }
};

export const generateKeyPair = () => {
  const { publicKey, privateKey } = sodium.crypto_box_keypair();
  return {
    publicKey: sodium.to_base64(publicKey),
    privateKey: sodium.to_base64(privateKey),
  };
};

export const encryptMessage = (
  message: string,
  publicKey: string,
  privateKey: string,
) => {
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const ciphertext = sodium.crypto_box_easy(
    message,
    nonce,
    sodium.from_base64(publicKey),
    sodium.from_base64(privateKey),
  );
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);
  return sodium.to_base64(combined);
};

export const decryptMessage = (
  combined: string,
  publicKey: string,
  privateKey: string,
) => {
  const combinedBytes = sodium.from_base64(combined);
  const nonce = combinedBytes.slice(0, sodium.crypto_box_NONCEBYTES);
  const ciphertext = combinedBytes.slice(sodium.crypto_box_NONCEBYTES);
  const decrypted = sodium.crypto_box_open_easy(
    ciphertext,
    nonce,
    sodium.from_base64(publicKey),
    sodium.from_base64(privateKey),
  );
  return sodium.to_string(decrypted);
};