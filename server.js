const http = require("http");
const socketio = require("socket.io");
const express = require("express");
const app = express();
const fs = require("fs");
const url = require("url");

var server = app.listen(3000); // ポート競合の場合は値を変更

/* サーバーをソケットと紐付け */
var io = socketio(server); //仕様変更でsocketio.listen(server)から変更

/* static要素のルーティングを読み込み*/
app.use(express.static(__dirname + "/public"));


io.sockets.on("connection", function(socket) { //接続処理後の通信定義
  socket.on("client_to_server", function(data) { //client_to_serverという名前の通信を受け付けたら
    io.sockets.emit("server_to_client", { html: data.html, number:data.number }); //server_to_clientという名前で送り返す
  });
  
  /*問題と画像*/
    socket.on("c_to_s_question", function(data) { 
    io.sockets.emit("s_to_c_question", {Qnum: data.question, image:data.image });
  });
});
