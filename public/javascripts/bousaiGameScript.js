/* 要素の紐付け */
const noEntryText = document.getElementById("noEntryText");
const setUpText = document.getElementById("setUpText");
const questionTextAndButton = document.getElementById("questionTextAndButton");
const questionText = document.getElementById("questionText");
const voteText = document.getElementById("voteText");
const scoreText = document.getElementById("scoreText");
const resultText = document.getElementById("resultText");
const stepText = document.getElementById("stepText");

const entryButton = document.getElementById("entryButton");
const startButton = document.getElementById("startButton");
const answerSendButton = document.getElementById("answerSendButton");
const voteSendButton = document.getElementById("voteSendButton");
const nextGameButton = document.getElementById("nextGameButton");
const resetButton = document.getElementById("resetButton");

const displayAnswer = [
  document.getElementById("displayAnswer1"),
  document.getElementById("displayAnswer2"),
  document.getElementById("displayAnswer3"),
  document.getElementById("displayAnswer4"),
  document.getElementById("displayAnswer5")
];

const displayPlayerNameElement = [
  document.getElementById("playerName1"),
  document.getElementById("playerName2"),
  document.getElementById("playerName3"),
  document.getElementById("playerName4"),
  document.getElementById("playerName5")
];

const displayScoreElement = [
  document.getElementById("player1Score"),
  document.getElementById("player2Score"),
  document.getElementById("player3Score"),
  document.getElementById("player4Score"),
  document.getElementById("player5Score"),
];

const votePlayerNameElement = [
  document.getElementById("votePlayerName1"),
  document.getElementById("votePlayerName2"),
  document.getElementById("votePlayerName3"),
  document.getElementById("votePlayerName4"),
  document.getElementById("votePlayerName5")
];

const displayVoteElement = [
  document.getElementById("displayVote1"),
  document.getElementById("displayVote2"),
  document.getElementById("displayVote3"),
  document.getElementById("displayVote4"),
  document.getElementById("displayVote5"),
];

const scoreText_PlayerNameElement = [
  document.getElementById("scoreText_PlayerName1"),
  document.getElementById("scoreText_PlayerName2"),
  document.getElementById("scoreText_PlayerName3"),
  document.getElementById("scoreText_PlayerName4"),
  document.getElementById("scoreText_PlayerName5"),
];

const scoreText_scoreElement = [
  document.getElementById("scoreText_score1"),
  document.getElementById("scoreText_score2"),
  document.getElementById("scoreText_score3"),
  document.getElementById("scoreText_score4"),
  document.getElementById("scoreText_score5"),
];

const resultTextElement = [
  document.getElementById("1stPlayer"),
  document.getElementById("2ndPlayer"),
  document.getElementById("3rdPlayer"),
  document.getElementById("4thPlayer"),
  document.getElementById("5thPlayer"),
]

const answerTextArea = document.getElementById("answerTextArea"); 
const chatButton = document.getElementById("chatButton");
const seat = document.getElementsByClassName("seat");
const playerName = document.getElementById("playerName");
const choiceNum = 3; //選択肢数は暫定3
const voteSUM = 7; //投票時の合計得点数は暫定7
const maxStep = 3; //最大問題回数
var step = 0; //現在のステップ
const dataUrl = "json/bousaiGameData.json"; //json参照用
var bousaiJSON; //JSONが入る
var playerNum = -1; //初期値(未参加)なら-1
var nowPlayerName = playerName.value; //名前入力欄
var playerList = [];
var tokenList = [];
var scoreList = [0,0,0,0,0]; //現在プレイヤーが持つ得点。本当はプレイヤーリストと一緒にクラス化したいんだけど、空の配列に対してメンバを参照しようとしてしまって今のままだとうまくいかない……

var voteList = [0,0,0,0,0]; //これから投票する得点を一時的に記録

var myToken;


/* トークンの設定 */
socket.on("token",function(data){
  myToken = data.token;
});

socket.on("setUpData",function(data){
  playerList = data.playerList;
  chair_controll(); //playerListからプレイヤー表示をする自作関数
  phase_setUp(data.phase);
});

