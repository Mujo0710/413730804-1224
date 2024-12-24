let sprites = {};  // 儲存所有動畫圖片
let backgroundImg;  // 背景圖片
let effectImgs = {};  // 效果動畫圖片
let effects = [];  // 儲存所有正在播放的效果
let gameState = 'playing';  // 'playing', 'gameover'
let player1Wins = 0;
let player2Wins = 0;

// 角色1的狀態
let char1 = {
  x: 0,
  y: 0,
  animation: 'idle',
  frameIndex: 0,
  lastFrameTime: 0,
  health: 100  // 添加血量屬性
};

// 角色2的狀態
let char2 = {
  x: 0,
  y: 0,
  animation: 'idle',
  frameIndex: 0,
  lastFrameTime: 0,
  health: 100  // 添加血量屬性
};

// 精靈的設置
const SPRITE1_WIDTH = 20.8;    // 角色1的寬度
const SPRITE1_HEIGHT = 18;     // 角色1的高度
const SPRITE2_WIDTH = 18;      // 角色2的寬度
const SPRITE2_HEIGHT = 18;     // 角色2的高度
const CHAR1_SCALE = 3;         // 角色1的放大倍率
const CHAR2_SCALE = 3;         // 角色2的放大倍率
const FRAME_COUNT = 2;
const FRAME_DELAY = 100;
const MOVE_SPEED = 5;

// 效果的設置
const EFFECT_SOURCE_WIDTH = 150;
const EFFECT_SOURCE_HEIGHT = 150;
const EFFECT_DISPLAY_WIDTH = 50;
const EFFECT_DISPLAY_HEIGHT = 50;
const EFFECT_SPEED = 10;
const EFFECT_FRAME_COUNT = 3;
const EFFECT_FRAME_DELAY = 50;

function preload() {
  // 載入角色1的動畫圖片
  sprites.char1 = {
    idle: loadImage('image/chac1/stop.png'),
    left: loadImage('image/chac1/A.png'),
    right: loadImage('image/chac1/D.png'),
    up: loadImage('image/chac1/W.png'),
    down: loadImage('image/chac1/S.png')
  };
  
  // 載入角色2的動畫圖片
  sprites.char2 = {
    idle: loadImage('image/chac2/stop.png'),
    left: loadImage('image/chac2/left.png'),
    right: loadImage('image/chac2/right.png'),
    up: loadImage('image/chac2/up.png'),
    down: loadImage('image/chac2/down.png')
  };
  
  backgroundImg = loadImage('image/background/1.png');
  
  // 載入效果圖片
  effectImgs.effect1 = loadImage('image/effect/all1.png');
  effectImgs.effect2 = loadImage('image/effect/all2.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  
  // 設置兩個角色的初始位置
  char1.x = width/3;
  char1.y = height/2;
  char2.x = width*2/3;
  char2.y = height/2;
}

class Effect {
  constructor(x, y, direction, type) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.type = type;  // 'effect1' 或 'effect2'
    this.frameIndex = 0;
    this.lastFrameTime = 0;
    this.width = EFFECT_DISPLAY_WIDTH;
    this.height = EFFECT_DISPLAY_HEIGHT;
    this.active = true;  // 新增：標記效果是否有效
  }
  
  update() {
    if (millis() - this.lastFrameTime > EFFECT_FRAME_DELAY) {
      this.frameIndex = (this.frameIndex + 1) % EFFECT_FRAME_COUNT;
      this.lastFrameTime = millis();
    }
    
    switch(this.direction) {
      case 'left': this.x -= EFFECT_SPEED; break;
      case 'right': this.x += EFFECT_SPEED; break;
      case 'up': this.y -= EFFECT_SPEED; break;
      case 'down': this.y += EFFECT_SPEED; break;
    }
    
    return this.x < -EFFECT_DISPLAY_WIDTH || this.x > width + EFFECT_DISPLAY_WIDTH ||
           this.y < -EFFECT_DISPLAY_HEIGHT || this.y > height + EFFECT_DISPLAY_HEIGHT;
  }
  
  draw() {
    let sx = this.frameIndex * EFFECT_SOURCE_WIDTH;
    image(
      effectImgs[this.type],
      this.x,
      this.y,
      EFFECT_DISPLAY_WIDTH,
      EFFECT_DISPLAY_HEIGHT,
      sx,
      0,
      EFFECT_SOURCE_WIDTH,
      EFFECT_SOURCE_HEIGHT
    );
  }
  
  // 新增：碰撞檢測方法
  checkCollision(char, charSprite) {
    if (!this.active) return false;
    
    let charWidth = (charSprite === 'char1' ? SPRITE1_WIDTH : SPRITE2_WIDTH) * 
                    (charSprite === 'char1' ? CHAR1_SCALE : CHAR2_SCALE);
    let charHeight = (charSprite === 'char1' ? SPRITE1_HEIGHT : SPRITE2_HEIGHT) * 
                     (charSprite === 'char1' ? CHAR1_SCALE : CHAR2_SCALE);
    
    return this.x - this.width/2 < char.x + charWidth/2 &&
           this.x + this.width/2 > char.x - charWidth/2 &&
           this.y - this.height/2 < char.y + charHeight/2 &&
           this.y + this.height/2 > char.y - charHeight/2;
  }
}

