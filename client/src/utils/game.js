import CryptoJS from "crypto-js";
// roomid and publicId hashing utility functions
// const SECRET_KEY = "tambola-secret-key-1234-5678";
export const distributeNumbersEqually = (data) => {
  const ticketSize = 15;
  const ticketCount = Math.floor(data.length / ticketSize);
  const totalNeeded = ticketCount * ticketSize;

  // Filter valid numbers (1-90)
  const arr = data
    .filter((num) => typeof num === "number" && num >= 1 && num <= 90)
    .slice(0, totalNeeded);

  if (arr.length < totalNeeded) {
    throw new Error(
      `Insufficient valid numbers: got ${arr.length}, need ${totalNeeded}. ` +
        `Ensure input has ${totalNeeded} numbers in range 1-90. Input: [${data}]`
    );
  }

  const rangeLimitPerTicket = {
    1: 2,
    2: 4,
    3: 6,
    4: 8,
    5: 10,
    6: 12,
  };
  const maxPerRange = rangeLimitPerTicket[ticketCount] || 12;

  const getRangeIndex = (num) => (num === 90 ? 8 : Math.floor(num / 10));

  // Sort input array in ascending order (keep duplicates)
  const sortedArr = arr.sort((a, b) => a - b);

  // Initialize tickets and tracking
  const tickets = Array.from({ length: ticketCount }, () => []);
  const ticketSets = Array.from({ length: ticketCount }, () => new Set());
  const rangeCountPerTicket = Array.from({ length: ticketCount }, () =>
    Array(9).fill(0)
  );
  const skipped = [];

  // Phase 1: Round-robin distribution, respecting range limits
  let currentTicket = 0;

  for (let num of sortedArr) {
    let assigned = false;
    let attempts = 0;
    const maxAttempts = ticketCount;
    const startTicket = currentTicket;

    while (attempts < maxAttempts) {
      const t = currentTicket % ticketCount;
      const rangeIndex = getRangeIndex(num);

      if (
        tickets[t].length < ticketSize &&
        !ticketSets[t].has(num) &&
        rangeCountPerTicket[t][rangeIndex] < maxPerRange
      ) {
        tickets[t].push(num);
        ticketSets[t].add(num);
        rangeCountPerTicket[t][rangeIndex]++;
        assigned = true;
        break;
      }
      currentTicket = (currentTicket + 1) % ticketCount;
      attempts++;
    }

    if (!assigned) {
      skipped.push(num);
    }
    currentTicket = (startTicket + 1) % ticketCount;
  }

  // Phase 2: Fill underfilled tickets with skipped numbers
  // First pass: Respect range limits
  for (let t = 0; t < ticketCount; t++) {
    let i = 0;
    while (tickets[t].length < ticketSize && i < skipped.length) {
      const num = skipped[i];
      const rangeIndex = getRangeIndex(num);
      if (
        !ticketSets[t].has(num) &&
        rangeCountPerTicket[t][rangeIndex] < maxPerRange
      ) {
        tickets[t].push(num);
        ticketSets[t].add(num);
        rangeCountPerTicket[t][rangeIndex]++;
        skipped.splice(i, 1); // Remove used number
      } else {
        i++;
      }
    }
  }

  // Second pass: Ignore range limits to ensure 15 numbers
  for (let t = 0; t < ticketCount; t++) {
    let i = 0;
    while (tickets[t].length < ticketSize && i < skipped.length) {
      const num = skipped[i];
      if (!ticketSets[t].has(num)) {
        tickets[t].push(num);
        ticketSets[t].add(num);
        skipped.splice(i, 1); // Remove used number
      } else {
        i++;
      }
    }
  }

  // Validate each ticket has 15 numbers
  tickets.forEach((ticket, index) => {
    if (ticket.length !== ticketSize) {
      throw new Error(
        `Ticket ${index + 1} has ${
          ticket.length
        } numbers, expected ${ticketSize}. Input: [${data}]`
      );
    }
  });

  // Sort each ticket
  tickets.forEach((ticket) => ticket.sort((a, b) => a - b));

  return tickets;
};