//関数
function chatButtonOnClick() {
  //テキスト欄からの書き込みを行う
  if (playerNum === -1) {
    window.alert("まだ着席していません");
    return; //プレイヤー未定なら警告だけ出して何もしない
  }
  let answerText = answerTextArea.value; //テキストを読み取る
  let answerTextHTML = answerText.replace(/\n/g, "<br>"); //普通だと一個置き換えた時点で終わるので正規表現を使う
  answerTextArea.value = ""; //テキストエリアをクリア
  console.log(answerText);
  socket.emit("client_to_server_text", {html:answerTextHTML, number:playerNum, name:nowPlayerName}); //サーバーに送る
}

socket.on("server_to_client_text",function(data){ //サーバーから受け取る
  displayAnswer[data.number].innerHTML += data.name + ":<br>" + data.html　+　"<br>"; //HTMLとして出力
  displayAnswer[data.number].scrollTop = displayAnswer[data.number].scrollHeight; //scrollTopは現在スクロール位置、scrollHeightは現在のスクロール可能な高さ。 これで一番下まで強制でスクロールする。
});

/* ゲームスタート */
function startButtonOnClick() {
  
  $.getJSON(dataUrl, bousaiJSON => {
    console.log(JSON.stringify(bousaiJSON));
    socket.emit("game_start", {bousaiJSON: bousaiJSON, num:playerNum});
  });
}

socket.on("all_agree",function(data){
  
  setUpText.hidden = true;
  scoreText.hidden = true;
  questionTextAndButton.hidden = false; //表示テキストの切り替え
  
  step = data.step;
  stepText.innerHTML = `${step}/${maxStep}`;
  
  $.getJSON(dataUrl,bousaiJSON =>{
    questionText.innerHTML = bousaiJSON.question[data.Qnum].text;
    for (var i = 0; i < choiceNum; i++) {
      document.getElementById(`imageFrame${i + 1}`).innerHTML = `<img src="${
        data.image[i].src
      }" alt="${data.image[i].alt}" title="選択肢${i +
        1}" class="choicesImage" id="choiceImage${i +
        1}" onclick="imageOnClick('#choiceImage${i + 1}')">`; // ``の中に${}で変数展開
    }
  });
});




function imageOnClick(imageId) {
  //画像クリック時呼び出し
  console.log($(imageId).attr("alt"));
  answerTextArea.value += $(imageId).attr("alt");
}

playerName.addEventListener('focusout',(e) => { //名前欄からフォーカスが外れたらプレイヤー名取得
  nowPlayerName = playerName.value;
  console.log(nowPlayerName);
});

/* もう使わない
$(function() { //着席処理
  $(".seat").on("click", function() {
    //着席ボタンで呼び出し
    if(playerNum > -1){
      playerList[playerNum]=false;
    }
    console.log($(this).attr("data-num"));
    var oldPlayerNum = playerNum;
    playerNum = $(this).attr("data-num") - 1;
    socket.emit("sit_down", {num:playerNum,name:nowPlayerName,oldNum:oldPlayerNum});
  });
});

*/

/* 着席処理 */
function entryButtonOnClick(){
  if(playerName.value.length === 0){ //文字列の長さが0、つまり何も書かれていないならアラート
    window.alert("名前欄が空です");
  } else {
    console.log("着席処理実行");
    socket.emit("sit_down", {name:nowPlayerName}); //そうでなければ着席リクエスト
  }
}

socket.on("sit_down_error",function(data){ //満員ならアラート
  window.alert("満員です");
});

socket.on("c_sit_down",function(data){ //空いていたら着席するのでその情報を受け取る
  playerList = data.playerList;
  tokenList[data.num] = data.token;
  scoreList[data.num] = 0;
  
  console.log(playerList,data.num);
    
  chair_controll(); //playerListからプレイヤー表示をする自作関数
  
  if(myToken == data.token){
    playerNum = data.num;
    noEntryText.hidden = true;
    setUpText.hidden = false;
  }
});

function chair_controll(){ //参加者の椅子の制御
  for(let index = 0; index<5; index++){
    if(index < playerList.length) {
      displayPlayerNameElement[index].innerHTML = votePlayerNameElement[index].innerHTML = scoreText_PlayerNameElement[index].innerHTML = playerList[index].name;
      console.log(index + ": " + JSON.stringify(playerList[index]));
    } else {
      displayPlayerNameElement[index].innerHTML = votePlayerNameElement[index].innerHTML = scoreText_PlayerNameElement[index].innerHTML = "空席";
    }
  }
}

