import dotenv from 'dotenv';
dotenv.config({
    path:"./.env"
})
import connectDB from './DB/index.js';
import {createServer} from 'http';
import {Server} from "socket.io";
import {app} from './app.js';

const port = process.env.PORT || 3000;

console.log(process.env.MONGODB_URI)

const httpServer = createServer(app);
const io = new Server(httpServer,{
    cors:{
        origin:'*',
        methods:['Get','POST']
    }
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("⚡ A user connected:", socket.id);

  // User registers after login
  socket.on("register", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log("✅ Registered:", userId);
  });

  // On disconnect
  socket.on("disconnect", () => {
    for (let [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    console.log("❌ User disconnected:", socket.id);
  });
});

export { io, onlineUsers, httpServer };

connectDB()
.then(() => {
    app.listen(port,() => {
        console.log(`Server is running on port : http://localhost;${port}`)
    })
}).catch((err) =>{
    console.log("Mongodb connection failed : ",err);
})