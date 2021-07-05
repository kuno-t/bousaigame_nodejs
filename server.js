const http = require("http");
const socketio = require("socket.io");
const express = require("express");
const app = express();
const fs = require("fs");
const url = require("url");

var server = app.listen(3000); // ポート競合の場合は値を変更

var io = socketio(server); //仕様変更でsocketio.listen(server)から変更
app.use(express.static(__dirname + "/public"));

io.sockets.on("connection", function(socket) {
  socket.on("client_to_server", function(data) {
    io.sockets.emit("server_to_client", { value: data.value });
  });
});
