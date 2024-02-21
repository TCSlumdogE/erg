// Canvas setup and global variables
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const characterWidth = 100;
const characterHeight = 150;
let enemySpeed = 100;
let gamePill = new Pill();
let bennysBullets = [];
let patriotsBullets = [];
let lastEnemyShootTime = Date.now();
let reloadInterval = 5000;
let bennysCanShoot = true;
let patriotsCanShoot = true;
let selectedSide = null;
let scores = { Patriots: 0, Bennys: 0 };
let health = { Patriots: 500, Bennys: 500 };
let bennysCharacter = new Image();
bennysCharacter.src = "bennys_char.png";
let patriotsCharacter = new Image();
patriotsCharacter.src = "patriots_char.png";
let obstacles = [];
let numberOfObstacles = 8;
let obstacleMinVelocity = -1;
let obstacleMaxVelocity = 1;
let bennysDirection = 1;
let patriotsDirection = -1;

// Pill class
class Pill {
  constructor() { this.reset(); }
  draw(ctx) {
    if (!this.collected) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(2, 1);
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2, true);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "black";
      ctx.font = `${this.radius}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Oxy", this.x, this.y);
    }
  }
  reset() {
    this.x = Math.random() * (canvas.width - 40) + 20;
    this.y = Math.random() * (canvas.height - 20) + 10;
    this.radius = 10;
    this.collected = false;
  }
  collect(collector) {
    this.collected = true;
    this.triggerBarrage(collector);
  }
  triggerBarrage(collector) {
    const duration = 2000;
    const end = Date.now() + duration;
    const interval = 400;
    const angles = 8;
    const bulletsArray = collector === "Bennys" ? bennysBullets : patriotsBullets;
    const shoot = () => {
      if (Date.now() < end) {
        for (let i = 0; i < angles; i++) {
          const angle = (Math.PI * 2 * i) / angles;
          bulletsArray.push(new Bullet(
            collector === "Bennys" ? bennysCharacterX + characterWidth / 2 : patriotsCharacterX + characterWidth / 2,
            collector === "Bennys" ? bennysCharacterY + characterHeight / 2 : patriotsCharacterY + characterHeight / 2,
            Math.cos(angle),
            Math.sin(angle)
          ));
        }
        setTimeout(shoot, interval);
      }
    };
    shoot();
  }
}

// Bullet class
class Bullet {
  constructor(x, y, velocityX, velocityY) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY || 0;
    this.speed = 7;
    this.width = 10;
    this.height = 5;
  }
  move() {
    this.x += this.velocityX * this.speed;
    this.y += this.velocityY * this.speed;
  }
  draw(ctx) {
    ctx.fillStyle = "yellow";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// Game initialization and control functions
window.addEventListener("resize", resizeCanvas, false);
resizeCanvas();
document.addEventListener("keydown", handleCharacterMovement);
const bennysLogoElement = document.getElementById("bennys");
const patriotsLogoElement = document.getElementById("patriots");
bennysLogoElement.addEventListener("click", () => { selectSide("Bennys"); });
patriotsLogoElement.addEventListener("click", () => { selectSide("Patriots"); });

function selectSide(side) {
  selectedSide = side;
  startGame();
}

function startGame() {
    document.getElementById("playerSelection").style.display = "none";
    document.getElementById("gameCanvas").style.display = "block";
    let gameHeader = document.getElementById("gameHeader");
    gameHeader.classList.add("teamVisible");
    gameHeader.style.display = "flex";

    let teamDisplays = document.getElementsByClassName("teamDisplay");
    for (let i = 0; i < teamDisplays.length; i++) {
        teamDisplays[i].style.display = "flex";
    }

    bennysCharacterY = (canvas.height - characterHeight) / 2;
    patriotsCharacterY = (canvas.height - characterHeight) / 2;
    bennysCharacterX = 50;
    patriotsCharacterX = canvas.width - characterWidth - 50;

    resizeCanvas();
    generateRandomObstacles();
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    const maxWidth = window.innerWidth * 0.98;
    const maxHeight = window.innerHeight * 0.75;
    const aspectRatio = 16 / 9;

    let newWidth = maxWidth;
    let newHeight = newWidth / aspectRatio;
    if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * aspectRatio;
    }

    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
    canvas.width = newWidth;
    canvas.height = newHeight;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawObstacles();
    gamePill.draw(ctx);
    checkPillCollection();

    drawCharacter(bennysCharacter, bennysCharacterX, bennysCharacterY, characterWidth, characterHeight, bennysDirection);
    drawCharacter(patriotsCharacter, patriotsCharacterX, patriotsCharacterY, characterWidth, characterHeight, patriotsDirection);

    updateBullets(bennysBullets, ctx, canvas.width, canvas.height);
    updateBullets(patriotsBullets, ctx, canvas.width, canvas.height);
    drawScoresAndHealth();
    requestAnimationFrame(gameLoop);
}

function drawCharacter(characterImage, x, y, width, height, direction) {
    ctx.save();
    if (direction === -1) {
        ctx.scale(-1, 1);
        ctx.drawImage(characterImage, -x - width, y, width, height);
    } else {
        ctx.drawImage(characterImage, x, y, width, height);
    }
    ctx.restore();
}

function generateRandomObstacles() {
    obstacles = [];
    for (let i = 0; i < numberOfObstacles; i++) {
        let width = Math.random() * (150 - 50) + 50;
        let height = Math.random() * (100 - 30) + 30;
        let x = Math.random() * (canvas.width - width);
        let y = Math.random() * (canvas.height - height);
        let vx = Math.random() * (obstacleMaxVelocity - obstacleMinVelocity) + obstacleMinVelocity;
        let vy = Math.random() * (obstacleMaxVelocity - obstacleMinVelocity) + obstacleMinVelocity;
        obstacles.push({ x, y, width, height, vx, vy });
    }
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = "red";
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

function checkPillCollection() {
    // Function to check if either character collects the pill
    const checkCollection = (characterX, characterY, collectorName) => {
        if (!gamePill.collected) {
            const dx = characterX - gamePill.x;
            const dy = characterY - gamePill.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < characterWidth / 2 + gamePill.radius) {
                gamePill.collect(collectorName);
                setTimeout(() => gamePill.reset(), Math.random() * (15000 - 5000) + 5000); // Respawn time between 5 and 15 seconds
            }
        }
    };

    checkCollection(bennysCharacterX + characterWidth / 2, bennysCharacterY + characterHeight / 2, 'Bennys');
    checkCollection(patriotsCharacterX + characterWidth / 2, patriotsCharacterY + characterHeight / 2, 'Patriots');
}

function updateBullets(bullets, ctx, canvasWidth, canvasHeight) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];
        bullet.move();
        if (bullet.x < 0 || bullet.x > canvasWidth || bullet.y < 0 || bullet.y > canvasHeight) {
            bullets.splice(i, 1); // Remove bullet if it goes off screen
        } else {
            bullet.draw(ctx);
        }
    }
}

function drawScoresAndHealth() {
    // Display scores and health
    document.getElementById('bennysScore').textContent = `Bennys: ${scores.Bennys}`;
    document.getElementById('patriotsScore').textContent = `Patriots: ${scores.Patriots}`;
    document.getElementById('bennysHealth').style.width = `${(health.Bennys / 500) * 100}%`;
    document.getElementById('patriotsHealth').style.width = `${(health.Patriots / 500) * 100}%`;
}

function handleCharacterMovement(event) {
    if (!selectedSide) return; // Don't handle movement if no side is selected
    const move = (dx, dy, direction) => {
        const newX = selectedSide === 'Bennys' ? bennysCharacterX + dx : patriotsCharacterX + dx;
        const newY = selectedSide === 'Bennys' ? bennysCharacterY + dy : patriotsCharacterY + dy;
        if (!isCollidingWithObstacle(newX, newY)) {
            if (selectedSide === 'Bennys') {
                bennysCharacterX = newX;
                bennysCharacterY = newY;
                bennysDirection = direction;
            } else {
                patriotsCharacterX = newX;
                patriotsCharacterY = newY;
                patriotsDirection = direction;
            }
        }
    };
    
    switch (event.key) {
        case 'ArrowUp': move(0, -10, selectedSide === 'Bennys' ? bennysDirection : patriotsDirection); break;
        case 'ArrowDown': move(0, 10, selectedSide === 'Bennys' ? bennysDirection : patriotsDirection); break;
        case 'ArrowLeft': move(-10, 0, -1); break;
        case 'ArrowRight': move(10, 0, 1); break;
    }
}

function isCollidingWithObstacle(x, y) {
    return obstacles.some(obstacle => x + characterWidth > obstacle.x && x < obstacle.x + obstacle.width && y + characterHeight > obstacle.y && y < obstacle.y + obstacle.height);
}
