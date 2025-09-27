import dotenv from 'dotenv';
dotenv.config({
  path: "./.env"
});

import connectDB from './DB/index.js';
import { createServer } from 'http';
import { Server } from "socket.io";
import { app } from './app.js';

const port = process.env.PORT || 3000;

console.log("Mongo URI:", process.env.MONGODB_URI);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT']
  }
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("register", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log("Registered:", userId);
  });

  socket.on("disconnect", () => {
    for (let [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

export { io, onlineUsers, httpServer };

connectDB()
  .then(() => {
    // ✅ Use httpServer.listen instead of app.listen
    httpServer.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });
