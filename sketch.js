// 定義六個生活情境與各自的正確文字答案。
const quizItems = [
  { answer: '刷牙早晚各一次', icon: '🪥', color: '#ff8a70' }, // 以牙刷代表日常潔牙。
  { answer: '飯前便後要洗手', icon: '🧼', color: '#54b9aa' }, // 以肥皂代表洗手習慣。
  { answer: '垃圾要丟進垃圾桶', icon: '🗑️', color: '#f5b84b' }, // 以垃圾桶代表環境整潔。
  { answer: '過馬路走斑馬線', icon: '🚸', color: '#6b9ed6' }, // 以行人標誌代表交通安全。
  { answer: '多吃蔬菜水果', icon: '🍎', color: '#e77e9c' }, // 以水果代表均衡飲食。
  { answer: '玩完玩具要收好', icon: '🧸', color: '#8cb66b' } // 以玩偶代表玩具收拾。
];

// 定義六個可替換的本機動畫 GIF 素材路徑。
const gifPaths = [
  'assets/toothbrushing.gif', // 刷牙情境動畫。
  'assets/handwashing.gif', // 洗手情境動畫。
  'assets/trash-bin.gif', // 垃圾分類情境動畫。
  'assets/crosswalk.gif', // 斑馬線情境動畫。
  'assets/healthy-food.gif', // 健康飲食情境動畫。
  'assets/tidy-toys.gif' // 收拾玩具情境動畫。
];

// 保存成功載入的本機 GIF 圖片。
let sceneGifs = [];

// 將答案順序打散，讓配對題需要實際拖曳思考。
const answerOrder = [3, 0, 5, 2, 1, 4];

// 保存目前每張圖片已放入的答案索引。
let placements = Array(quizItems.length).fill(null);

// 保存每個答案拖曳按鈕的位置資訊。
let answerBoxes = [];

// 保存每張情境圖片與其作答框的位置資訊。
let questionBoxes = [];

// 記錄目前正在拖曳的答案索引。
let draggingAnswer = null;

// 記錄拖曳指標目前所在位置。
let pointerPosition = { x: 0, y: 0 };

// 記錄作答是否已經交卷。
let submitted = false;

// 記錄目前答對題數。
let correctCount = 0;

// 保存交卷後產生的彩帶粒子。
let confetti = [];

// 預先載入本機 GIF，載入失敗時由情境圖示接手顯示。
function preload() {
  // 逐一載入六個生活情境動畫。
  for (let index = 0; index < gifPaths.length; index += 1) {
    // GIF 素材不存在或格式錯誤時清除該圖片並使用備援圖示。
    sceneGifs[index] = loadImage(gifPaths[index], () => {}, () => { sceneGifs[index] = null; });
  }
}

// 建立滿版畫布並設定適合觸控拖曳的游標樣式。
function setup() {
  // 使用視窗大小建立全螢幕畫布。
  createCanvas(windowWidth, windowHeight);
  // 使用裝置像素比限制高解析螢幕的繪圖負擔。
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  // 關閉預設繪圖外框，保持介面線條俐落。
  noStroke();
  // 使用系統提供的中文與表情符號字型。
  textFont('Arial, "Microsoft JhengHei", sans-serif');
  // 將畫布游標設定為一般操作游標。
  cursor(ARROW);
}

// 依畫布尺寸繪製背景、題目、答案與互動狀態。
function draw() {
  // 使用暖白色作為畫布底色。
  background('#fffaf2');
  // 計算目前裝置適用的題目與答案版面。
  calculateLayout();
  // 繪製不干擾閱讀的淡色背景裝飾。
  drawBackgroundDetails();
  // 繪製標題、說明與進度狀態。
  drawHeader();
  // 繪製六個情境題目及其答案目標框。
  drawQuestions();
  // 繪製尚未放入目標框的文字答案。
  drawAnswers();
  // 繪製交卷按鈕或成績畫面。
  drawFooter();
  // 在高分成績畫面上持續更新彩帶動畫。
  drawConfetti();
}

