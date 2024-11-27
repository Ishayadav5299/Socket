import { Container, Typography, Button, TextField, Box, Stack } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import {io} from "socket.io-client"


const App = () => {

  const socket = useMemo( 
    () => io("http://localhost:5600", {
    withCredentials: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1500
  }), 
  []
);

// const socket = io('ws://localhost:3000');



  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [room, setRoom] = useState("");
  const [socketID, setsocketID] = useState("");
  const [roomName, setRoomName] = useState("");


  // console.log(messages);

   const handleSubmit = (e) => {
    e.preventDefault();
    socket.emit("message", {message, room});
    setMessage("");
  };

  const joinRoomHandler = (e) => {
    e.preventDefault();
    socket.emit('join-room', roomName)
    setRoomName("");
  }

  useEffect( () => {
socket.on("connect", () => {
  setsocketID(socket.id);
  console.log("connected", socket.id);
});

socket.on("connect_error",(error)=>{
  console.error("Socket could not be connected", error.message);
})

socket.on("receive-message", (data) => {
  console.log(data);
  setMessages((messages) => [...messages, data]);
});

socket.on("welcome", (s) => {
  console.log(s);
});

return () => {
  socket.disconnect();
};

}, [socket]);

  return (
  <Container maxWidth = "sm">
    <Box sx = {{height: 300}} />
    <Typography variant = "h6" component= "div" gutterBottom>
      {socketID}
    </Typography>

    <form onSubmit={joinRoomHandler}>
<h5>Join Room</h5>
<TextField  
    value = {roomName}
    onChange = {(e) => setRoomName(e.target.value)}
    id = "outlined-basic" 
    label = "Room Name" 
    variant = "outlined" 
    />

<Button  type = "submit" variant = "container" color = "primary">
      Join 
      </Button>
    </form>

    <form  onSubmit={handleSubmit}>
    <TextField  
    value = {message}
    onChange = {(e) => setMessage(e.target.value)}
    id = "outlined-basic" 
    label = "Message" 
    variant = "outlined" 
    />
        <TextField  
    value = {room}
    onChange = {(e) => setRoom(e.target.value)}
    id = "outlined-basic" 
    label = "Room" 
    variant = "outlined" 
    />
    <Button  type = "submit" variant = "container" color = "primary">
      Send 
      </Button>
    </form>
<Stack>
  {
    messages.map((m, i) => (
      <Typography key = {i} variant= "h6" component= "div" gutterBottom>
        {m}
      </Typography>
    ))
  }
</Stack>

  </Container>
  )
  
};

export default App