/* 回答の送信 */
function answerSendButtonOnClick(){
  
  if (playerNum === -1) {
    window.alert("あなたは参加していません");
    return; //プレイヤー未定なら警告だけ出して何もしない
  }
  
  let answerText = answerTextArea.value; //テキストを読み取る
  let answerTextHTML = answerText.replace(/\n/g, "<br>"); //普通だと一個置き換えた時点で終わるので正規表現を使う
  answerTextArea.value = ""; //テキストエリアをクリア
  console.log(answerText);
  socket.emit("answerSend", {html:answerTextHTML, playerToken:myToken, num:playerNum}); //サーバーに送る
}

socket.on("answerOpen",function(data){
  let HTML;
  let index;
  data.answerHTMLList.forEach(function(HTML,index){
    console.log(index,HTML);
    displayAnswer[index].innerHTML +="<span class='answerTextHTML'>" + HTML +　"</span><br>"; //HTMLとして出力
    displayAnswer[index].scrollTop = displayAnswer[index].scrollHeight; //scrollTopは現在スクロール位置、scrollHeightは現在のスクロール可能な高さ。 これで一番下まで強制でスクロールする。
  });

  questionTextAndButton.hidden = true;
  voteText.hidden = false;
});

/* +に投票 */
$(function(){
  $(".upVote").on("click", function() {
    
    if (playerNum === -1) {
      window.alert("あなたは参加していません");
      return; //プレイヤー未定なら警告だけ出して何もしない
    }
    
    var voteNum = $(this).attr("data-num")-1;
    if(voteNum != playerNum){ //プレイヤー番号と一致するところには投票不可
      if($(this).attr("data-num") <= playerList.length){
        console.log(`${voteNum},${playerList.length}`);
        if(voteList[voteNum] < voteSUM){ //合計点以上でないか
          voteList[voteNum] += 1;
          console.log($(this).attr("data-num"),voteList);
          displayVoteElement[voteNum].innerHTML = voteList[voteNum];
        }
        else { //合計点以上を投票しようとした時
          window.alert(`合計${voteSUM}点以上は投票できません`)
        }
      } else {
        window.alert("空席には投票できません");
      }
    }
    else{
      window.alert("自分には投票できません");
    }
  });
});

/* -に投票 */
$(function(){
  $(".downVote").on("click", function() {
    
    if (playerNum === -1) {
      window.alert("あなたは参加していません");
      return; //プレイヤー未定なら警告だけ出して何もしない
    }
    
    var voteNum = $(this).attr("data-num")-1;
    if(voteNum != playerNum){ //プレイヤー番号と一致するところには投票不可
      if(voteList[voteNum] > 0){
        voteList[voteNum] -= 1;
        console.log($(this).attr("data-num"),voteList);
        displayVoteElement[voteNum].innerHTML = voteList[voteNum];
      }
      else { //0点のとき
        window.alert("0点より低い点は投票できません")
      }
    }
    else{
      window.alert("自分には投票できません");
    }
  });
});


/* 投票の送信 */
function voteSendButtonOnClick(){
  if (playerNum === -1) {
    window.alert("あなたは参加していません");
    return; //プレイヤー未定なら警告だけ出して何もしない
  }
  
  if(voteSUM == voteList.reduce((sum, element) => sum + element, 0)){ //配列が合計七なら実行
    socket.emit("score_set",{voteList: voteList, playerToken:myToken, num:playerNum});
    console.log("send");  
    
    voteList = [0,0,0,0,0];
    voteSendButton.innerHTML = "送信済み";
    voteSendButton.disabled = true;
  } else {
    window.alert(`合計${voteSUM}点になるように割り振ってください`);
  }
}


//スコアのセット
socket.on("score_get_back", function(data){
  voteText.hidden = true;
  scoreText.hidden = false;
  scoreList = data.scoreList;
  voteSendButton.innerHTML = "送信";
  voteSendButton.disabled = false;
  
  for(let index=0; index<5; index++){
    
    displayVoteElement[index].innerHTML = 0;
    
    if(index < playerList.length) {
      displayScoreElement[index].innerHTML = scoreList[index];
      document.getElementById(`scoreText_score${index+1}`).innerHTML = scoreList[index];
      console.log(playerList[index].name + ":" + scoreList[index]);
    } else {
      displayScoreElement[index].innerHTML = 0;
    }
    
  }
});