// 依螢幕方向與尺寸配置六題和六個答案。
function calculateLayout() {
  // 窄螢幕改用三欄題目與兩欄答案，避免卡片過窄。
  const mobile = width < 720;
  // 設定內容區左右留白。
  const margin = mobile ? 18 : Math.min(42, width * 0.045);
  // 設定題目卡片間距。
  const questionGap = mobile ? 10 : 14;
  // 設定題目欄數與列數。
  const questionColumns = mobile ? 3 : 6;
  // 計算每張題目卡片寬度。
  const questionWidth = (width - margin * 2 - questionGap * (questionColumns - 1)) / questionColumns;
  // 依畫面高度限制題目卡片尺寸。
  const questionHeight = mobile ? Math.max(112, Math.min(154, (height - 500) / 2)) : Math.min(210, height * 0.27);
  // 設定題目區的起始位置。
  const questionTop = mobile ? 116 : 150;
  // 清空舊的題目位置，供滑鼠命中測試使用。
  questionBoxes = [];
  // 逐一計算每張題目卡片的位置。
  for (let index = 0; index < quizItems.length; index += 1) {
    // 計算目前題目的欄與列。
    const column = index % questionColumns;
    // 計算目前題目的列位置。
    const row = Math.floor(index / questionColumns);
    // 將題目與作答框位置存入互動資料。
    questionBoxes.push({
      x: margin + column * (questionWidth + questionGap),
      y: questionTop + row * (questionHeight + questionGap),
      w: questionWidth,
      h: questionHeight
    });
  }
  // 計算題目列數以決定答案區的起始位置。
  const questionRows = Math.ceil(quizItems.length / questionColumns);
  // 題目區結束後保留清楚的段落間距。
  const answerTop = questionTop + questionRows * questionHeight + (questionRows - 1) * questionGap + (mobile ? 52 : 76);
  // 窄螢幕使用兩欄答案，桌面使用三欄答案。
  const answerColumns = mobile ? 2 : 3;
  // 計算答案按鈕間距。
  const answerGapX = mobile ? 9 : 14;
  // 計算答案按鈕列距。
  const answerGapY = mobile ? 8 : 10;
  // 計算答案按鈕寬度。
  const answerWidth = (width - margin * 2 - answerGapX * (answerColumns - 1)) / answerColumns;
  // 依裝置尺寸限制答案按鈕高度。
  const answerHeight = mobile ? 50 : 62;
  // 清空舊的答案位置，供滑鼠命中測試使用。
  answerBoxes = [];
  // 逐一計算每個打散後的答案按鈕位置。
  for (let index = 0; index < answerOrder.length; index += 1) {
    // 計算目前答案的欄與列。
    const column = index % answerColumns;
    // 計算目前答案的列位置。
    const row = Math.floor(index / answerColumns);
    // 將答案按鈕位置存入互動資料。
    answerBoxes.push({
      x: margin + column * (answerWidth + answerGapX),
      y: answerTop + row * (answerHeight + answerGapY),
      w: answerWidth,
      h: answerHeight,
      itemIndex: answerOrder[index]
    });
  }
}

// 繪製淡色圓點與裝飾，建立輕鬆的幼兒教材氣氛。
function drawBackgroundDetails() {
  // 依序繪製幾個低對比裝飾圓點。
  fill('#f7e9d6');
  // 在左上角放置小裝飾圓點。
  circle(22, 28, 7);
  // 在右上角放置小裝飾圓點。
  circle(width - 24, 76, 9);
  // 在右下角放置小裝飾圓點。
  circle(width - 30, height - 28, 6);
}

// 繪製標題列、說明文字與配對進度。
function drawHeader() {
  // 將標題文字靠左並置於畫布頂端。
  textAlign(LEFT, CENTER);
  // 使用深綠色呈現清楚的標題層級。
  fill('#244b45');
  // 依窄螢幕縮小標題字級。
  textSize(width < 720 ? 27 : 36);
  // 繪製測驗主標題。
  text('生活小達人', width < 720 ? 18 : 42, 35);
  // 使用較柔和的灰綠色呈現操作提示。
  fill('#69817b');
  // 依窄螢幕縮小提示文字。
  textSize(width < 720 ? 15 : 18);
  // 繪製拖曳配對說明。
  text(width < 720 ? '把正確的生活習慣拖到圖片下方' : '看一看圖片，將正確的生活習慣拖到下方空格', width < 720 ? 18 : 42, 70);
  // 計算已放入目標框的答案數量。
  const placedCount = placements.filter((answer) => answer !== null).length;
  // 在右上方繪製小型進度徽章。
  drawPill(width - (width < 720 ? 104 : 138), 23, width < 720 ? 86 : 114, 36, `${placedCount} / 6`, '#e6f1e8', '#346b5d');
}