function draw() {
  image(backgroundImg, width/2, height/2, width, height);
  
  // 添加常駐字幕
  textSize(32);
  textAlign(CENTER);
  fill(255);
  stroke(0);
  strokeWeight(2);
  text("淡江教育科技", width/2, height - 30);
  
  if (gameState === 'playing') {
    handleMovement();
    
    // 更新和繪製效果，並檢查碰撞
    for (let i = effects.length - 1; i >= 0; i--) {
      let effect = effects[i];
      effect.draw();
      
      // 檢查碰撞
      if (effect.type === 'effect1' && effect.checkCollision(char2, 'char2')) {
        char2.health = max(0, char2.health - 10);
        effect.active = false;
        // 檢查是否遊戲結束
        if (char2.health <= 0) {
          gameState = 'gameover';
          player1Wins++;
        }
      }
      else if (effect.type === 'effect2' && effect.checkCollision(char1, 'char1')) {
        char1.health = max(0, char1.health - 10);
        effect.active = false;
        // 檢查是否遊戲結束
        if (char1.health <= 0) {
          gameState = 'gameover';
          player2Wins++;
        }
      }
      
      if (effect.update() || !effect.active) {
        effects.splice(i, 1);
      }
    }
    
    // 繪製角色
    drawCharacter(char1, 'char1');
    drawCharacter(char2, 'char2');
    
    // 繪製血量條
    drawHealthBars();
  } else if (gameState === 'gameover') {
    // 繪製遊戲結束畫面
    drawGameOver();
  }
  
  // 總是顯示比分
  drawScore();
  
  // 添加操作說明
  drawControls();
}

function drawCharacter(char, spriteKey) {
  // 更新動畫幀
  if (char.animation !== 'idle') {
    if (millis() - char.lastFrameTime > FRAME_DELAY) {
      char.frameIndex = (char.frameIndex + 1) % FRAME_COUNT;
      char.lastFrameTime = millis();
    }
  } else {
    char.frameIndex = 0;
  }
  
  let currentSprite = sprites[spriteKey][char.animation];
  // 根據角色選擇對應的寬高和放大倍率
  let spriteWidth = spriteKey === 'char1' ? SPRITE1_WIDTH : SPRITE2_WIDTH;
  let spriteHeight = spriteKey === 'char1' ? SPRITE1_HEIGHT : SPRITE2_HEIGHT;
  let scale = spriteKey === 'char1' ? CHAR1_SCALE : CHAR2_SCALE;
  let sx = char.frameIndex * spriteWidth;
  
  image(
    currentSprite,
    char.x,
    char.y,
    spriteWidth * scale,    // 使用放大倍率
    spriteHeight * scale,   // 使用放大倍率
    sx,
    0,
    spriteWidth,
    spriteHeight
  );
}

function handleMovement() {
  // 角色1的移動控制 (WASD)
  if (keyIsDown(65)) { // A
    char1.x -= MOVE_SPEED;
    char1.animation = 'left';
  }
  else if (keyIsDown(68)) { // D
    char1.x += MOVE_SPEED;
    char1.animation = 'right';
  }
  else if (keyIsDown(87)) { // W
    char1.y -= MOVE_SPEED;
    char1.animation = 'up';
  }
  else if (keyIsDown(83)) { // S
    char1.y += MOVE_SPEED;
    char1.animation = 'down';
  }
  else {
    char1.animation = 'idle';
  }
  
  // 角色2的移動控制 (方向鍵)
  if (keyIsDown(LEFT_ARROW)) {
    char2.x -= MOVE_SPEED;
    char2.animation = 'left';
  }
  else if (keyIsDown(RIGHT_ARROW)) {
    char2.x += MOVE_SPEED;
    char2.animation = 'right';
  }
  else if (keyIsDown(UP_ARROW)) {
    char2.y -= MOVE_SPEED;
    char2.animation = 'up';
  }
  else if (keyIsDown(DOWN_ARROW)) {
    char2.y += MOVE_SPEED;
    char2.animation = 'down';
  }
  else {
    char2.animation = 'idle';
  }
  
  // 限制角色在畫面內（使用放大後的寬高）
  char1.x = constrain(char1.x, SPRITE1_WIDTH * CHAR1_SCALE/2, width - SPRITE1_WIDTH * CHAR1_SCALE/2);
  char1.y = constrain(char1.y, SPRITE1_HEIGHT * CHAR1_SCALE/2, height - SPRITE1_HEIGHT * CHAR1_SCALE/2);
  char2.x = constrain(char2.x, SPRITE2_WIDTH * CHAR2_SCALE/2, width - SPRITE2_WIDTH * CHAR2_SCALE/2);
  char2.y = constrain(char2.y, SPRITE2_HEIGHT * CHAR2_SCALE/2, height - SPRITE2_HEIGHT * CHAR2_SCALE/2);
}