/* 次のゲームに進む*/
function nextGameButtonOnClick(){
  
  if (playerNum === -1) {
    window.alert("あなたは参加していません");
    return; //プレイヤー未定なら警告だけ出して何もしない
  }
  
  if(step>=maxStep){
    socket.emit("game_end",{step:step,maxStep:maxStep, num:playerNum}); //終了時 
  }
  else {
    startButtonOnClick();
  }
}

socket.on("game_end_back",function(data){
  try{
    let copyPlayerList = data.playerList;
    for(let i=0; i<copyPlayerList.length-1; i++){ //バブルソート
      for(let j=copyPlayerList.length-1; j>i; j--){
        if(copyPlayerList[j] > copyPlayerList[j-1]){
          let temp = copyPlayerList[j];
          copyPlayerList[j] = copyPlayerList[j-1];
          copyPlayerList[j-1] = temp;
        }
      }
    }
    
    for(let i=0; i<5; i++){
      
      if(i<copyPlayerList.length){
        resultTextElement[i].innerHTML = `${i+1}位 ${copyPlayerList[i].name}: ${copyPlayerList[i].score}ポイント`;
      } else {
        resultTextElement[i].innerHTML = "";
      }
    }
    
    resultText.hidden = false;
    scoreText.hidden = true;
    
  }catch(e){
    console.error(e.name,e.message);
  }
});

/* 切断時処理 */
socket.on("somebody_disconnected",function(data){
  playerList = data.playerList;
  tokenList = data.tokenList;
  scoreList = data.scoreList;
  chair_controll();
});

/* リセット */
function resetButtonOnClick(){
  let checkResetFlag = window.confirm('ゲームをリセットしますか？');
  
  if(checkResetFlag){
    socket.emit("reset_s",{num:playerNum});
  }
  else{
    window.alert("リセットを取りやめました");
    return;
  }
}

socket.on("reset_c",function(data){
  playerNum = -1; //初期値(未参加)なら-1
  nowPlayerName = playerName.value; //名前入力欄
  playerList = [];
  tokenList = [];
  scoreList = [0,0,0,0,0]; //現在プレイヤーが持つ得点。本当はプレイヤーリストと一緒にクラス化したいんだけど、空の配列に対してメンバを参照しようとしてしまって今のままだとうまくいかない……
  voteList = [0,0,0,0,0]; //これから投票する得点を一時的に記録
  step = 0;
  
  chair_controll();
  
  for (let i = 0; i < choiceNum; i++) {
    document.getElementById(`imageFrame${i + 1}`).innerHTML = "";
  }
  
  for (let i = 0; i < 5; i++) {
    displayAnswer.innerHTML = ""; //チャット欄からっぽにする
    displayScoreElement[i].innerHTML = "0"; //スコアは0に戻す
  }
    
  noEntryText.hidden = false;
  setUpText.hidden = true;
  questionTextAndButton.hidden = true;
  voteText.hidden = true;
  scoreText.hidden = true;
  resultText.hidden = true;
  
});

// 紐付け
chatButton.onclick = chatButtonOnClick;
startButton.onclick = startButtonOnClick;
entryButton.onclick = entryButtonOnClick;
answerSendButton.onclick = answerSendButtonOnClick;
voteSendButton.onclick = voteSendButtonOnClick;
nextGameButton.onclick = nextGameButtonOnClick; //startButtonと同じことをする
resetButton.onclick = resetButtonOnClick;
//imageOnClickはHTMLを書き込む時にHTML側に直接記述される

function phase_setUp(phase){
  if(phase == "Question"){
    noEntryText.hidden = true;
    questionTextAndButton.hidden = false;
  } else if(phase == "Vote"){
    noEntryText.hidden = true;
    voteText.hidden = false;
  } else if(phase == "Score"){
    noEntryText.hidden = true;
    scoreText.hidden = false;
  } else if(phase == "End"){
    noEntryText.hidden = true;
    resultText.hidden = false;
  }
}