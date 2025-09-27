import Group from "../models/groups.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ✅ Add Expense
const addExpense = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { description, amount, paidBy, splitAmong } = req.body;

  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  const isMember = group.members.some(
    m => m.user.toString() === req.user._id.toString() && m.status === "accepted"
  );
  if (!isMember) throw new ApiError(403, "You are not a member of this group");

  group.expenses.push({ description, amount, paidBy, splitAmong });
  await group.save();

  res.status(201).json({ success: true, message: "Expense added" });
});

// ✅ View Expenses (by month)
const getExpenses = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { month, year } = req.query; // expecting month=9&year=2025 (for example)

  const group = await Group.findById(groupId).populate("expenses.paidBy", "name")
    .populate("expenses.splitAmong.user", "name email");;

  if (!group) throw new ApiError(404, "Group not found");

  let expenses = group.expenses;

  if (month && year) {
    const startDate = new Date(year, month - 1, 1);         // month - 1 (JS months are 0-based)
    const endDate = new Date(year, month, 0, 23, 59, 59);   // last day of month
    expenses = expenses.filter(exp => {
      const expDate = new Date(exp.createdAt); // assuming you have createdAt in expense schema
      return expDate >= startDate && expDate <= endDate;
    });
  }
  res.json({ success: true, expenses });
});


// ✅ Calculate Balance (by month)
const calculateBalance = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { month, year } = req.query;
  console.log("GroupId : ",groupId)

const group = await Group.findById(groupId)
  .populate("members.user", "email")
  .populate("expenses.paidBy", "email")
  .populate("expenses.splitAmong.user", "email");


  if (!group) throw new ApiError(404, "Group not found");
  console.log("Here : ",group);

  // initialize balance for each member
  const balance = {};
  group.members.forEach(m => {
    balance[m.user.email] = 0;
  });

  // filter expenses by month/year
  let expenses = group.expenses;
  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    expenses = expenses.filter(exp => {
      const expDate = new Date(exp.createdAt);
      return expDate >= startDate && expDate <= endDate;
    });
  }

  // calculate balances
  expenses.forEach(exp => {
    balance[exp.paidBy.email] += exp.amount;
    exp.splitAmong.forEach(s => {
      const user = group.members.find(m => m.user.toString() === s.user.toString());
      if (user) balance[user.user.email] -= s.share;
    });
  });

  console.log("Balance : ",balance)

  return res.status(200).json({ success: true, balance });
});


// ✅ Delete Expense
const deleteExpense = asyncHandler(async (req, res) => {
  const { groupId, expenseId } = req.params;

  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  group.expenses = group.expenses.filter(exp => exp._id.toString() !== expenseId);
  await group.save();

  res.json({ success: true, message: "Expense deleted" });
});

const editExpense = asyncHandler(async (req, res) => {
  const { groupId, expenseId } = req.params;
  const { description, amount } = req.body;

  if (!groupId || !expenseId) {
    throw new ApiError(404, "URL missing params");
  }
  if (!description || !amount) {
    throw new ApiError(400, "All fields are required");
  }

  const group = await Group.findById(groupId);
  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  // ✅ Find the expense inside group
  const expense = group.expenses.id(expenseId);
  if (!expense) {
    throw new ApiError(404, "Expense not found");
  }

  // ✅ Update fields
  expense.description = description;
  expense.amount = amount;


  // suppose expense is already fetched from DB
  if (expense.splitAmong && expense.splitAmong.length > 0) {
    const equalShare = amount / expense.splitAmong.length;

    expense.splitAmong = expense.splitAmong.map(item => ({
      ...item.toObject(),   // keep existing user as it is
      share: equalShare     // update only the share
    }));
  }

  // ✅ Save the group (subdocument auto-saves inside parent)
  await group.save({ validateBeforeSave: false });
  console.log(expense)

  res.status(200).json({
    success: true,
    message: "Expense updated successfully",
    expense,
  });
});

export {
  addExpense,
  getExpenses,
  calculateBalance,
  deleteExpense,
  editExpense
}