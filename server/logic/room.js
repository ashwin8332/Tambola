// In-memory room storage using Map
const activeRooms = new Map();

// In-memory lock map
const roomLocks = new Map();

// pendingDeletingRooms
const pendingRoomDeletions = new Map(); // roomId -> timeout ID

export { activeRooms, roomLocks, pendingRoomDeletions };
export default { activeRooms, roomLocks, pendingRoomDeletions };
