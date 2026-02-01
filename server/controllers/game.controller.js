import User from "../models/user.model.js";
// import Host from "../models/host.model.js";
import Room from "../models/room.model.js";

// /api/game/invited
export const isPlayerInvited = async (req, res) => {
  try {
    let { phone, roomid } = req.body;
    phone = phone.toString().trim();

    //validation
    if (!phone || !roomid) {
      return res.status(400).json({ message: "All fields are required" });
    } else if (phone.length !== 10) {
      return res
        .status(400)
        .json({ message: "Phone number must be 10 digits (login back)" });
    }

    // Find the player by phone
    const player = await User.findOne({ phone });
    if (!player) {
      return res.status(400).json({ message: "Player not found" });
    }

    // Check if the player is invited
    const isInvited = player.invites.some((invite) => invite.id === roomid);

    if (!isInvited) {
      return res.status(400).json({ message: "Player not invited" });
    }

    return res.status(200).json({ message: "Player is Invited" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// /api/game/invite/:id
export const deleteInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const id = req.userId;

    if (!inviteId || !id) {
      return res
        .status(400)
        .json({ message: "Invite ID and User ID are required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out the invite with the given ID
    const originalLength = user.invites.length;
    user.invites = user.invites.filter((invite) => invite.id !== inviteId);

    if (user.invites.length === originalLength) {
      return res.status(404).json({ message: "Invite not found" });
    }

    await user.save();

    return res
      .status(200)
      .json({ invites: user.invites, message: "Invite removed successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// /api/game/rooms
export const getRooms = async (req, res) => {
  try {
    const id = req.userId;
    if (!id) {
      console.log("ID is not found in request:", id);
      return res.status(400).json({ message: "ID is required" });
    }
    const user = await User.findById(id).select("role");
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.role !== "host") {
      return res.status(400).json({ message: "User is not a host" });
    }
    const rooms = await Room.find();
    if (!rooms || rooms.length === 0) {
      return res.status(400).json({ message: "No rooms found" });
    }
    return res.status(200).json({ rooms: rooms, message: "Rooms found" });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching `rooms`",
      error: error.message,
    });
  }
};
