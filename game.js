const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const characterWidth = 100;
const characterHeight = 150;
let enemySpeed = 100;

class Pill {
  constructor() {
    this.reset();
  }

  draw(ctx) {
    if (!this.collected) {
      ctx.save();

      ctx.translate(this.x, this.y);

      ctx.scale(2, 1);

      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2, true);
      ctx.closePath();

      ctx.restore();

      ctx.fillStyle = "white";
      ctx.fill();

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
    const bulletsArray =
      collector === "Bennys" ? bennysBullets : patriotsBullets;

    const shoot = () => {
      if (Date.now() < end) {
        for (let i = 0; i < angles; i++) {
          const angle = (Math.PI * 2 * i) / angles;
          const velocityX = Math.cos(angle);
          const velocityY = Math.sin(angle);
          bulletsArray.push(
            new Bullet(
              collector === "Bennys"
                ? bennysCharacterX + characterWidth / 2
                : patriotsCharacterX + characterWidth / 2,
              collector === "Bennys"
                ? bennysCharacterY + characterHeight / 2
                : patriotsCharacterY + characterHeight / 2,
              velocityX,
              velocityY
            )
          );
        }
        setTimeout(shoot, interval);
      }
    };
    shoot();
  }
}

let gamePill = new Pill();

function drawPill() {
  gamePill.draw(ctx);
}

function checkPillCollection() {
  checkCharacter(
    {
      x: bennysCharacterX + characterWidth / 2,
      y: bennysCharacterY + characterHeight / 2,
    },
    "Bennys"
  );

  checkCharacter(
    {
      x: patriotsCharacterX + characterWidth / 2,
      y: patriotsCharacterY + characterHeight / 2,
    },
    "Patriots"
  );
}