// 繪製六張情境卡片、動畫插畫與答案目標框。
function drawQuestions() {
  // 逐張繪製題目卡片。
  for (let index = 0; index < quizItems.length; index += 1) {
    // 取得目前題目卡片的位置與情境資料。
    const box = questionBoxes[index];
    // 取得目前題目情境的顏色。
    const item = quizItems[index];
    // 繪製白色圓角題目卡片。
    fill('#ffffff');
    // 畫出題目卡片外框。
    rect(box.x, box.y, box.w, box.h, 14);
    // 繪製情境插畫的淡色圓形底座。
    fill(item.color + '24');
    // 將插畫底座置於卡片上半部。
    circle(box.x + box.w / 2, box.y + box.h * 0.37, Math.min(box.w * 0.78, box.h * 0.68));
    // 在插畫底座上繪製輕微上下浮動的情境圖示。
    drawAnimatedIcon(item.icon, box.x + box.w / 2, box.y + box.h * 0.37, Math.min(box.w * 0.50, box.h * 0.42), index);
    // 計算目標框的高度。
    const targetHeight = width < 720 ? 34 : 44;
    // 將目標框放在題目卡片底部。
    const targetY = box.y + box.h - targetHeight - 9;
    // 以正確、錯誤或空白狀態決定目標框顏色。
    const hasAnswer = placements[index] !== null;
    // 取得目標框底色，已交卷時標示答案結果。
    const targetFill = submitted ? (placements[index] === index ? '#e4f3e8' : '#fff0e8') : (hasAnswer ? '#edf5f1' : '#f7f7f3');
    // 繪製圓角答案目標框。
    fill(targetFill);
    // 繪製答案目標框邊界。
    rect(box.x + 7, targetY, box.w - 14, targetHeight, 9);
    // 取得目標框目前應顯示的答案文字。
    const targetLabel = hasAnswer ? quizItems[placements[index]].answer : '拖到這裡';
    // 使用置中方式顯示答案或提示。
    textAlign(CENTER, CENTER);
    // 尚未作答時使用淺色提示字，作答後使用深色文字。
    fill(hasAnswer ? '#315d52' : '#9aa7a0');
    // 依題目欄寬設定目標框字級。
    textSize(width < 720 ? 12 : 15);
    // 繪製目標框答案文字。
    text(targetLabel, box.x + 11, targetY + 1, box.w - 22, targetHeight - 2);
    // 交卷後在答錯的題目旁顯示簡短提示。
    if (submitted && placements[index] !== index) {
      // 使用珊瑚色強調需要再練習的題目。
      fill('#d76f59');
      // 繪製錯誤狀態小標記。
      textSize(width < 720 ? 11 : 13);
      // 在卡片底部顯示正確答案提示。
      text(`答案：${item.answer}`, box.x + 5, box.y + box.h - 2, box.w - 10, 18);
    }
  }
}

// 繪製具有呼吸與浮動動態的情境圖示。
function drawAnimatedIcon(icon, x, y, size, seed) {
  // 依題目索引設定彼此錯開的動畫相位。
  const phase = frameCount * 0.055 + seed * 1.2;
  // 計算圖示輕微上下浮動的位置。
  const bounce = Math.sin(phase) * Math.min(4, size * 0.12);
  // GIF 成功載入時直接繪製動畫圖片。
  if (sceneGifs[seed]) {
    // 將動畫 GIF 置中顯示在題目卡片內。
    imageMode(CENTER);
    // 保持素材比例並控制圖像不超出底座。
    image(sceneGifs[seed], x, y + bounce, size * 1.65, size * 1.65);
    // 已使用 GIF 時不再繪製表情符號備援圖示。
    return;
  }
  // 繪製圖示表情符號並置中對齊。
  textAlign(CENTER, CENTER);
  // 設定隨卡片大小調整的圖示字級。
  textSize(size * (1 + Math.sin(phase * 1.5) * 0.035));
  // 繪製持續輕柔跳動的生活情境圖示。
  text(icon, x, y + bounce);
}

