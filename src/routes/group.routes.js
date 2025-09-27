import express from "express";
import {
  createGroup,
  respondInvite,
  getMyGroups,
  addMember,
  removeMember,
  getGroupById,
  deleteGroup,
} from "../controllers/group.controllers.js";
import {
  addExpense,
  getExpenses,
  calculateBalance,
  deleteExpense,
  editExpense
} from "../controllers/expense.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Group routes
router.post("/createGroup", verifyJWT, createGroup);
router.post("/groups/:groupId/respond", verifyJWT, respondInvite);
router.get("/my", verifyJWT, getMyGroups);
router.post("/:groupId/members", verifyJWT, addMember);
router.delete("/:groupId/members/:memberId", verifyJWT, removeMember);
router.get("/groups/:groupId",verifyJWT,getGroupById)
router.route("/groups/:groupId").delete(verifyJWT,deleteGroup);


// Expense routes
router.post("/:groupId/add-expenses", verifyJWT, addExpense);
router.get("/:groupId/monthly", verifyJWT, getExpenses);
router.get("/:groupId/balance", verifyJWT, calculateBalance);
router.delete("/:groupId/expenses/:expenseId", verifyJWT, deleteExpense);
router.route("/:groupId/expenses/:expenseId").put(verifyJWT,editExpense);

export default router;
