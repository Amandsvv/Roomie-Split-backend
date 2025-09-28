import mongoose from "mongoose";
import  Group  from "../models/groups.model.js";
import  User  from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Notification from "../models/notification.model.js";
import { io, onlineUsers } from "../index.js";  // ✅ socket.io setup

/// ✅ Create Group
const createGroup = asyncHandler(async (req, res) => {
  const { name, members } = req.body;

  if (!name || !Array.isArray(members)) {
    throw new ApiError(400, "Group name and members are required");
  }

  // Find users from provided emails
  const users = await User.find({ email: { $in: members } });

  if (!users.length) {
    throw new ApiError(404, "No valid users found for members list");
  }

  // Create the group
  const group = await Group.create({
    name,
    createdBy: req.user._id,
    members: [
      { user: req.user._id, status: "accepted", role: "admin" },
      ...users.map((u) => ({ user: u._id, status: "pending", role: "member" })),
    ],
  });

  // 🔔 Create notifications for invited members
  for (const user of users) {
    const notification = await Notification.create({
      user: user._id,
      message: `You have been invited to join the group "${group.name}"`,
      type: "In-App",
      groupId: group._id, // ✅ link notification to group
      status: "Sent",
    });

    // If user is online, send in real-time
    const socketId = onlineUsers.get(user._id.toString());
    if (socketId) {
      req.io.to(socketId).emit("notification", notification);
    }
  }

  res.status(201).json({
    success: true,
    message: "Group created successfully & members notified",
    group,
  });
});


// ✅ Respond to Invite
const respondInvite = asyncHandler(async (req, res) => {
  const { groupId ,notificationId} = req.params;
  const { status } = req.body; // "accepted" or "rejected"

  if (!["accepted", "rejected"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  if(!notificationId){
    throw new ApiError(400, "Notificaton missing")
  }

  const notification = await Notification.findByIdAndDelete(notificationId);
  if (!notification) throw new ApiError(404, "Notification not Deleted Yet");

  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  // Find the member entry
  const member = group.members.find(
    (m) => m.user.toString() === req.user._id.toString()
  );
  if (!member) throw new ApiError(403, "You are not invited to this group");

  // Update member status
  member.status = status;
  await group.save();

  return res.json({ success: true, message: `Invite ${status}` });
});

const getMyGroups = asyncHandler(async (req, res) => {
  const groups = await Group.aggregate([
    // 1️⃣ Match groups where the user is a member and status is accepted
    { 
      $match: { 
        members: { 
          $elemMatch: { 
            user: req.user._id, 
            status: "accepted" 
          } 
        } 
      } 
    },
    // 2️⃣ Project only accepted members
    {
      $project: {
        name: 1,
        createdBy: 1,
        expenses: 1,
        members: {
          $filter: {
            input: "$members",
            as: "member",
            cond: { $eq: ["$$member.status", "accepted"] }
          }
        }
      }
    },
    // 3️⃣ Lookup to populate member user details
    {
      $lookup: {
        from: "users",               // collection name
        localField: "members.user",
        foreignField: "_id",
        as: "memberDetails"
      }
    },
    // 4️⃣ Merge memberDetails with members array
    {
      $addFields: {
        members: {
          $map: {
            input: "$members",
            as: "m",
            in: {
              _id: "$$m._id",
              status: "$$m.status",
              role: "$$m.role",
              user: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$memberDetails",
                      as: "u",
                      cond: { $eq: ["$$u._id", "$$m.user"] }
                    }
                  },
                  0
                ]
              }
            }
          }
        }
      }
    },
    // 5️⃣ Remove temporary memberDetails
    { $project: { memberDetails: 0 } }
  ]);

  res.json({ success: true, groups });
});


// ✅ Add Member (Admin only)
const addMember = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { email } = req.body;

  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  const me = group.members.find(m => m.user.toString() === req.user._id.toString());
  if (!me || me.role !== "admin") throw new ApiError(403, "Only admin can add members");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  if (group.members.some(m => m.user.toString() === user._id.toString())) {
    throw new ApiError(409, "User already in group");
  }

  group.members.push({ user: user._id });
  await group.save();

  res.json({ success: true, message: "Member added, awaiting acceptance" });
});

// ✅ Remove Member
const removeMember = asyncHandler(async (req, res) => {
  const { groupId, memberId } = req.params;

  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  const me = group.members.find(m => m.user.toString() === req.user._id.toString());
  if (!me || me.role !== "admin") throw new ApiError(403, "Only admin can remove members");

  group.members = group.members.filter(m => m.user.toString() !== memberId);
  await group.save();

  res.json({ success: true, message: "Member removed" });
});

const getGroupById = asyncHandler(async (req, res) => {
  const { groupId } = req.params;


  const group = await Group.findById(groupId)
    .populate("createdBy", "email name")
    .populate("members.user", "email name")
    .populate("expenses.paidBy", "email name")
    .populate("expenses.splitAmong.user", "email name");

  if (!group) throw new ApiError(404, "Group not found");

  return res.status(200).json({ success: true, group });
});

// ✅ Delete Group (Admin only, without notifications)
const deleteGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  // Find the group
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  console.log(group)

  // Check if current user is the admin (creator)
  if (group.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the admin can delete this group");
  }

  // Delete related notifications
  await Notification.deleteMany({ groupId: group._id });

  // Delete the group
  await group.deleteOne();

  res.status(200).json({ success: true, message: "Group deleted successfully" });
});


export{
    createGroup,
    addMember,
    getMyGroups,
    respondInvite,
    removeMember,
    getGroupById,
    deleteGroup
}