// 繪製尚未被放入作答框的答案按鈕。
function drawAnswers() {
  // 繪製答案區的小標題。
  textAlign(LEFT, CENTER);
  // 使用深綠色呈現答案區標題。
  fill('#244b45');
  // 依裝置尺寸設定答案區標題字級。
  textSize(width < 720 ? 17 : 20);
  // 繪製答案區標題文字。
  text('選擇答案', answerBoxes[0].x, answerBoxes[0].y - 25);
  // 逐一繪製每個尚未配對的文字選項。
  for (let index = 0; index < answerBoxes.length; index += 1) {
    // 取得目前答案按鈕的位置與題目索引。
    const box = answerBoxes[index];
    // 已放入任一目標框的答案不再顯示於選項區。
    const alreadyPlaced = placements.includes(box.itemIndex);
    // 被拖曳中的答案改由滑鼠位置繪製。
    const isDragging = draggingAnswer === box.itemIndex;
    // 被放入框中的答案保留原位置空白，其他答案照常顯示。
    if (alreadyPlaced || isDragging) continue;
    // 繪製答案按鈕白色底板。
    fill('#ffffff');
    // 繪製答案按鈕柔和陰影。
    drawingContext.shadowColor = 'rgba(39, 73, 64, 0.10)';
    // 設定答案按鈕陰影模糊。
    drawingContext.shadowBlur = 10;
    // 設定答案按鈕陰影垂直位移。
    drawingContext.shadowOffsetY = 3;
    // 畫出答案按鈕圓角底板。
    rect(box.x, box.y, box.w, box.h, 12);
    // 清除陰影避免影響後續畫面。
    drawingContext.shadowColor = 'transparent';
    // 清除答案按鈕陰影模糊。
    drawingContext.shadowBlur = 0;
    // 清除答案按鈕陰影位移。
    drawingContext.shadowOffsetY = 0;
    // 以置中方式繪製答案文字。
    textAlign(CENTER, CENTER);
    // 使用深色文字保持可讀性。
    fill('#36584f');
    // 依裝置寬度設定答案字級。
    textSize(width < 720 ? 14 : 18);
    // 繪製答案選項文字。
    text(quizItems[box.itemIndex].answer, box.x + 5, box.y + 1, box.w - 10, box.h - 2);
  }
  // 拖曳時讓答案按鈕跟隨指標，並顯示在最上層。
  if (draggingAnswer !== null) {
    // 繪製拖曳中的白色答案底板。
    fill('#fff1d4');
    // 繪製跟隨指標的答案按鈕。
    // 依螢幕寬度設定拖曳卡片寬度，避免超出畫布。
    const dragWidth = Math.min(width - 24, width < 720 ? 260 : 320);
    // 依裝置尺寸設定拖曳卡片高度。
    const dragHeight = width < 720 ? 56 : 64;
    rect(pointerPosition.x - dragWidth / 2, pointerPosition.y - dragHeight / 2, dragWidth, dragHeight, 12);
    // 使用置中方式顯示拖曳中的答案文字。
    textAlign(CENTER, CENTER);
    // 使用深色文字讓拖曳內容清晰。
    fill('#36584f');
    // 設定拖曳文字大小。
    textSize(width < 720 ? 14 : 18);
    // 繪製跟隨指標的答案文字。
    text(quizItems[draggingAnswer].answer, pointerPosition.x, pointerPosition.y, dragWidth - 16, dragHeight - 8);
  }
}

