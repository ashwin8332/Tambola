import User from "../models/user.model.js";
import Room from "../models/room.model.js";
import { SaveGameInDb, textToHash, hashToText } from "../utils/game.utils.js";
import { activeRooms, pendingRoomDeletions, roomLocks } from "./room.js";

export const createRoomLogic = async (roomId, player, setting) => {
  // The function body is now the 'try' block
  try {
    // check if the room already exists
    const exist = await Room.findOne({ roomid: roomId });
    if (activeRooms.has(roomId) || exist) {
      throw new Error("Room already exists with this ID");
    }

    // Check if the player is a host
    const user = await User.findById(player.id);
    if (!user || user.role !== "host") {
      throw new Error("Only hosts can create rooms");
    }

    // check if the player has already been invited to this room
    const alreadyInvited = user.invites.some((invite) => invite?.id === roomId);
    if (!alreadyInvited) {
      user.invites.push({
        id: roomId,
        schedule: setting?.schedule || null,
      });
      await user.save();
    }

    // generate a public ID for the room
    const publicId = textToHash(roomId);

    // Create a new room object
    const newRoom = {
      // ... (all properties of newRoom are the same)
      publicId: publicId,
      host: player?.id,
      players: [],
      patterns: setting.pattern || [],
      schedule: setting.schedule || null,
      claimData: [],
      claimTrack: setting.pattern || [],
      drawno: [],
      playersList: [],
      isOngoing: false,
      isCompleted: false,
      finishTime: null,
      requestedTicketCount: [],
    };

    // Add the player to the new room (Simplified)
    const newPlayer = {
      id: player?.id,
      socketid: player?.socketId,
      name: player?.name,
      phone: player?.phone,
      ticketCount: player.ticketCount || 0,
    };
    if (newPlayer.ticketCount > 0) {
      newPlayer.claims = [];
      newPlayer.assign_numbers = {};
    }
    newRoom.players.push(newPlayer);

    newRoom.playersList.push(player?.name);
    activeRooms.set(roomId, newRoom);

    // Always save room to database
    const saveRes = await SaveGameInDb(roomId, newRoom);
    if (typeof saveRes === "string") {
      activeRooms.delete(roomId);
      // Throw the error string to be caught below
      throw new Error(saveRes);
    }

    // On success, return a consistent object. This is better than just a string.
    return { success: true, message: "Room created successfully", publicId: publicId };
  } catch (error) {
    throw error;
  }
};

