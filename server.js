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

/*プレイヤー管理変数*/
var playerList = [false,false,false,false,false];
var playerScore = [0,0,0,0,0]; //スコア集計で参照中。ここはプレイヤーを構造化すべきかも

var startAgree = 0

io.sockets.on("connection", function(socket) { //接続処理後の通信定義
  
  socket.on("client_to_server_text", function(data) { //client_to_serverという名前の通信を受け付けたら
    io.sockets.emit("server_to_client_text", { html: data.html, number:data.number, player:data.player }); //server_to_clientという名前で送り返す
  });
  
  /*問題と画像*/
    socket.on("c_to_s_question", function(data) { 
    io.sockets.emit("s_to_c_question", {Qnum: data.question, image:data.image });
  });
  
  /* 着席処理 */
  socket.on("sit_down",function(data){
    playerList[data.num] = data.name;
    if(data.oldNum != -1){playerList[data.oldnum] = false;} 
    io.sockets.emit("c_sit_down",{num: data.num, name:data.name, oldNum:data.oldNum});
  });
  
  /* 開始処理 */
  socket.on("game_start",function(data){
  startAgree += 1;
    if(startAgree >= playerList.filter(n => n == true).length ){
      io.sockets.emit("all_agree",{num: data.num, name:data.name});
    }
  });
  
  /* リセット */
  socket.on("reset",function(data){
    startAgree = 0;
    playerList = [false,false,false,false,false];
      io.sockets.emit("reset");
  });
  
  /* スコア集計 */
  socket.on("score_set",function(data){ //
    for(let i = 0; i < 5; i++){
      playerScore[i] += data.score[i]; //(仮)
    };
  });
  
  /* スコア表示 */
  socket.on("score_get",function(data){ //
    io.sockets.emit("score_get_back", {playerScore: playerScore})
  });
  
  socket.on('disconnect',() => { //切断時処理
    console.log( 'disconnect' );
    io.sockets.emit("server_to_client", { value: 'someone is disconnected.'});
  });
  
});
