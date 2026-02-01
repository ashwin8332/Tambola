import { readFile } from "fs/promises";
export const assignTickets = async (players) => {
  try {
    // Load tickets from tickets.json
    const ticketsData = await readFile("tickets.json", "utf8");
    const tickets = JSON.parse(ticketsData);

    // Initialize array of available set indices (1 to 1000)
    const availableSetIndices = Array.from({ length: 1000 }, (_, i) => i + 1);

    // Calculate total sets needed
    const totalSetsNeeded = players.length;
    if (totalSetsNeeded > 999) {
      throw new Error("Too many players, only 999 tickets available");
    }

    // Assign tickets to each player
    for (let player of players) {
      player.assign_numbers = {};
      if (player.ticketCount > 6) {
        player.ticketCount = 6; // Limit to 6 tickets
      }
      if (player.ticketCount == 0) {
        continue; // Skip players with no tickets
      }

      // Select a random set index from available indices
      if (availableSetIndices.length === 0) {
        throw new Error("No available sets remaining for assignment");
      }
      const randomIndex = Math.floor(
        Math.random() * availableSetIndices.length
      );
      const ticketIndex = availableSetIndices[randomIndex];
      availableSetIndices.splice(randomIndex, 1); // Remove the used index

      const ticketSet = tickets[ticketIndex];
      for (let i = 0; i < player.ticketCount; i++) {
        player.assign_numbers[i + 1] = ticketSet[i];
      }
    }

    return players;
  } catch (error) {
    throw new Error(`Error assigning tickets: ${error.message}`);
  }
};
