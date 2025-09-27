// routes/notification.routes.js
import express from "express";
import { getNotifications } from "../controllers/notification.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", verifyJWT, getNotifications);

export default router;