function checkCharacter(character, collector) {
  if (!gamePill.collected) {
    const distX = character.x - gamePill.x;
    const distY = character.y - gamePill.y;
    const distance = Math.sqrt(distX * distX + distY * distY);
    if (distance < characterWidth / 2 + gamePill.radius) {
      gamePill.collect(collector);
      const respawnTime = Math.random() * (15000 - 5000) + 5000;
      setTimeout(() => gamePill.reset(), respawnTime);
    }
  }
}

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
    this.y += (this.velocityY || 0) * this.speed;
  }

  draw(ctx) {
    ctx.fillStyle = "yellow";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

let bennysBullets = [];
let patriotsBullets = [];

let enemyShootInterval = 2000;
let lastEnemyShootTime = Date.now();
let enemyMoveInterval = 750;
let enemyLastMoveTime = Date.now();

window.addEventListener("resize", resizeCanvas, false);
resizeCanvas();

let lastBulletShotTime = 0;
const reloadInterval = 5000;

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

let selectedSide = null;
let scores = { Patriots: 0, Bennys: 0 };
let health = { Patriots: 500, Bennys: 500 };

let bennysCharacter = new Image();
bennysCharacter.src = "bennys_char.png";
let patriotsCharacter = new Image();
patriotsCharacter.src = "patriots_char.png";

window.addEventListener("resize", resizeCanvas, false);
document.addEventListener("keydown", handleCharacterMovement);

const bennysLogoElement = document.getElementById("bennys");
const patriotsLogoElement = document.getElementById("patriots");

bennysLogoElement.addEventListener("click", () => {
  selectedSide = "Bennys";
  startGame();
});

patriotsLogoElement.addEventListener("click", () => {
  selectedSide = "Patriots";
  startGame();
});

let animationFrameId;

function startGame() {
  let obstacles = [];
  generateRandomObstacles();

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

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

  animationFrameId = requestAnimationFrame(gameLoop);
}

let bennysDirection = 1;
let patriotsDirection = -1;

let numberOfObstacles = 8;
let obstacles = [];

let obstacleMinVelocity = -1;
let obstacleMaxVelocity = 1;

function generateRandomObstacles() {
  obstacles = [];
  for (let i = 0; i < numberOfObstacles; i++) {
    let width = Math.random() * (150 - 50) + 50;
    let height = Math.random() * (100 - 30) + 30;
    let x = Math.random() * (canvas.width - width);
    let y = Math.random() * (canvas.height - height);
    let vx = Math.random() * 1.5 - 0.75;
    let vy = Math.random() * 1.5 - 0.75;

    obstacles.push({ x, y, width, height, vx, vy });
  }
}

function drawObstacles() {
  obstacles.forEach((obstacle, index) => {
    const text = index % 2 === 0 ? "α" : "β";
    ctx.font = "48px serif";
    ctx.fillStyle = "red";
    ctx.fillText(text, obstacle.x, obstacle.y);
  });
}

function updateObstacles() {
  obstacles.forEach((obstacle) => {
    obstacle.x += obstacle.vx;
    obstacle.y += obstacle.vy;

    if (
      bennysCharacterX < obstacle.x + obstacle.width &&
      bennysCharacterX + characterWidth > obstacle.x &&
      bennysCharacterY < obstacle.y + obstacle.height &&
      bennysCharacterY + characterHeight > obstacle.y
    ) {
      const obstacleCenterX = obstacle.x + obstacle.width / 2;
      const obstacleCenterY = obstacle.y + obstacle.height / 2;
      const characterCenterX = bennysCharacterX + characterWidth / 2;
      const characterCenterY = bennysCharacterY + characterHeight / 2;

      const directionX = obstacleCenterX - characterCenterX;
      const directionY = obstacleCenterY - characterCenterY;

      const distance = Math.sqrt(
        directionX * directionX + directionY * directionY
      );

      const normalizedDirectionX = directionX / distance;
      const normalizedDirectionY = directionY / distance;

      obstacle.vx = (normalizedDirectionX * enemySpeed) / 10;
      obstacle.vy = (normalizedDirectionY * enemySpeed) / 10;
    }

    if (
      patriotsCharacterX < obstacle.x + obstacle.width &&
      patriotsCharacterX + characterWidth > obstacle.x &&
      patriotsCharacterY < obstacle.y + obstacle.height &&
      patriotsCharacterY + characterHeight > obstacle.y
    ) {
      const obstacleCenterX = obstacle.x + obstacle.width / 2;
      const obstacleCenterY = obstacle.y + obstacle.height / 2;
      const characterCenterX = patriotsCharacterX + characterWidth / 2;
      const characterCenterY = patriotsCharacterY + characterHeight / 2;

      const directionX = obstacleCenterX - characterCenterX;
      const directionY = obstacleCenterY - characterCenterY;

      const distance = Math.sqrt(
        directionX * directionX + directionY * directionY
      );

      const normalizedDirectionX = directionX / distance;
      const normalizedDirectionY = directionY / distance;

      obstacle.vx = (normalizedDirectionX * enemySpeed) / 10;
      obstacle.vy = (normalizedDirectionY * enemySpeed) / 10;
    }

    if (obstacle.x <= 0 || obstacle.x + obstacle.width >= canvas.width) {
      obstacle.vx = -obstacle.vx;
    }
    if (obstacle.y <= 0 || obstacle.y + obstacle.height >= canvas.height) {
      obstacle.vy = -obstacle.vy;
    }
  });
}

function isCollidingWithCharacter(
  obstacle,
  charX,
  charY,
  charWidth,
  charHeight
) {
  return (
    charX < obstacle.x + obstacle.width &&
    charX + charWidth > obstacle.x &&
    charY < obstacle.y + obstacle.height &&
    charY + charHeight > obstacle.y
  );
}

function isCollidingWithAnyObstacle(x, y) {
  return obstacles.some((obstacle) =>
    isCollidingWithCharacter(obstacle, x, y, characterWidth, characterHeight)
  );
}

function spawnPill() {
  gamePill.collected = false;

  gamePill.x = Math.random() * (canvas.width - 20) + 10;
  gamePill.y = Math.random() * (canvas.height - 20) + 10;
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateObstacles();
  drawObstacles();

  drawPill();

  drawCharacter(
    bennysCharacter,
    bennysCharacterX,
    bennysCharacterY,
    characterWidth,
    characterHeight,
    bennysDirection
  );
  drawCharacter(
    patriotsCharacter,
    patriotsCharacterX,
    patriotsCharacterY,
    characterWidth,
    characterHeight,
    patriotsDirection
  );

  updateBullets(bennysBullets, ctx, canvas.width, canvas.height);
  updateBullets(patriotsBullets, ctx, canvas.width, canvas.height);

  drawScoresAndHealth();

  if (selectedSide === "Bennys") {
    enemyAI("Patriots");
  } else if (selectedSide === "Patriots") {
    enemyAI("Bennys");
  }

  checkCollisions();

  checkPillCollection();

  checkCharacterCollision();

  requestAnimationFrame(gameLoop);
}

function drawCharacter(characterImage, x, y, width, height, direction) {
  ctx.save();

  if (characterImage === patriotsCharacter) {
    if (direction === 1) {
      ctx.scale(-1, 1);
      ctx.drawImage(characterImage, -x - width, y, width, height);
    } else {
      ctx.drawImage(characterImage, x, y, width, height);
    }
  } else {
    if (direction === -1) {
      ctx.scale(-1, 1);
      ctx.drawImage(characterImage, -x - width, y, width, height);
    } else {
      ctx.drawImage(characterImage, x, y, width, height);
    }
  }

  ctx.restore();
}

function drawScoresAndHealth() {
  document.getElementById(
    "bennysScore"
  ).textContent = `Bennys: ${scores.Bennys}`;
  document.getElementById(
    "patriotsScore"
  ).textContent = `Patriots: ${scores.Patriots}`;

  const bennysHealthPercent = (health.Bennys / 500) * 200;
  const patriotsHealthPercent = (health.Patriots / 500) * 200;
  document.getElementById(
    "bennysHealth"
  ).style.width = `${bennysHealthPercent}px`;
  document.getElementById(
    "patriotsHealth"
  ).style.width = `${patriotsHealthPercent}px`;
}

function checkCollisions() {
  bennysBullets.forEach((bullet, index) => {
    if (
      bullet.x < patriotsCharacterX + characterWidth &&
      bullet.x + bullet.width > patriotsCharacterX &&
      bullet.y < patriotsCharacterY + characterHeight &&
      bullet.y + bullet.height > patriotsCharacterY
    ) {
      health.Patriots -= 10;
      bennysBullets.splice(index, 1);
      if (health.Patriots <= 0) endGame();
    }
  });

  patriotsBullets.forEach((bullet, index) => {
    if (
      bullet.x < bennysCharacterX + characterWidth &&
      bullet.x + bullet.width > bennysCharacterX &&
      bullet.y < bennysCharacterY + characterHeight &&
      bullet.y + bullet.height > bennysCharacterY
    ) {
      health.Bennys -= 10;
      patriotsBullets.splice(index, 1);
      if (health.Bennys <= 0) endGame();
    }
  });
}

function enemyAI(enemy) {
  const now = Date.now();

  let targetX = gamePill.collected
    ? selectedSide === "Bennys"
      ? bennysCharacterX
      : patriotsCharacterX
    : gamePill.x;
  let targetY = gamePill.collected
    ? selectedSide === "Bennys"
      ? bennysCharacterY
      : patriotsCharacterY
    : gamePill.y;

  let enemyX = enemy === "Patriots" ? patriotsCharacterX : bennysCharacterX;
  let enemyY = enemy === "Patriots" ? patriotsCharacterY : bennysCharacterY;

  const speedAdjustmentFactor = (now - enemyLastMoveTime) / 1000;
  const increasedSpeed = 100 * speedAdjustmentFactor;

  let moveX = (targetX > enemyX ? 1 : -1) * increasedSpeed;
  let moveY = (targetY > enemyY ? 1 : -1) * increasedSpeed;

  let proposedX = enemyX + moveX;
  let proposedY = enemyY + moveY;

  if (
    !isCollidingWithObstacle(proposedX, enemyY, characterWidth, characterHeight)
  ) {
    enemyX = proposedX;
  }

  if (
    !isCollidingWithObstacle(enemyX, proposedY, characterWidth, characterHeight)
  ) {
    enemyY = proposedY;
  }

  if (enemy === "Bennys") {
    bennysCharacterX = enemyX;
    bennysCharacterY = enemyY;
    bennysDirection = moveX > 0 ? 1 : -1;
  } else {
    patriotsCharacterX = enemyX;
    patriotsCharacterY = enemyY;
    patriotsDirection = moveX > 0 ? 1 : -1;
  }

  if (Math.random() < 0.3 && gamePill.collected) {
    shootBullet(enemy);
  }

  enemyLastMoveTime = now;
}

ctx.restore();

function isCollidingWithObstacle(newX, newY, characterWidth, characterHeight) {
  return obstacles.some(
    (obstacle) =>
      newX < obstacle.x + obstacle.width &&
      newX + characterWidth > obstacle.x &&
      newY < obstacle.y + obstacle.height &&
      newY + characterHeight > obstacle.y
  );
}

function handleCharacterMovement(event) {
  if (!selectedSide) return;

  const speed = 15;
  let newX, newY;

  if (selectedSide === "Bennys") {
    switch (event.key) {
      case "ArrowUp":
        newY = Math.max(0, bennysCharacterY - speed);
        if (!isCollidingWithAnyObstacle(bennysCharacterX, newY)) {
          bennysCharacterY = newY;
        }
        break;
      case "ArrowDown":
        newY = Math.min(
          canvas.height - characterHeight,
          bennysCharacterY + speed
        );
        if (!isCollidingWithAnyObstacle(bennysCharacterX, newY)) {
          bennysCharacterY = newY;
        }
        break;
      case "ArrowLeft":
        newX = Math.max(0, bennysCharacterX - speed);
        if (!isCollidingWithAnyObstacle(newX, bennysCharacterY)) {
          bennysCharacterX = newX;
          bennysDirection = -1;
        }
        break;
      case "ArrowRight":
        newX = Math.min(
          canvas.width - characterWidth,
          bennysCharacterX + speed
        );
        if (!isCollidingWithAnyObstacle(newX, bennysCharacterY)) {
          bennysCharacterX = newX;
          bennysDirection = 1;
        }
        break;
    }
  } else if (selectedSide === "Patriots") {
    switch (event.key) {
      case "ArrowUp":
        newY = Math.max(0, patriotsCharacterY - speed);
        if (!isCollidingWithAnyObstacle(patriotsCharacterX, newY)) {
          patriotsCharacterY = newY;
        }
        break;
      case "ArrowDown":
        newY = Math.min(
          canvas.height - characterHeight,
          patriotsCharacterY + speed
        );
        if (!isCollidingWithAnyObstacle(patriotsCharacterX, newY)) {
          patriotsCharacterY = newY;
        }
        break;
      case "ArrowLeft":
        newX = Math.max(0, patriotsCharacterX - speed);
        if (!isCollidingWithAnyObstacle(newX, patriotsCharacterY)) {
          patriotsCharacterX = newX;
          patriotsDirection = -1;
        }
        break;
      case "ArrowRight":
        newX = Math.min(
          canvas.width - characterWidth,
          patriotsCharacterX + speed
        );
        if (!isCollidingWithAnyObstacle(newX, patriotsCharacterY)) {
          patriotsCharacterX = newX;
          patriotsDirection = 1;
        }
        break;
    }
  }

  if (event.key === " ") {
    shootBullet(selectedSide);
  }
}

let bennysCanShoot = true;
let patriotsCanShoot = true;

function shootBullet(fromSide) {
  const existingBullets =
    fromSide === "Bennys" ? bennysBullets : patriotsBullets;
  if (existingBullets.length === 0) {
    const bulletOffsetY = characterHeight / 2;
    let startX, startY, velocityX;

    if (fromSide === "Bennys" && bennysCanShoot) {
      startX = bennysCharacterX + (bennysDirection === 1 ? characterWidth : 0);
      startY = bennysCharacterY + bulletOffsetY;
      velocityX = bennysDirection * 7;
      bennysBullets.push(new Bullet(startX, startY, velocityX, 0));
      bennysCanShoot = false;
      setTimeout(() => {
        bennysCanShoot = true;
      }, reloadInterval);
    } else if (fromSide === "Patriots" && patriotsCanShoot) {
      startX =
        patriotsCharacterX + (patriotsDirection === 1 ? 0 : characterWidth);
      startY = patriotsCharacterY + bulletOffsetY;
      velocityX = patriotsDirection * 7;
      patriotsBullets.push(new Bullet(startX, startY, velocityX, 0));
      patriotsCanShoot = false;
      setTimeout(() => {
        patriotsCanShoot = true;
      }, reloadInterval);
    }
  }
}

function generateRandomObstacle() {
  let width = Math.random() * (150 - 50) + 50;
  let height = Math.random() * (100 - 30) + 30;
  let x = Math.random() * (canvas.width - width);
  let y = Math.random() * (canvas.height - height);
  let vx =
    Math.random() * (obstacleMaxVelocity - obstacleMinVelocity) +
    obstacleMinVelocity;
  let vy =
    Math.random() * (obstacleMaxVelocity - obstacleMinVelocity) +
    obstacleMinVelocity;
  return { x, y, width, height, vx, vy };
}

function updateBullets(bullets, ctx, canvasWidth, canvasHeight) {
  bullets.forEach((bullet, index) => {
    bullet.move();
    let bulletCollided = false;

    for (
      let obstacleIndex = 0;
      obstacleIndex < obstacles.length;
      obstacleIndex++
    ) {
      const obstacle = obstacles[obstacleIndex];
      if (
        bullet.x < obstacle.x + obstacle.width &&
        bullet.x + bullet.width > obstacle.x &&
        bullet.y < obstacle.y + obstacle.height &&
        bullet.y + bullet.height > obstacle.y
      ) {
        bulletCollided = true;
        const shooter = bullets === bennysBullets ? "Bennys" : "Patriots";

        if (health[shooter] < 500) {
          obstacles.splice(obstacleIndex, 1);
          health[shooter] = Math.min(health[shooter] + 20, 500);

          setTimeout(() => {
            obstacles.push(generateRandomObstacle());
          }, Math.random() * (20000 - 5000) + 5000);
        }
        break;
      }
    }

    if (!bulletCollided) {
      if (
        bullets === bennysBullets &&
        bullet.x < patriotsCharacterX + characterWidth &&
        bullet.x + bullet.width > patriotsCharacterX &&
        bullet.y < patriotsCharacterY + characterHeight &&
        bullet.y + bullet.height > patriotsCharacterY
      ) {
        health["Patriots"] -= 10;
        bulletCollided = true;
        if (health["Patriots"] <= 0) {
          endGame("Bennys");
        }
      } else if (
        bullets === patriotsBullets &&
        bullet.x < bennysCharacterX + characterWidth &&
        bullet.x + bullet.width > bennysCharacterX &&
        bullet.y < bennysCharacterY + characterHeight &&
        bullet.y + bullet.height > bennysCharacterY
      ) {
        health["Bennys"] -= 10;
        bulletCollided = true;
        if (health["Bennys"] <= 0) {
          endGame("Patriots");
        }
      }
    }

    if (
      bulletCollided ||
      bullet.x > canvasWidth ||
      bullet.x + bullet.width < 0 ||
      bullet.y > canvasHeight ||
      bullet.y + bullet.height < 0
    ) {
      bullets.splice(index, 1);
    } else {
      bullet.draw(ctx);
    }

    if (bulletCollided) {
      if (bullets === bennysBullets) {
        bennysCanShoot = true;
      } else if (bullets === patriotsBullets) {
        patriotsCanShoot = true;
      }
    }
  });
}

function checkCharacterCollision() {
  const dx = bennysCharacterX - patriotsCharacterX;
  const dy = bennysCharacterY - patriotsCharacterY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < characterWidth) {
    const bounceFactor = 1.5;
    const minSeparation = characterWidth * bounceFactor;
    const overlap = minSeparation - distance;
    const adjustX = (overlap / distance) * dx;
    const adjustY = (overlap / distance) * dy;

    bennysCharacterX += adjustX / 2;
    bennysCharacterY += adjustY / 2;
    patriotsCharacterX -= adjustX / 2;
    patriotsCharacterY -= adjustY / 2;
  }
}

function endGame() {
  let winner = health.Bennys <= 0 ? "Patriots" : "Bennys";
  alert(`${winner} win!`);

  document.getElementById("playerSelection").style.display = "block";
  document.getElementById("gameCanvas").style.display = "none";

  let gameHeader = document.getElementById("gameHeader");
  gameHeader.classList.remove("teamVisible");
  gameHeader.style.display = "block";

  let teamDisplays = document.getElementsByClassName("teamDisplay");
  for (let element of teamDisplays) {
    element.style.display = "none";
  }

  location.reload();
}

resizeCanvas();