export const generateTambolaTickets = (numbers) => {
  if (!Array.isArray(numbers)) {
    throw new Error("Input to generateTambolaTickets must be an array");
  }

  const ticketSize = 15;
  let ticketCount = Math.min(3, Math.floor(numbers.length / ticketSize));
  const totalNeeded = ticketCount * ticketSize;
  const validNumbers = numbers
    .slice(0, totalNeeded)
    .filter((num) => typeof num === "number" && num >= 1 && num <= 90);
  if (validNumbers.length < totalNeeded) {
    throw new Error(`Not enough valid numbers for ${ticketCount} tickets`);
  }

  const ranges = [
    [1, 9],
    [10, 19],
    [20, 29],
    [30, 39],
    [40, 49],
    [50, 59],
    [60, 69],
    [70, 79],
    [80, 90],
  ];
  const tickets = [];

  // Distribute numbers to tickets evenly
  const ticketArrays = distributeNumbersEqually(validNumbers);

  for (let t = 0; t < ticketCount; t++) {
    const ticket = Array.from({ length: 3 }, () => Array(9).fill(null));
    const ticketNumbers = ticketArrays[t] || [];

    if (ticketNumbers.length !== ticketSize) {
      throw new Error(`Ticket ${t + 1} does not have exactly 15 numbers`);
    }

    // Group numbers by column ranges
    const columnPools = ranges.map(([start, end]) =>
      ticketNumbers.filter((n) => n >= start && n <= end).sort((a, b) => a - b)
    );

    // Assign column counts dynamically
    const columnCounts = Array(9).fill(0);
    let numbersNeeded = ticketSize;
    const availableCols = [...Array(9).keys()].filter(
      (col) => columnPools[col].length > 0
    );
    if (availableCols.length < 5) {
      throw new Error(
        `Ticket ${t + 1}: Not enough columns with numbers (${
          availableCols.length
        })`
      );
    }

    // Ensure at least 5 columns have numbers
    const selectedCols = availableCols
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(availableCols.length, 9));
    for (let col of selectedCols) {
      if (columnCounts[col] < 3 && columnPools[col].length > 0) {
        columnCounts[col] = 1;
        numbersNeeded--;
      }
    }

    // Distribute remaining numbers
    let extraCols = [...selectedCols];
    while (numbersNeeded > 0 && extraCols.length > 0) {
      const col = extraCols[Math.floor(Math.random() * extraCols.length)];
      if (
        columnCounts[col] < 3 &&
        columnPools[col].length > columnCounts[col]
      ) {
        columnCounts[col]++;
        numbersNeeded--;
      } else {
        extraCols.splice(extraCols.indexOf(col), 1);
      }
    }

    if (numbersNeeded > 0) {
      throw new Error(
        `Ticket ${
          t + 1
        }: Cannot assign enough numbers, still need ${numbersNeeded}`
      );
    }

    // Assign numbers to columns
    const columnNumbers = Array(9)
      .fill()
      .map((_, col) => {
        const count = columnCounts[col];
        if (columnPools[col].length < count) {
          throw new Error(
            `Ticket ${
              t + 1
            }: Not enough numbers in column ${col} for count ${count}`
          );
        }
        return columnPools[col].splice(0, count);
      });

    // Assign numbers to rows
    const rowCounts = [0, 0, 0];
    const rowColumnCount = Array.from({ length: 3 }, () => Array(9).fill(0));

    for (let col = 0; col < 9; col++) {
      for (let i = 0; i < columnNumbers[col].length; i++) {
        const num = columnNumbers[col][i];
        let availableRows = rowCounts
          .map((count, row) => ({ row, count }))
          .filter(
            ({ row }) => rowCounts[row] < 5 && rowColumnCount[row][col] === 0
          )
          .sort((a, b) => a.count - b.count);

        if (availableRows.length === 0) {
          // Steal from another row
          for (let r = 0; r < 3; r++) {
            if (rowCounts[r] > 4) {
              const filledCols = ticket[r]
                .map((n, c) => (n !== null ? c : -1))
                .filter((c) => c !== -1);
              if (filledCols.length > 0) {
                const stealCol =
                  filledCols[Math.floor(Math.random() * filledCols.length)];
                const stealRow = [0, 1, 2].find(
                  (r) => rowCounts[r] < 5 && ticket[r][stealCol] === null
                );
                if (stealRow !== undefined) {
                  ticket[stealRow][stealCol] = ticket[r][stealCol];
                  ticket[r][stealCol] = null;
                  rowCounts[stealRow]++;
                  rowCounts[r]--;
                  rowColumnCount[stealRow][stealCol] = 1;
                  rowColumnCount[r][stealCol] = 0;
                  availableRows = [
                    { row: stealRow, count: rowCounts[stealRow] },
                  ];
                  break;
                }
              }
            }
          }
        }

        if (availableRows.length === 0) {
          throw new Error(
            `Ticket ${t + 1}: No available rows for column ${col}`
          );
        }

        const row = availableRows[0].row;
        ticket[row][col] = num;
        rowCounts[row]++;
        rowColumnCount[row][col] = 1;
      }
    }

    // Ensure 5 numbers per row
    for (let row = 0; row < 3; row++) {
      while (rowCounts[row] < 5) {
        const availableCols = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(
          (c) =>
            ticket[row][c] === null &&
            columnPools[c].length > 0 &&
            columnCounts[c] < 3
        );
        if (availableCols.length === 0) {
          // Steal from another row
          for (let r = 0; r < 3; r++) {
            if (r !== row && rowCounts[r] > 4) {
              const filledCols = ticket[r]
                .map((n, c) => (n !== null ? c : -1))
                .filter((c) => c !== -1);
              if (filledCols.length > 0) {
                const col =
                  filledCols[Math.floor(Math.random() * filledCols.length)];
                ticket[row][col] = ticket[r][col];
                ticket[r][col] = null;
                rowCounts[row]++;
                rowCounts[r]--;
                rowColumnCount[row][col] = 1;
                rowColumnCount[r][col] = 0;
                break;
              }
            }
          }
          if (rowCounts[row] < 5) {
            throw new Error(
              `Ticket ${t + 1}: Cannot fill row ${row + 1} to 5 numbers`
            );
          }
        } else {
          const col =
            availableCols[Math.floor(Math.random() * availableCols.length)];
          const num = columnPools[col].shift();
          ticket[row][col] = num;
          columnCounts[col]++;
          rowCounts[row]++;
          rowColumnCount[row][col] = 1;
        }
      }
    }

    // Sort each column in ascending order
    for (let col = 0; col < 9; col++) {
      let colNumbers = [];
      for (let r = 0; r < 3; r++) {
        if (ticket[r][col] !== null) {
          colNumbers.push(ticket[r][col]);
        }
      }
      colNumbers.sort((a, b) => a - b);
      let index = 0;
      for (let r = 0; r < 3; r++) {
        ticket[r][col] =
          rowColumnCount[r][col] === 1 ? colNumbers[index++] : null;
      }
    }

    tickets.push(ticket);
  }

  return tickets;
};
// cryptoUtils.js
// import CryptoJS from "crypto-js";

const SECRET_KEY = CryptoJS.enc.Utf8.parse("12345678901234567890123456789012");

// Encrypt function
export function textToHash(text) {
  // console.log("[textToHash] Called with:", text);
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const encryptedText = CryptoJS.enc.Base64url.stringify(encrypted.ciphertext);
  const ivString = CryptoJS.enc.Base64url.stringify(iv);

  const result = `${ivString}:${encryptedText}`;
  // console.log("[textToHash] Returning:", result);
  return result;
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
