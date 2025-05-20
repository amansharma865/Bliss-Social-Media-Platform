import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { getMessages, sendMessage, getConversations } from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/conversations", protectRoute, getConversations);
router.get("/messages/:userId", protectRoute, getMessages);
router.post("/messages", protectRoute, sendMessage);

export default router;