// 繪製交卷按鈕或成績覆蓋畫面。
function drawFooter() {
  // 交卷後改為顯示成績與重新作答按鈕。
  if (submitted) {
    // 繪製半透明成績背景遮罩。
    fill(255, 250, 242, 235);
    // 覆蓋畫布以聚焦成績內容。
    rect(0, 0, width, height);
    // 將成績文字置中對齊。
    textAlign(CENTER, CENTER);
    // 使用深綠色顯示完成標題。
    fill('#244b45');
    // 依裝置尺寸設定成績標題字級。
    textSize(width < 720 ? 34 : 48);
    // 顯示完成提示。
    text('測驗完成！', width / 2, height * 0.39);
    // 依答對題數計算百分比成績。
    const score = Math.round((correctCount / quizItems.length) * 100);
    // 使用珊瑚色凸顯成績數字。
    fill('#e7765d');
    // 設定成績數字字級。
    textSize(width < 720 ? 68 : 90);
    // 顯示百分比成績。
    text(`${score} 分`, width / 2, height * 0.50);
    // 使用灰綠色顯示答題摘要。
    fill('#5f7770');
    // 設定摘要字級。
    textSize(width < 720 ? 18 : 22);
    // 顯示答對題數與鼓勵語。
    text(`${correctCount} 題答對　${score > 80 ? '太棒了，生活小達人！' : '再練習一次會更厲害！'}`, width / 2, height * 0.58);
    // 繪製重新作答按鈕。
    drawButton(width / 2 - 82, height * 0.66, 164, 48, '再玩一次', '#315f54');
    // 完成成績畫面繪製後結束函式。
    return;
  }
  // 僅在六個目標框都有答案時啟用交卷按鈕。
  const readyToSubmit = placements.every((answer) => answer !== null);
  // 依答案區位置決定按鈕的垂直位置。
  const lastAnswer = answerBoxes[answerBoxes.length - 1];
  // 在全部答案下方預留按鈕位置。
  const buttonY = lastAnswer.y + lastAnswer.h + 22;
  // 繪製尚未完成時的提示文字。
  if (!readyToSubmit) {
    // 將提示文字置中顯示。
    textAlign(CENTER, CENTER);
    // 使用柔和灰綠色顯示完成提示。
    fill('#8b9b94');
    // 設定提示文字大小。
    textSize(width < 720 ? 15 : 18);
    // 提醒使用者先完成六個配對。
    text('完成六個配對後即可交卷', width / 2, buttonY + 24);
  } else {
    // 顯示已可使用的交卷按鈕。
    drawButton(width / 2 - 82, buttonY, 164, 48, '交卷看成績', '#315f54');
  }
}

// 繪製一致風格的圓角按鈕。
function drawButton(x, y, buttonWidth, buttonHeight, label, color) {
  // 設定按鈕填色。
  fill(color);
  // 繪製圓角按鈕外型。
  rect(x, y, buttonWidth, buttonHeight, 14);
  // 將按鈕文字置中。
  textAlign(CENTER, CENTER);
  // 使用白色顯示按鈕文字。
  fill('#ffffff');
  // 設定按鈕文字大小。
  textSize(18);
  // 繪製按鈕標籤。
  text(label, x, y + 1, buttonWidth, buttonHeight);
}

// 繪製小型圓角進度標籤。
function drawPill(x, y, pillWidth, pillHeight, label, fillColor, textColor) {
  // 設定標籤背景色。
  fill(fillColor);
  // 繪製膠囊形進度背景。
  rect(x, y, pillWidth, pillHeight, pillHeight / 2);
  // 將標籤文字置中。
  textAlign(CENTER, CENTER);
  // 設定標籤文字顏色。
  fill(textColor);
  // 設定標籤字級。
  textSize(16);
  // 顯示已完成題數。
  text(label, x, y + 1, pillWidth, pillHeight);
}

// 產生成績超過八十分時使用的彩帶粒子。
function createConfetti() {
  // 先清除前一次成績留下的粒子。
  confetti = [];
  // 建立足以覆蓋畫面中央的彩帶數量。
  for (let index = 0; index < 120; index += 1) {
    // 隨機設定彩帶起始水平位置。
    const x = random(width);
    // 從畫面上方隨機高度開始落下。
    const y = random(-height, 0);
    // 保存彩帶顏色、大小與落下速度。
    confetti.push({ x, y, speed: random(2, 6), size: random(5, 10), hue: random(['#ff8a70', '#f5b84b', '#54b9aa', '#6b9ed6', '#e77e9c']) });
  }
}

// 更新並繪製成績畫面上的彩帶效果。
function drawConfetti() {
  // 沒有彩帶時不執行粒子繪製。
  if (confetti.length === 0 || !submitted || correctCount / quizItems.length <= 0.8) return;
  // 逐一更新並繪製彩帶粒子。
  for (const piece of confetti) {
    // 持續讓彩帶向下落下。
    piece.y += piece.speed;
    // 讓彩帶左右輕微飄動。
    piece.x += Math.sin(frameCount * 0.03 + piece.y) * 0.7;
    // 設定目前彩帶顏色。
    fill(piece.hue);
    // 繪製小型旋轉感彩帶方片。
    rect(piece.x, piece.y, piece.size, piece.size * 0.55, 2);
    // 彩帶落出畫面後從頂端重新出現。
    if (piece.y > height + 10) piece.y = random(-50, -10);
  }
}

