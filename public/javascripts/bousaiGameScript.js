/* 要素の紐付け */
const noEntryText = document.getElementById("noEntryText");
const setUpText = document.getElementById("setUpText");
const questionTextAndButton = document.getElementById("questionTextAndButton");
const questionText = document.getElementById("questionText");
const voteText = document.getElementById("voteText");

const entryButton = document.getElementById("entryButton");
const startButton = document.getElementById("startButton");
const answerSendButton = document.getElementById("answerSendButton");
const voteSendButton = document.getElementById("voteSendButton");

const displayAnswer = [
  document.getElementById("displayAnswer1"),
  document.getElementById("displayAnswer2"),
  document.getElementById("displayAnswer3"),
  document.getElementById("displayAnswer4"),
  document.getElementById("displayAnswer5")
];

var displayPlayerNameElement = [
  document.getElementById("playerName1"),
  document.getElementById("playerName2"),
  document.getElementById("playerName3"),
  document.getElementById("playerName4"),
  document.getElementById("playerName5")
];

var votePlayerNameElement = [
  document.getElementById("votePlayerName1"),
  document.getElementById("votePlayerName2"),
  document.getElementById("votePlayerName3"),
  document.getElementById("votePlayerName4"),
  document.getElementById("votePlayerName5")
];

const answerTextArea = document.getElementById("answerTextArea"); 
const answerButton = document.getElementById("answerButton");
const seat = document.getElementsByClassName("seat");
const playerName = document.getElementById("playerName");
const choiceNum = 3; //選択肢数は暫定3
const dataUrl = "json/bousaiGameData.json"; //json参照用
var bousaiJSON; //JSONが入る
var playerNum = -1; //初期値(未参加)なら-1
var nowPlayerName = playerName.value; //名前入力欄
var playerList = [];
var tokenList = [];
var scoreList = [];

var myToken;


/* トークンの設定 */
socket.on("token",function(data){
  myToken = data.token;
});

socket.on("setUpData",function(data){
  playerList = data.playerList;
  chair_controll(); //playerListからプレイヤー表示をする自作関数
});

//関数
function answerButtonOnClick() {
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
    let Qnum = Math.floor(Math.random() * bousaiJSON.question.length); //Question決定。完成時にはサーバーサイドで決める予定
    let imageList = bousaiJSON.question[Qnum].image;
    let image = [];
    let numList = randoms(choiceNum, imageList.length); //完成時にはサーバーサイドから受け取る
    for (let i = 0; i < choiceNum; i++) {
      //画像を規定の数選ぶ。choiceNumは定数で一括変更可能。
      image[i] = imageList[numList[i]]; //image決定
    }
    console.log(image);
    socket.emit("c_to_s_question", {question:Qnum, image:image});
  });
}

socket.on("s_to_c_question",function(data){
  
  setUpText.hidden = true;
  questionTextAndButton.hidden = false; //表示テキストの切り替え
  
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
  playerList[data.num] = data.name;
  tokenList[data.num] = data.token;
  scoreList[data.num] = 0;
    
  chair_controll(); //playerListからプレイヤー表示をする自作関数
  
  if(myToken == data.token){
    playerNum = data.num;
    noEntryText.hidden = true;
    setUpText.hidden = false;
  }
});

/* //古いバージョン
socket.on("c_sit_down",function(data){
  displayPlayerNameElement[data.num].innerHTML = playerList[data.num] = data.name; //名前を表示しつつプレイヤーリストに保持
  document.getElementById(`seat${data.num + 1}`).disabled = true; //着席したらボタンを非活性化
  
  if(data.oldNum != -1) { 
    displayPlayerNameElement[data.oldNum].innerHTML = "空席";
    playerList[data.oldNum] = false;
    document.getElementById(`seat${data.oldNum + 1}`).disabled = false;
  } //初めての着席じゃなければ、前に座っていた席を空席にしてボタンを活性化
  
  console.log(playerList);
});
*/

function chair_controll(){ //参加者の椅子の制御
  for(let index = 0; index<5; index++){
    console.log(playerList[index]);
    var memberName = playerList[index];
    if(index < playerList.length) {
      displayPlayerNameElement[index].innerHTML = votePlayerNameElement[index].innerHTML = memberName;
      console.log(index + ": " + memberName);
    } else {
      displayPlayerNameElement[index].innerHTML = votePlayerNameElement[index].innerHTML = "空席";
    }
  }
}

/* 回答の送信 */
function answerSendButtonOnClick(){
  
  /* 途中 */
  questionTextAndButton.hidden = true;
  voteText.hidden = false;
}

/* 投票の送信 */
function voteSendButtonOnClick(){
  
  /* 途中 画面切り替えテストのみ */
  voteText.hidden = true;
  setUpText.hidden = false;
}

function randoms(num, max) {
  //重複無しの乱数発生装置。これはテストプレイ用。完成時にはサーバーサイドで全プレイヤーに共通のものを渡す必要がある
  console.log(num, max);
  var randoms = [];
  var tmp;
  var i = 0;
  while (i < 100) {
    tmp = Math.floor(Math.random() * max);
    // console.log(tmp);
    if (!randoms.includes(tmp)) {
      randoms.push(tmp);
    }
    if (randoms.length >= num) {
      break;
    }
    i++;
  }
  console.log(randoms);
  return randoms;
}

// 紐付け
answerButton.onclick = answerButtonOnClick;
startButton.onclick = startButtonOnClick;
entryButton.onclick = entryButtonOnClick;
answerSendButton.onclick = answerSendButtonOnClick;
voteSendButton.onclick = voteSendButtonOnClick;
//imageOnClickはHTMLを書き込む時にHTML側に直接記述される

/* こっちはデバッグ 
var bousaiJSON = {
    question:[{
        text:"大きな地震に被災したときのことを想定します。<br>備蓄のあった以下の食べ物のどれかについて、<br>他の選択肢には無い長所を考えてみましょう。<br>限られた条件下で特に有用であれば、<br>条件を付け足してみても構いません。<br>",
        image:[{
            alt:"カップラーメン",
            src:"food_cup_noodle_close.png"
        },
        {
            alt:"乾パン",
            src:"bousai_kanpan.png"
        },
        {
            alt:"缶詰",
            src:"food_kandume_close.png"
        }
        ]
    },
    {
        text:"大きな地震に被災したときのことを想定します。<br>水を保管、運搬するための以下の容器について、<br>他の選択肢には無い長所を考えてみましょう。<br>限られた条件下で特に有用であれば、<br>条件を付け足してみても構いません。<br>",
        image:[{
            alt:"ペットボトル",
            src:"bousai_water.png"
        },
        {
            alt:"バケツ",
            src:"bucket_blue_water_down.png"
        },
        {
            alt:"レジ袋",
            src:"shopping_bag_rejibukuro.png"
        }
        ]
    }
    ]
};
*/
