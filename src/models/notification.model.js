import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    },
    type: { 
      type: String, 
      enum: ["Email", "SMS", "In-App"], 
      default : "In-App",
    },
    sentAt: { 
      type: Date, 
      default: Date.now 
    },
    status: { 
      type: String, 
      enum: ["Sent", "Failed", "Pending"], 
      default: "Sent" 
    },
        // 🔑 Linking notification to group (optional)
    groupId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Group" 
    },
    // Optional: track if user has acted on this notification
    isRead: { 
        type: Boolean, 
        default: false 
    },
    response: { 
        type: String, 
        enum: ["accepted", "rejected", null], 
        default: null 
    } 
  }
);

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;