function keyPressed() {
  // 角色1的攻擊 (F鍵)
  if (key === 'f' || key === 'F') {
    let direction = char1.animation === 'idle' ? 'right' : char1.animation;
    effects.push(new Effect(char1.x, char1.y, direction, 'effect1'));
  }
  
  // 角色2的攻擊 (0鍵)
  if (key === '0') {
    let direction = char2.animation === 'idle' ? 'right' : char2.animation;
    effects.push(new Effect(char2.x, char2.y, direction, 'effect2'));
  }
}

// 新增繪製血量條的函數
function drawHealthBars() {
  // 設置血量條樣式
  const barWidth = 200;
  const barHeight = 20;
  const margin = 20;
  
  // 繪製角色1的血量條（左上角）
  fill(255);  // 白色背景
  rect(margin, margin, barWidth, barHeight);
  fill(255, 0, 0);  // 紅色血量
  rect(margin, margin, barWidth * (char1.health/100), barHeight);
  
  // 繪製角色2的血量條（右上角）
  fill(255);  // 白色背景
  rect(width - margin - barWidth, margin, barWidth, barHeight);
  fill(255, 0, 0);  // 紅色血量
  rect(width - margin - barWidth, margin, barWidth * (char2.health/100), barHeight);
  
  // 顯示具體數值
  fill(0);  // 黑色文字
  textAlign(LEFT, CENTER);
  text(`P1: ${char1.health}%`, margin + 5, margin + barHeight/2);
  textAlign(RIGHT, CENTER);
  text(`P2: ${char2.health}%`, width - margin - 5, margin + barHeight/2);
}

// 新增遊戲結束畫面
function drawGameOver() {
  // 設置文字樣式
  textSize(64);
  textAlign(CENTER, CENTER);
  fill(255);
  stroke(0);
  strokeWeight(4);
  
  // 顯示獲勝者
  let winner = char1.health <= 0 ? "Player 2" : "Player 1";
  text(`${winner} Wins!`, width/2, height/3);
  
  // 顯示重新開始按鈕
  textSize(32);
  let buttonWidth = 200;
  let buttonHeight = 50;
  let buttonX = width/2 - buttonWidth/2;
  let buttonY = height * 2/3 - buttonHeight/2;
  
  // 檢查滑鼠是否懸停在按鈕上
  if (mouseX > buttonX && mouseX < buttonX + buttonWidth &&
      mouseY > buttonY && mouseY < buttonY + buttonHeight) {
    fill(200);
  } else {
    fill(150);
  }
  
  // 繪製按鈕
  rect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
  fill(0);
  noStroke();
  text("Restart", width/2, height * 2/3);
}

// 新增比分顯示
function drawScore() {
  textSize(32); // 調整文字大小使其與血量條相稱
  textAlign(CENTER, CENTER);
  fill(255);
  stroke(0);
  strokeWeight(2);
  
  // 將比分移到血量條的位置（margin = 20, barHeight = 20）
  text(`${player1Wins} - ${player2Wins}`, width/2, 30); // 30 = margin + barHeight/2
}

// 新增滑鼠點擊處理
function mousePressed() {
  if (gameState === 'gameover') {
    let buttonWidth = 200;
    let buttonHeight = 50;
    let buttonX = width/2 - buttonWidth/2;
    let buttonY = height * 2/3 - buttonHeight/2;
    
    // 檢查是否點擊重新開始按鈕
    if (mouseX > buttonX && mouseX < buttonX + buttonWidth &&
        mouseY > buttonY && mouseY < buttonY + buttonHeight) {
      resetGame();
    }
  }
}

// 新增重置遊戲函數
function resetGame() {
  // 重置角色狀態
  char1.health = 100;
  char2.health = 100;
  char1.x = width/3;
  char1.y = height/2;
  char2.x = width*2/3;
  char2.y = height/2;
  char1.animation = 'idle';
  char2.animation = 'idle';
  
  // 清空效果
  effects = [];
  
  // 重置遊戲狀態
  gameState = 'playing';
}

// 在檔案末尾添加新函數
function drawControls() {
  textSize(16);
  textAlign(LEFT);
  fill(255);
  stroke(0);
  strokeWeight(1);
  
  // 計算右下角的位置
  let rightMargin = width - 20;
  let bottomMargin = height - 120;
  
  // 玩家1控制說明
  text("玩家1控制:", rightMargin - 200, bottomMargin);
  text("W A S D - 移動", rightMargin - 200, bottomMargin + 20);
  text("F - 發射", rightMargin - 200, bottomMargin + 40);
  
  // 玩家2控制說明
  text("玩家2控制:", rightMargin - 200, bottomMargin + 70);
  text("↑ ← ↓ → - 移動", rightMargin - 200, bottomMargin + 90);
  text("0 - 發射", rightMargin - 200, bottomMargin + 110);
}
