// import express  from "express";
// import {Server} from "socket.io";
// import {createServer}  from "http";
// import cors from "cors";
// import jwt from 'jsonwebtoken';
// import cookieParser from "cookie-parser";


// const port = 5600;
// const secretKeyJWT = "asdfghjkl"

// const app = express();
// const server = createServer(app)
// const io = new Server(server, {
//     cors: {
//         origin: "http://localhost:5173",
//         methods:["GET", "POST"],
//         credentials : true,
//     },
// });

// app.use(
//     cors({
//         origin: "http://localhost:5173",
//         methods:["GET", "POST"],
//         credentials : true,
//     })
// );

// app.get("/", (req, res) => {
//     res.send("Hello World");
// });

// app.get("/login", (req, res) => {
//     const token = jwt.sign({ _id: "qwertyuiop"},  secretKeyJWT);

//     res
//     .cookie("token", token, { httpOnly:true, secure: false, sameSite: "none" })
//     .json({
//         message: "Login Success",
//     });
// });

// const user = false;

// // Middleware

// // io.use((socket, next) => {
// //     cookieParser()(socket.request, socket.request.res, (err) => {
// //         if(err) return next(err);

// //         const token = socket.request.cookies.token;

// //         if(!token) return next(new Error("Authentication Error"));

// //         const decoded = jwt.verify(token, secretKeyJWT);
// //         next();
// //     });
// // });

// io.on("connection", (socket) => {
// console.log("User Connected", socket.id);

// socket.on("message", ({room, message}) => {
//     console.log({room, message});
//     // send the message to everyone in the room using io, including the sender
//     io.to(room).emit("receive-message", message);
// });

// socket.on("join-room", (room) => {
//     socket.join(room);
//     console.log(`User joined room ${room}`);
    
// });

// socket.on("disconnect", () => {
//     console.log("User Disconnected", socket.id);
// });
// });

// server.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });

import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

// MongoDB Setup
mongoose.connect("mongodb+srv://jipneshjindal07:Jipnesh1234@cluster01.qynja.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log("MongoDB connection error:", err));

// MongoDB Models
const messageSchema = new mongoose.Schema({
    room: String,
    message: String,
    sender: String,
    timestamp: { type: Date, default: Date.now }
});

const roomSchema = new mongoose.Schema({
    name: String,
    users: [String], // List of user IDs or socket IDs
    messages: [messageSchema]
});

const Message = mongoose.model("Message", messageSchema);
const Room = mongoose.model("Room", roomSchema);

// App setup
const port = 5600;

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

app.use(
    cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    })
);

app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Hello World");
});

// Login route to generate a dummy JWT token (if needed)
app.get("/login", (req, res) => {
    // Normally, you'd authenticate the user and generate a token, but for now, we skip that
    res.json({
        message: "Login Success",
    });
});

io.on("connection", (socket) => {
    console.log("User Connected", socket.id); // Log when a user connects

    // Join a room
    socket.on("join-room", async (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`); // Log when user joins room

        // Fetch existing messages from MongoDB for this room
        const roomData = await Room.findOne({ name: room }).populate("messages");
        if (roomData) {
            console.log(`Room ${room} has existing messages.`); // Log if room has existing messages
            socket.emit("previous-messages", roomData.messages); // Send previous messages to the user
        } else {
            console.log(`Room ${room} does not exist, creating new room.`); // Log when room doesn't exist
            // Create room if it doesn't exist
            const newRoom = new Room({ name: room, users: [socket.id] });
            await newRoom.save();
        }
    });

    // Handle incoming messages
    socket.on("message", async ({ room, message }) => {
        console.log(`User ${socket.id} sending message to room ${room}: ${message}`); // Log the message sent by the user

        // Save message to MongoDB
        const newMessage = new Message({
            room,
            message,
            sender: socket.id, // Or use socket.user if you have user authentication
        });

        // Save message in the room
        const roomData = await Room.findOne({ name: room });
        if (roomData) {
            roomData.messages.push(newMessage);
            await roomData.save();
            console.log(`Message saved to room ${room}`); // Log message saved to room
        } else {
            const newRoom = new Room({
                name: room,
                users: [socket.id],
                messages: [newMessage],
            });
            await newRoom.save();
            console.log(`New room ${room} created and message saved.`); // Log new room creation and message save
        }

        // Emit the message to all users in the room
        io.to(room).emit("receive-message", newMessage);
        console.log(`Message broadcasted to room ${room}`); // Log when message is broadcasted
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id); // Log when user disconnects

        // Optionally, you can remove the user from the room
        // Or clean up inactive room data
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