// 點擊答案開始拖曳，點擊完成按鈕則交卷。
function mousePressed() {
  // 保存目前指標座標供拖曳繪圖使用。
  pointerPosition = { x: mouseX, y: mouseY };
  // 已交卷時點擊重新作答按鈕便重設測驗。
  if (submitted && isInside(mouseX, mouseY, width / 2 - 82, height * 0.66, 164, 48)) {
    // 清空所有已放入的答案。
    placements = Array(quizItems.length).fill(null);
    // 解除交卷狀態。
    submitted = false;
    // 清除上次的答對題數。
    correctCount = 0;
    // 清除上次成績的彩帶粒子。
    confetti = [];
    // 完成重設後避免繼續處理同一次點擊。
    return false;
  }
  // 已交卷時不再接受答案拖曳。
  if (submitted) return false;
  // 全部配對完成後，點擊按鈕即可交卷。
  const finalAnswer = answerBoxes[answerBoxes.length - 1];
  // 計算交卷按鈕所在位置。
  const buttonY = finalAnswer.y + finalAnswer.h + 22;
  // 確認按鈕可見且目前點擊位置落在按鈕內。
  if (placements.every((answer) => answer !== null) && isInside(mouseX, mouseY, width / 2 - 82, buttonY, 164, 48)) {
    // 計算每題是否配對正確。
    correctCount = placements.filter((answer, index) => answer === index).length;
    // 標記測驗已交卷。
    submitted = true;
    // 答對超過八成時建立彩帶動畫。
    if (correctCount / quizItems.length > 0.8) createConfetti();
    // 完成交卷後結束點擊事件。
    return false;
  }
  // 從答案按鈕開始拖曳尚未使用的文字選項。
  for (const box of answerBoxes) {
    // 已經放入目標框的選項不能再從原位置拖曳。
    if (placements.includes(box.itemIndex)) continue;
    // 只有點擊答案按鈕範圍才開始拖曳。
    if (isInside(mouseX, mouseY, box.x, box.y, box.w, box.h)) {
      // 保存目前拖曳的答案索引。
      draggingAnswer = box.itemIndex;
      // 讓答案按鈕跟隨目前指標位置。
      pointerPosition = { x: mouseX, y: mouseY };
      // 拖曳期間顯示抓取游標。
      cursor(HAND);
      // 阻止瀏覽器執行預設滑鼠行為。
      return false;
    }
  }
  // 未點擊答案按鈕時不執行其他操作。
  return false;
}

// 拖曳時持續更新答案位置。
function mouseDragged() {
  // 僅在答案拖曳狀態更新指標位置。
  if (draggingAnswer !== null) pointerPosition = { x: mouseX, y: mouseY };
  // 阻止觸控裝置拖曳時觸發頁面捲動。
  return false;
}

// 放開答案時將答案配對到所在的題目目標框。
function mouseReleased() {
  // 放開時先恢復一般游標樣式。
  cursor(ARROW);
  // 沒有正在拖曳的答案時不需處理放置。
  if (draggingAnswer === null) return false;
  // 尋找指標目前所在的題目目標框。
  for (let index = 0; index < questionBoxes.length; index += 1) {
    // 取得目前題目的目標框與幾何資訊。
    const question = questionBoxes[index];
    // 計算題目答案框的垂直位置。
    const targetY = question.y + question.h - (width < 720 ? 43 : 53);
    // 確認指標是否放在題目卡片的答案框區域。
    if (isInside(mouseX, mouseY, question.x + 5, targetY, question.w - 10, width < 720 ? 39 : 49)) {
      // 若目標框已有答案，先釋放被替換的答案。
      placements[index] = draggingAnswer;
      // 完成一次配對後停止拖曳狀態。
      draggingAnswer = null;
      // 結束放置事件並更新畫面。
      return false;
    }
  }
  // 放到卡片外時保持答案留在選項區。
  draggingAnswer = null;
  // 完成放置事件後更新畫面。
  return false;
}

// 判斷座標是否落在指定的矩形範圍內。
function isInside(x, y, boxX, boxY, boxWidth, boxHeight) {
  // 以矩形四邊界進行命中測試。
  return x >= boxX && x <= boxX + boxWidth && y >= boxY && y <= boxY + boxHeight;
}

// 視窗尺寸改變時同步調整滿版畫布。
function windowResized() {
  // 讓畫布填滿最新的視窗尺寸。
  resizeCanvas(windowWidth, windowHeight);
  // 重新繪製以立即套用響應式版面。
  redraw();
}
