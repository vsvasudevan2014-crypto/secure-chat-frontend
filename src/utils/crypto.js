import CryptoJS from "crypto-js";

export const generateChatKey = (userId1, userId2) => {
  const sortedIds = [userId1, userId2].sort().join("_");

  return CryptoJS.SHA256(sortedIds).toString();
};

export const encryptMessage = (message, chatKey) => {
  return CryptoJS.AES.encrypt(message, chatKey).toString();
};

export const decryptMessage = (encryptedMessage, chatKey) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, chatKey);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

    return decryptedText || encryptedMessage;
  } catch (error) {
    return encryptedMessage;
  }
};