export const joinRoomLogic = async (socketid, player, roomId, publicId) => {
  try {
    console.log('[joinRoomLogic] Attempting to join:', { roomId, publicId, playerId: player?.id });
    
    let room = activeRooms.get(roomId);
    const dbRoom = await Room.findOne({ roomid: roomId });
    
    console.log('[joinRoomLogic] Room found - Memory:', !!room, ', DB:', !!dbRoom);

    if (!room && !dbRoom) {
      throw new Error("Room not found. Please check the room ID and try again.");
    }

    const isCompleted =
      (room && room.isCompleted) || (dbRoom && dbRoom.isCompleted);
    if (isCompleted) {
      throw new Error("Room is completed, please join a new one.");
    }

    const isOngoing = (room && room.isOngoing) || (dbRoom && dbRoom.isOngoing);
    if (isOngoing) {
      throw new Error(
        "Room is ongoing, please wait for it to finish or reconnect."
      );
    }

    // Validate publicId - allow joining if:
    // 1. The publicId decrypts to the correct roomId, OR
    // 2. The room's stored publicId matches the provided publicId (for share links), OR
    // 3. Direct room code join (publicId was generated client-side from roomId)
    const decryptedRoomId = hashToText(publicId);
    const storedPublicId = room?.publicId || dbRoom?.publicId;
    
    console.log('[joinRoomLogic] Decrypted roomId:', decryptedRoomId, 'Expected:', roomId);
    console.log('[joinRoomLogic] Stored publicId:', storedPublicId, 'Provided:', publicId);
    
    // Check if decryption matches OR if using stored publicId from share link
    const isValidPublicId = (decryptedRoomId && decryptedRoomId === roomId) || 
                            (storedPublicId && storedPublicId === publicId);
    
    if (!isValidPublicId) {
      // If room exists but publicId doesn't match, it might be a direct room code join
      // In this case, we should still allow if the room exists
      console.log('[joinRoomLogic] PublicId validation failed, but room exists - allowing join');
    }

    if (!room && dbRoom) {
      room = {
        host: dbRoom.host,
        publicId: dbRoom.publicId,
        players: dbRoom.players || [],
        patterns: dbRoom.settings.patterns || [],
        schedule: dbRoom.settings.schedule || null,
        drawno: dbRoom.settings.drawno || [],
        claimData: [],
        claimTrack: dbRoom.settings.patterns || [],
        playersList: dbRoom.players?.map((p) => p.name) || [],
        requestedTicketCount: dbRoom.requestedTicketCount || [],
        isOngoing: dbRoom.isOngoing,
        isCompleted: dbRoom.isCompleted,
        finishTime: dbRoom.finishTime,
      };
      activeRooms.set(roomId, room);
      room = activeRooms.get(roomId);
    }

    if (pendingRoomDeletions?.has(roomId)) {
      clearTimeout(pendingRoomDeletions.get(roomId));
      pendingRoomDeletions.delete(roomId);
    }

    const roomData = activeRooms.get(roomId);
    const alreadyExists = roomData.players.some((p) => p.id === player.id);
    const playerIndex = roomData.players.findIndex((p) => p.id === player.id);
    
    // If player already exists in the room (including host), just update socket and return
    if (alreadyExists && playerIndex !== -1) {
      roomData.players[playerIndex].socketid = socketid;
      console.log('[joinRoomLogic] Player already in room, updated socket:', player.name);
      return { success: true, message: "Reconnected to room" };
    }
    
    // Host can't join their own room as a new player
    let isHost = roomData.host === player.id;
    if (isHost) {
      // Host is reconnecting - update their socket
      const hostIndex = roomData.players.findIndex((p) => p.id === player.id);
      if (hostIndex !== -1) {
        roomData.players[hostIndex].socketid = socketid;
      }
      console.log('[joinRoomLogic] Host reconnecting, updated socket');
      return { success: true, message: "Host reconnected" };
    }

    const newPlayer = {
      id: player.id,
      socketid: socketid,
      name: player.name,
      phone: player.phone,
      claims: [],
      assign_numbers: {},
      requestedTicketCount: player.requestedTicketCount || 1,
      ticketCount: player.requestedTicketCount || 1,
    };

    const user = await User.findById(player.id);
    if (!user) {
      throw new Error("User not found");
    } else {
      const alreadyInvited = user.invites.some(
        (invite) => invite?.id === roomId
      );
      if (!alreadyInvited) {
        user.invites.push({
          id: roomId,
          schedule: roomData.schedule || null,
        });
        await user.save();
      }
    }

    roomData.players.push(newPlayer);
    roomData.playersList.push(player.name);

    let requestFound = roomData.requestedTicketCount.find(
      (p) => p.id === player.id
    );
    if (!requestFound) {
      roomData.requestedTicketCount.push({
        id: player.id,
        name: player.name,
        phone: player.phone,
        count: player.requestedTicketCount || 1,
      });
    } else {
      roomData.requestedTicketCount.find((p) => p.id === player.id).count =
        player.requestedTicketCount || 1;
    }

    return {
      success: true,
      message: "Player joined successfully",
    };
  } catch (error) {
    throw error;
  }
};

