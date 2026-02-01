import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  sessionId: String,
  createdAt: { type: Date, default: Date.now, expires: '7d' }
});

const gameSettingsSchema = new mongoose.Schema({
  gameDate: { type: Date, default: null },
  gameTime: { type: String, default: "" },
  totalTicketLimit: { type: Number, default: 50 },
  ticketPrice: { type: Number, default: 50 },
  websiteStatus: { type: String, enum: ["open", "closed"], default: "open" },
  bookingStatus: { type: String, enum: ["open", "closed"], default: "open" },
  callingInterval: { type: Number, default: 10 }, // seconds between number calls
  callingStatus: { type: Boolean, default: false },
});

const dividendSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
});

const announcementSchema = new mongoose.Schema({
  text: { type: String, default: "" },
  voiceUrl: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

const bookedTicketSchema = new mongoose.Schema({
  ticketId: { type: Number, required: true },
  playerName: { type: String, required: true },
  playerPhone: { type: String, required: true },
  bookedAt: { type: Date, default: Date.now },
});

const systemLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  details: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
});

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  phone: {
    type: String,
    default: "",
  },
  whatsappGroupLink: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["admin", "superadmin"],
    default: "admin",
  },
  sessions: [sessionSchema],
  
  // Game Settings
  gameSettings: {
    type: gameSettingsSchema,
    default: () => ({}),
  },
  
  // Dividends/Prizes
  dividends: {
    type: [dividendSchema],
    default: [
      { name: "First Full House", amount: 0, isActive: true, order: 1 },
      { name: "Second Full House", amount: 0, isActive: false, order: 2 },
      { name: "Third Full House", amount: 0, isActive: false, order: 3 },
      { name: "First Line", amount: 0, isActive: false, order: 4 },
      { name: "Middle Line", amount: 0, isActive: false, order: 5 },
      { name: "Last Line", amount: 0, isActive: false, order: 6 },
      { name: "Early Five", amount: 0, isActive: false, order: 7 },
      { name: "Four Corners", amount: 0, isActive: false, order: 8 },
    ],
  },
  
  // Announcements
  announcements: [announcementSchema],
  
  // Current game state
  currentGame: {
    isActive: { type: Boolean, default: false },
    roomId: { type: String, default: "" },
    drawnNumbers: { type: [Number], default: [] },
    shuffleSeed: { type: Number, default: 0 },
    startedAt: { type: Date, default: null },
  },
  
  // Booked tickets
  bookedTickets: [bookedTicketSchema],
  
  // Theme settings
  theme: {
    name: { type: String, default: "default" },
    primaryColor: { type: String, default: "#7c3aed" },
    secondaryColor: { type: String, default: "#3b82f6" },
  },
  
  // Background music
  backgroundMusic: {
    enabled: { type: Boolean, default: false },
    currentTrack: { type: String, default: "" },
    volume: { type: Number, default: 50 },
  },
  
  // System Logs
  systemLogs: {
    type: [systemLogSchema],
    default: [],
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update timestamp on save
adminSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
