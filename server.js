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
var scoreList = [0,0,0,0,0]; //スコア集計で参照中。プレイヤーのクラス化はうまくいかなかった
var tokenList = [];

var startAgree = 0; //全員OK?
var answerAgree = [];
var voteAgree = 0; //投票について
var answerHTMLList = [];
var voteList = [0,0,0,0,0];

/* ゲームルール */
const choiceNum = 3; //選択肢数は暫定3
var step = 0;

io.sockets.on("connection", function(socket) { //接続処理後の通信定義
  
  var Player; //プレイヤーオブジェクト
  var name; //名前
  var token; //トークン
  var agree; //賛成かどうか
  /*var score; //スコア、 */
  
  
  /*接続時にまずする処理*/
  token = makeToken(socket.id); //トークンを生成して
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
      
      /* オブジェクト作成 */
      Player = {
        name: name,
        token: token,
        score: 0,
        agree: false
      };
      
      playerList.push(Player);
      console.log(playerList);
      
      var num = -1;
      for(let index=0; index < playerList.length; index++){
        let playerBuffer = playerList[index];
        console.log(playerBuffer);
        if(token == playerBuffer.token){ num = index }
      }
      
      tokenList[num] = token;
      io.sockets.emit("c_sit_down",{ playerList:playerList, num: num, token:token});
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
    if(startAgree >= playerList.length){//} && playerList.length >= 3){
      let bousaiJSON = data.bousaiJSON;
      
      let Qnum = Math.floor(Math.random() * bousaiJSON.question.length); //Question決定。
      console.log("Qnum:",Qnum,"/",bousaiJSON.question.length);
      let imageList = bousaiJSON.question[Qnum].image;
      let image = [];
      let numList = randoms(choiceNum, imageList.length); //乱数生成
      for (let i = 0; i < choiceNum; i++) {
      //画像を規定の数選ぶ。choiceNumは定数で一括変更可能。
        image[i] = imageList[numList[i]]; //image決定
      }
      
      startAgree = 0;
      console.log(`step:${step}`)
      step += 1;
      
      io.sockets.emit("all_agree",{Qnum:Qnum, image:image, step:step});
    }
  });
  
  /* リセット */
  socket.on("reset_s",function(data){
    startAgree = 0;
    answerAgree = []
    voteAgree = 0;
    playerList = [];
    tokenList = [];
    scoreList = [0,0,0,0,0];
    voteList = [0,0,0,0,0];
    answerHTMLList = [];
    step = 0;
    
    io.sockets.emit("reset_c",{});
  });
  
  /* 回答の収集 */
  
  socket.on("answerSend",function(data){
    answerHTMLList[data.num] = data.html
    if(-1 == answerAgree.indexOf(data.playerToken)){
      answerAgree.push(data.playerToken);
    }
    
    console.log(answerAgree.length,playerList.length);
    if(answerAgree.length >= playerList.length){
      io.sockets.emit("answerOpen",{answerHTMLList:answerHTMLList});
      answerHTMLList = [];
      answerAgree = [];
    }
  });
  
  /* スコア集計 */
  socket.on("score_set",function(data){ //
    for(let i = 0; i < 5; i++){
      voteList[i] += data.voteList[i]; //(仮)
    }
    voteAgree += 1;
    
    if(voteAgree >= playerList.length){
      voteAgree = 0;
      for(let i = 0; i < 5; i++){
        scoreList[i] += voteList[i]; //(仮)
      }
      voteList = [0,0,0,0,0];
      io.sockets.emit("score_get_back", {scoreList: scoreList})
    }
  });
  
  /* 終了時 */
  socket.on("game_end",function(data){
    
  });
  
  /* 切断時 */
  socket.on('disconnect',() => { //切断時処理。タブを切り替えただけで切れちゃうのでちょっと対処法を考え中。
    console.log( 'disconnect' );
    var index = tokenList.indexOf(token);
    console.log(tokenList,token);
    playerList.splice(index,1);
    tokenList.splice(index,1);
    scoreList.splice(index,1);
    answerHTMLList.splice(index,1);
    if(scoreList.length < 5){scoreList.push(0);}
    console.log(`${name} is disconnected.`);
    console.log(`${index}`);
    io.sockets.emit("server_to_client", { name: name, value: 'someone is disconnected.'});
    io.sockets.emit("somebody_disconnected",{ playerList:playerList, num: tokenList.indexOf(token), token: token, tokenList: tokenList, scoreList: scoreList});
  });
  
});

function makeToken(id){ //トークンの生成
  const str = "qwer" + id;
  return( crypto.createHash("sha256").update(str).digest('hex') ); //strをcryptoでsha256方式の暗号化
}

function randoms(num, max) { //最大(max-1)の重複なし乱数をnum個生成する
  console.log(num, max);
  if(num > max){
    console.log("num <= maxにしてください！")
  }
  var randoms = [];
  var tmp;
  var i = 0;
  while (true) {
    tmp = Math.floor(Math.random() * max);
    // console.log(tmp);
    if (!randoms.includes(tmp)) {
      randoms.push(tmp);
    }
    if (randoms.length >= num || randoms.length >= max) {
      break;
    }
    i++;
  }
  console.log(randoms);
  return randoms;
}