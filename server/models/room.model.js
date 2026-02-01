import mongoose from "mongoose";
import moment from "moment-timezone"; // Import moment-timezone for formatting

const roomSchema = new mongoose.Schema(
  {
    roomid: {
      type: String,
      required: [true, "Room ID is required"],
      unique: true,
    },
    publicId: {
      type: String,
      required: [true, "Public id is not generated, please create a new room"],
      unique: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    players: [
      {
        id: String,
        name: String,
        phone: String,
        socketid: String,
        assign_numbers: [Object],
        requestedTicketCount: Number,
        ticketCount: Number,
        claims: [Array],
      },
    ],
    settings: {
      type: Object,
      default: {},
    },
    claimData: [
      {
        player: {
          name: String,
          phone: String,
        },
        pattern: String,
      },
    ],
    isCompleted: {
      type: Boolean,
      default: false,
    },
    isOngoing: {
      type: Boolean,
      default: false,
    },
    finishTime: {
      type: String,
      default: "",
    },
  },
  { timestamps: false }
);

const Room = mongoose.model("Room", roomSchema);

export default Room;
