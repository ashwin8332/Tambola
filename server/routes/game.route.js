import express from "express";
import {
  isPlayerInvited,
  deleteInvite,
  getRooms,
} from "../controllers/game.controller.js";
import authenticate, {
  authenticateOptimized,
} from "../middleware/auth.middleware.js";

const gameRouter = express.Router();

gameRouter.post("/invited", isPlayerInvited);
gameRouter.delete("/invite/:inviteId", authenticateOptimized, deleteInvite);
gameRouter.get("/rooms", authenticateOptimized, getRooms);
export default gameRouter;
