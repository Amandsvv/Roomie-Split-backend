import Notification from "../models/notification.model.js"; // your schema
import { asyncHandler } from "../utils/asyncHandler.js";

// ✅ Get all notifications for logged-in user
const getNotifications = asyncHandler(async (req, res) => {

    const userId = req.user._id; // assuming auth middleware sets req.user
    const notifications = await Notification.find({ 
    user: userId, 
    status: "Sent" 
    }).sort({ createdAt: -1 });


    return res.status(201).json({ success: true, notifications });

});

export{
  getNotifications
}