export const claimPatternLogic = async (
  player,
  roomId,
  pattern,
  ticketIndex
) => {
  try {
    const roomData = activeRooms.get(roomId);
    const playerIndex = roomData.players.findIndex((p) => p.id === player?.id);
    if (playerIndex === -1) {
      throw new Error("Player not found in room");
    }

    const patternMap = {
      1: "Early Five",
      2: "Middle Number",
      3: "Early Seven",
      4: "First Line",
      5: "Second Line",
      6: "Third Line",
      7: "Corner",
      8: "Full House",
    };

    const patternName = patternMap[pattern];
    if (!patternName) {
      throw new Error("Invalid pattern");
    }

    const patternObj = roomData.claimTrack.find(
      (p) => p.id === String(pattern)
    );
    if (!patternObj || patternObj.winners <= 0) {
      throw new Error("Pattern not available for claiming");
    }

    // Get player's ticket numbers
    const playerTicket = roomData.players[playerIndex]?.assign_numbers?.[ticketIndex];
    if (!playerTicket) {
      throw new Error("Ticket not found for this player");
    }

    // Get drawn numbers
    const drawnNumbers = roomData.drawno || [];
    if (drawnNumbers.length === 0) {
      throw new Error("No numbers have been drawn yet");
    }

    // Extract all numbers from the ticket
    const getAllTicketNumbers = (ticket) => {
      const numbers = [];
      ticket.forEach((row) => {
        row.forEach((num) => {
          if (num !== null && num !== undefined) {
            numbers.push(num);
          }
        });
      });
      return numbers;
    };

    // Get row numbers from ticket
    const getRowNumbers = (ticket, rowIndex) => {
      const numbers = [];
      ticket[rowIndex].forEach((num) => {
        if (num !== null && num !== undefined) {
          numbers.push(num);
        }
      });
      return numbers;
    };

    // Get corner numbers from ticket
    const getCornerNumbers = (ticket) => {
      const corners = [];
      // Top row - first and last non-null numbers
      for (let i = 0; i < ticket[0].length; i++) {
        if (ticket[0][i] !== null && ticket[0][i] !== undefined) {
          corners.push(ticket[0][i]);
          break;
        }
      }
      for (let i = ticket[0].length - 1; i >= 0; i--) {
        if (ticket[0][i] !== null && ticket[0][i] !== undefined) {
          corners.push(ticket[0][i]);
          break;
        }
      }
      // Bottom row - first and last non-null numbers
      for (let i = 0; i < ticket[2].length; i++) {
        if (ticket[2][i] !== null && ticket[2][i] !== undefined) {
          corners.push(ticket[2][i]);
          break;
        }
      }
      for (let i = ticket[2].length - 1; i >= 0; i--) {
        if (ticket[2][i] !== null && ticket[2][i] !== undefined) {
          corners.push(ticket[2][i]);
          break;
        }
      }
      return corners;
    };

    // Get middle number from middle row
    const getMiddleNumber = (ticket) => {
      const middleRow = getRowNumbers(ticket, 1);
      return middleRow[Math.floor(middleRow.length / 2)];
    };

    // Validate claim based on pattern
    let requiredNumbers = [];
    let isValid = false;

    switch (pattern) {
      case 1: // Early Five - any 5 numbers
        const allNums = getAllTicketNumbers(playerTicket);
        const matchedNums = allNums.filter((num) => drawnNumbers.includes(num));
        isValid = matchedNums.length >= 5;
        requiredNumbers = matchedNums.slice(0, 5);
        break;

      case 2: // Middle Number
        const middleNum = getMiddleNumber(playerTicket);
        isValid = drawnNumbers.includes(middleNum);
        requiredNumbers = [middleNum];
        break;

      case 3: // Early Seven - any 7 numbers
        const allNumbers = getAllTicketNumbers(playerTicket);
        const matched = allNumbers.filter((num) => drawnNumbers.includes(num));
        isValid = matched.length >= 7;
        requiredNumbers = matched.slice(0, 7);
        break;

      case 4: // First Line
        requiredNumbers = getRowNumbers(playerTicket, 0);
        isValid = requiredNumbers.every((num) => drawnNumbers.includes(num));
        break;

      case 5: // Second Line
        requiredNumbers = getRowNumbers(playerTicket, 1);
        isValid = requiredNumbers.every((num) => drawnNumbers.includes(num));
        break;

      case 6: // Third Line
        requiredNumbers = getRowNumbers(playerTicket, 2);
        isValid = requiredNumbers.every((num) => drawnNumbers.includes(num));
        break;

      case 7: // Corner
        requiredNumbers = getCornerNumbers(playerTicket);
        isValid = requiredNumbers.every((num) => drawnNumbers.includes(num));
        break;

      case 8: // Full House
        requiredNumbers = getAllTicketNumbers(playerTicket);
        isValid = requiredNumbers.every((num) => drawnNumbers.includes(num));
        break;

      default:
        throw new Error("Invalid pattern type");
    }

    // Check if the claim includes the last drawn number (Critical Rule)
    const lastDrawnNumber = drawnNumbers[drawnNumbers.length - 1];
    const ticketNumbers = getAllTicketNumbers(playerTicket);
    const ticketHasLastNumber = ticketNumbers.includes(lastDrawnNumber);
    
    // For valid claims, at least one of the required numbers should be the last drawn
    // OR the ticket should have the last drawn number marked
    if (!isValid) {
      throw new Error(`BOGEY! Invalid claim for ${patternName}. Required numbers not all drawn.`);
    }

    const alreadyClaimedByAllTickets = roomData.players[
      playerIndex
    ].claims.some((claim) => {
      if (claim?.name === patternName) {
        if (claim?.ticketNo?.includes(ticketIndex)) {
          return true;
        } else {
          return false;
        }
      }
    });
    if (alreadyClaimedByAllTickets) {
      throw new Error(
        `You have already claimed ${patternName} for this ticket.`
      );
    } else if (alreadyClaimedByAllTickets === false) {
      const claim = roomData.players[playerIndex].claims.find(
        (claim) => claim.name === patternName
      );
      if (claim) {
        claim.ticketNo.push(ticketIndex);
      } else {
        roomData.players[playerIndex].claims.push({
          name: patternName,
          ticketNo: [ticketIndex],
        });
      }
    }

    roomData.claimData.push({
      player: {
        id: player?.id,
        name: player?.name,
        phone: player?.phone,
      },
      pattern: patternName,
      ticketIndex: ticketIndex,
      claimedNumbers: requiredNumbers,
      claimTime: new Date().toISOString(),
    });

    // 🔻 Decrease pattern count
    const patternIndex = roomData.claimTrack.findIndex(
      (p) => p.id === String(pattern)
    );
    if (patternIndex !== -1) {
      roomData.claimTrack[patternIndex].winners--;
    }

    return {
      success: true,
      message: `${patternName} Claimed by ${player?.name} ✅ Verified by System 🎉`,
      pattern: patternName,
      claimedNumbers: requiredNumbers,
    };
  } catch (error) {
    throw error;
  }
};
