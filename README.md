# 🎲 Tambola Game (Housie) - Multiplayer Web App

A real-time Tambola (Housie) game built with **MERN stack** and **Socket.IO** for seamless multiplayer experience. The game supports real-time number drawing, claim patterns, role-based login, room locking, reconnections, and beautiful modern UI.

---

## 🚀 Features

- 🎯 Role-based access (Host / Player)
- 🔒 Room locking with custom mutex system
- 🧠 Reconnection logic for ongoing rooms
- 🔢 Number drawing in real-time
- 📢 Optional text-to-speech for drawn numbers
- 🏆 Claim patterns with claim tracking
- 🖥️ Responsive UI for desktop and mobile
- 🔗 WhatsApp game invite link with encoded room access
- ♻️ Memory + DB room sync for persistent rooms

---

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS, React Router, Context API
- **Backend**: Node.js, Express, Socket.IO
- **Database**: MongoDB (Mongoose)
- **Storage**: Local Memory (for normal rooms), MongoDB (for scheduled)
- **Authentication**: Role-based context (not third-party login)
- **Utilities**:
  - Custom room mutex with Promise chaining
  - CryptoJS for public room ID hashing

---

## 🧩 Setup Instructions

### 📦 Backend

```bash
cd server
npm install
node index.js
```

### 💻 Frontend

```bash
cd client
npm install
npm run dev
```

Make sure your backend server is running on `http://localhost:PORT` and client connects to the correct WebSocket server.

---

## 🔐 Room Joining with Hash

- Public room ID is hashed using AES encryption.
- Hash is verified on join for secure invitation.
- No two hashes are the same due to unique IV usage.

---

## 🧠 Reconnection Logic

- If player refreshes page or loses connection:
  - Checks if room is ongoing or not.
  - Rejoins and syncs draw state and tickets.
  - Host and players are automatically restored.

---

## 📱 Invite Players via WhatsApp

Invite link auto-generates with encoded room ID:

```txt
https://tambolatesting.vercel.app/user/:publicId
```

---


## ⚠️ License & Usage Notice

This project is **copyrighted** and protected under the "All Rights Reserved" license.

> ❌ **You are not allowed to copy, fork, reuse, or modify this code** without explicit permission.

This repository is made public **only to showcase the work** of the original developer.

If you're interested in collaboration or want to discuss this project, feel free to [contact me](anshiashwin80@gmail.com).

---

## 🙋‍♂️ Developer

Built with ❤️ by **Ashwin Vincent Koonissery**


