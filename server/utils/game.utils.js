import Room from "../models/room.model.js";
import { activeRooms } from "../logic/room.js";
import CryptoJS from "crypto-js";

export const SaveGameInDb = async (roomid, roomData) => {
  try {
    if (!roomid || !roomData) {
      return "Invalid room data";
    }

    if (!activeRooms.has(roomid)) {
      return "Room not found in memory";
    }

    const newGame = new Room({
      roomid: roomid,
      publicId: roomData?.publicId || null,
      host: roomData?.host,
      players: roomData?.players,
      settings: {
        patterns: roomData.patterns || [],
        schedule: roomData.schedule || null,
        drawno: roomData.drawno || [],
      },
      claimData: roomData.claimData || [],
      isCompleted: roomData?.isCompleted,
      isOngoing: roomData?.isOngoing,
      finishTime: roomData?.finishTime || null,
    });

    await newGame.save();

    return true;
  } catch (err) {
    console.error("Error saving game:", err);
    return "Error saving game";
  }
};

export const SaveExistingGameInDb = async (roomid, roomData) => {
  try {
    if (!roomid || !roomData) {
      return "Invalid room data";
    }

    if (!activeRooms.has(roomid)) {
      return "Room not found in memory";
    }

    const existingGame = await Room.findOne({ roomid: roomid });

    if (!existingGame) {
      return "No existing game found";
    }

    existingGame.players = roomData?.players;
    existingGame.settings = {
      patterns: roomData.patterns || [],
      schedule: roomData.schedule || null,
      drawno: roomData.drawno || [],
    };
    existingGame.claimData = roomData?.claimData;
    existingGame.isCompleted = roomData?.isCompleted;
    existingGame.isOngoing = roomData?.isOngoing;

    await existingGame.save();

    return true;
  } catch (err) {
    // console.error("Error saving existing game:", err);
    return "Error saving existing game";
  }
};

const SECRET_KEY = CryptoJS.enc.Utf8.parse("12345678901234567890123456789012"); // exactly 32 chars for AES-256

// Encrypt function
export function textToHash(text) {
  const iv = CryptoJS.lib.WordArray.random(16); // 16 bytes = 128-bit IV
  const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const encryptedText = CryptoJS.enc.Base64url.stringify(encrypted.ciphertext);
  const ivString = CryptoJS.enc.Base64url.stringify(iv);

  return `${ivString}:${encryptedText}`;
}

// Decrypt function
export function hashToText(hash) {
  if (typeof hash !== "string" || !hash.includes(":")) return "";

  const [ivBase64url, encryptedBase64url] = hash.split(":");
  const iv = CryptoJS.enc.Base64url.parse(ivBase64url);
  const encryptedHexStr = CryptoJS.enc.Base64url.parse(encryptedBase64url);

  const encrypted = CryptoJS.lib.CipherParams.create({
    ciphertext: encryptedHexStr,
  });

  const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8); // Returns "" if decryption fails
}
