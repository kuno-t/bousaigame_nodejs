const http = require("http");
const socketio = require("socket.io");
const express = require("express");
const app = express();
const fs = require("fs");
const url = require("url");
const crypto = require('crypto');

var server = app.listen(3000); // ポート競合の場合は値を変更

/* サーバーをソケットと紐付け */
var io = socketio(server); //仕様変更でsocketio.listen(server)から変更

/* static要素のルーティングを読み込み*/
app.use(express.static(__dirname + "/public"));

/*プレイヤー管理変数*/
var playerList = [];
var playerScore = [0,0,0,0,0]; //スコア集計で参照中。ここはプレイヤーを構造化すべきかも

var startAgree = 0

io.sockets.on("connection", function(socket) { //接続処理後の通信定義
  
  var name; //名前を用意
  
  /*接続時にまずする処理*/
  var token = makeToken(socket.id); //トークンを生成して
  io.to(socket.id).emit("token", {token:token}); //接続してきた相手にだけ返す
  // これはhttps://blog.katsubemakito.net/nodejs/socketio/realtime-chat2を参考
  
  io.to(socket.id).emit("setUpData",{playerList: playerList}); //ゲームの状況を渡す
  
  
  /*チャット*/
  socket.on("client_to_server_text", function(data) { //client_to_serverという名前の通信を受け付けたら
    io.sockets.emit("server_to_client_text", { html: data.html, number:data.number, name:data.name }); //server_to_clientという名前で送り返す
  });
  
  /*問題と画像*/
    socket.on("c_to_s_question", function(data) { 
    io.sockets.emit("s_to_c_question", {Qnum: data.question, image:data.image });
  });
  
  /* 着席処理 */
  socket.on("sit_down",function(data){
    if(playerList.length < 5){
      name = data.name;
      playerList.push(name);
      io.sockets.emit("c_sit_down",{ playerList:playerList, num: playerList.indexOf(name), token:token});
    } else {
      io.to(socket.id).emit("sit_down_error",{text:"満席"});
    }
  });
  
  /* 自由な場所に座ってた方
  socket.on("sit_down",function(data){
    playerList[data.num] = data.name;
    if(data.oldNum != -1){playerList[data.oldnum] = false;} 
    io.sockets.emit("c_sit_down",{num: data.num, name:data.name, oldNum:data.oldNum});
  });
  
  */
  
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
    var index = playerList.indexOf(name);
    playerList.splice(index,1);
    io.sockets.emit("server_to_client", { name: name, value: 'someone is disconnected.'});
    io.sockets.emit("c_sit_down",{ playerList:playerList, num: playerList.indexOf(name)});
  });
  
});

function makeToken(id){ //トークンの生成
  const str = "qwer" + id;
  return( crypto.createHash("sha256").update(str).digest('hex') ); //strをcryptoでsha256方式の暗号化
}