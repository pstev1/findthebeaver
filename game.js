const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = 'title';

// Load images
const beaverImage = new Image();
beaverImage.src = 'beaver.png';
beaverImage.onerror = function() {
  console.error('Error loading beaver image.');
};

const rockImage = new Image();
rockImage.src = 'rock.png';
rockImage.onerror = function() {
  console.error('Error loading rock image.');
};

const chaserImage = new Image();
chaserImage.src = 'beaver.png'; // Ensure this image exists
chaserImage.onerror = function() {
  console.error('Error loading chaser image.');
};

// Event listener for Enter key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    if (gameState === 'title') {
      startGame();
    } else if (gameState === 'gameOver' || gameState === 'win') {
      resetGame();
    }
  }
});

function startGame() {
  // Wait until images are loaded
  if (
    beaverImage.complete &&
    rockImage.complete &&
    chaserImage.complete
  ) {
    document.getElementById('title').style.display = 'none';
    document.getElementById('prompt').style.display = 'none';
    canvas.style.display = 'block';
    gameState = 'playing';
    initGame();
    gameLoop();
  } else {
    // If images are not yet loaded, wait a bit and try again
    setTimeout(startGame, 100);
  }
}

function resetGame() {
  gameState = 'title';
  document.getElementById('title').style.display = 'block';
  document.getElementById('prompt').style.display = 'block';
  document.getElementById('title').innerText = 'Find The Beaver';
  document.getElementById('prompt').innerText = 'Press Enter to Start';
  canvas.style.display = 'none';
}

// Player Object
let player = {
  x: (canvas.width - 20) / 2,
  y: (canvas.height - 20) / 2,
  speed: 5, // Player's speed
  width: 20,
  height: 20,
  color: 'blue',
};

// Chaser Object
let chaser = {
  x: 0,
  y: 0,
  width: 30,
  height: 30,
  speed: player.speed, // Match chaser's speed to player's speed
};

// Update Function
function update() {
  // Keep chaser speed synced with player speed
  chaser.speed = player.speed;

  movePlayer();
  moveChaser();
  checkCollisions();
  checkChaserCollision();
};

let keys = {};

document.addEventListener('keydown', function(event) {
  keys[event.key] = true;
});

document.addEventListener('keyup', function(event) {
  keys[event.key] = false;
});

function movePlayer() {
  if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
  if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
  if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
  if (keys['ArrowRight'] || keys['d']) player.x += player.speed;

  // Keep player within canvas bounds
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

function moveChaser() {
  let dx = player.x - chaser.x;
  let dy = player.y - chaser.y;
  let distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > 0) {
    let nx = dx / distance;
    let ny = dy / distance;

    chaser.x += nx * chaser.speed;
    chaser.y += ny * chaser.speed;
  }
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawChaser() {
  ctx.drawImage(chaserImage, chaser.x, chaser.y, chaser.width, chaser.height);
}

let gameObjects = [];
const objectSize = 30;
const numObjects = 10;

function initGame() {
  player.x = (canvas.width - player.width) / 2;
  player.y = (canvas.height - player.height) / 2;

  chaser.x = 0;
  chaser.y = 0;

  gameObjects = [];
  for (let i = 0; i < numObjects; i++) {
    let obj = {
      width: objectSize,
      height: objectSize,
      revealed: false,
      type: 'rock',
    };

    let validPosition = false;
    while (!validPosition) {
      obj.x = Math.random() * (canvas.width - obj.width);
      obj.y = Math.random() * (canvas.height - obj.height);

      if (isOverlapping(obj, player) || isOverlapping(obj, chaser)) continue;

      let overlap = false;
      for (let existingObj of gameObjects) {
        if (isOverlapping(obj, existingObj)) {
          overlap = true;
          break;
        }
      }

      if (!overlap) validPosition = true;
    }

    gameObjects.push(obj);
  }

  const beaverIndex = Math.floor(Math.random() * gameObjects.length);
  gameObjects[beaverIndex].type = 'beaver';
}

function drawObjects() {
  gameObjects.forEach(obj => {
    if (!obj.revealed) {
      ctx.fillStyle = 'gray';
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      ctx.fillText('?', obj.x + obj.width / 2 - 5, obj.y + obj.height / 2 + 7);
    } else {
      if (obj.type === 'beaver') {
        ctx.drawImage(beaverImage, obj.x, obj.y, obj.width, obj.height);
      } else if (obj.type === 'rock') {
        ctx.drawImage(rockImage, obj.x, obj.y, obj.width, obj.height);
      }
    }
  });
}

function checkCollisions() {
  gameObjects.forEach(obj => {
    if (!obj.revealed && isColliding(player, obj)) {
      obj.revealed = true;
      if (obj.type === 'beaver') {
        gameState = 'win';
        showEndScreen('You found the beaver!');
      }
    }
  });
}

function checkChaserCollision() {
  if (isColliding(player, chaser)) {
    gameState = 'gameOver';
    showEndScreen('Game Over');
  }
}

function isColliding(rect1, rect2) {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect1.x > rect2.x + rect2.width ||
    rect1.y + rect1.height < rect2.y ||
    rect1.y > rect2.y + rect2.height
  );
}

function isOverlapping(rect1, rect2) {
  return !(
    rect1.x + rect1.width <= rect2.x ||
    rect1.x >= rect2.x + rect2.width ||
    rect1.y + rect1.height <= rect2.y ||
    rect1.y >= rect2.y + rect2.height
  );
}

function gameLoop() {
  if (gameState === 'playing') {
    requestAnimationFrame(gameLoop);
    update();
    render();
  }
}

function update() {
  movePlayer();
  moveChaser();
  checkCollisions();
  checkChaserCollision();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayer();
  drawObjects();
  drawChaser();
}

function showEndScreen(message) {
  setTimeout(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = 'none';
    document.getElementById('title').style.display = 'block';
    document.getElementById('title').innerText = message;
    document.getElementById('prompt').style.display = 'block';
    document.getElementById('prompt').innerText = 'Press Enter to Restart';
  }, 1000);
}
