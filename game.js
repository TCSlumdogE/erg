const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const characterWidth = 100; // Define character dimensions globally for easy reference
const characterHeight = 150;
let enemySpeed = 100; // Speed of the enemy's movement

class Pill {
  constructor() {
    this.reset();
  }

  draw(ctx) {
    if (!this.collected) {
      // Save the current context state
      ctx.save();

      // Translate to the pill's location
      ctx.translate(this.x, this.y);

      // Scale context horizontally
      ctx.scale(2, 1);

      // Draw the pill as a circle which will be stretched into an oval due to scaling
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2, true);
      ctx.closePath();

      // Restore to original scale for text and other drawings
      ctx.restore();

      // Fill the pill with white color
      ctx.fillStyle = "white";
      ctx.fill();

      // Add the text "Oxy" on the pill
      ctx.fillStyle = "black"; // Text color
      ctx.font = `${this.radius}px Arial`; // Set the font size based on the pill size
      ctx.textAlign = "center"; // Center the text horizontally
      ctx.textBaseline = "middle"; // Center the text vertically
      ctx.fillText("Oxy", this.x, this.y); // Position the text on the pill
    }
  }

  reset() {
    this.x = Math.random() * (canvas.width - 40) + 20; // Adjusting for the new pill size
    this.y = Math.random() * (canvas.height - 20) + 10;
    this.radius = 10; // Half of the intended major axis length of the ellipse
    this.collected = false;
  }

  collect(collector) {
    // Add parameter to identify the collector
    this.collected = true;
    this.triggerBarrage(collector); // Trigger shooting barrage for the character who collected the pill
  }

  triggerBarrage(collector) {
    const duration = 2000; // Barrage lasts for 3000 ms
    const end = Date.now() + duration;
    const interval = 400; // Shoot every 100 ms
    const angles = 8; // Total number of directions to shoot
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
    shoot(); // Start the shooting barrage
  }
}

let gamePill = new Pill(); // Create a new pill instance

function drawPill() {
  gamePill.draw(ctx);
}

function checkPillCollection() {
  function checkCharacter(character, collector) {
    if (!gamePill.collected) {
      const distX = character.x - gamePill.x;
      const distY = character.y - gamePill.y;
      const distance = Math.sqrt(distX * distX + distY * distY);
      if (distance < characterWidth / 2 + gamePill.radius) {
        gamePill.collect(collector); // Pass the collector's identity
        const respawnTime = Math.random() * (15000 - 5000) + 5000; // Between 5 and 15 seconds
        setTimeout(() => gamePill.reset(), respawnTime);
      }
    }
  }

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

class Bullet {
  constructor(x, y, velocityX, velocityY) {
    // Add velocityY parameter
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY || 0; // Set default value to maintain compatibility
    this.speed = 7;
    this.width = 10;
    this.height = 5;
  }

  move() {
    this.x += this.velocityX * this.speed;
    this.y += (this.velocityY || 0) * this.speed; // Move in Y direction if velocityY is provided
  }

  draw(ctx) {
    ctx.fillStyle = "yellow"; // Bullet color
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
resizeCanvas(); // Call at game start to set initial size

// Reload timer variables
let lastBulletShotTime = 0;
const reloadInterval = 5000; // 5 seconds reload time

function resizeCanvas() {
  const maxWidth = window.innerWidth * 0.98; // Increase to 98% of the window width
  const maxHeight = window.innerHeight * 0.75; // Adjust to 75% of the window height or as needed
  const aspectRatio = 16 / 9; // Adjust this to your game's aspect ratio if different

  // Calculate the best width and height for the canvas
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

let animationFrameId; // Declare this at the top of your script

function startGame() {
  let obstacles = [];
  generateRandomObstacles(); // Generate new obstacles for the game

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  document.getElementById("playerSelection").style.display = "none";
  document.getElementById("gameCanvas").style.display = "block";
  let gameHeader = document.getElementById("gameHeader");
  gameHeader.classList.add("teamVisible"); // Add class to make header visible
  gameHeader.style.display = "flex"; // Change display to flex for game screen

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

// Define a property to track the direction each character is facing
let bennysDirection = 1; // 1 for facing right, -1 for facing left
let patriotsDirection = -1; // -1 for facing left, 1 for facing right

let numberOfObstacles = 8; // Change this to how many obstacles you want
let obstacles = [];

// Adjust obstacle velocities to make them move slower
let obstacleMinVelocity = -1; // Lower limit for obstacle velocity
let obstacleMaxVelocity = 1; // Upper limit for obstacle velocity

function generateRandomObstacles() {
  obstacles = [];
  for (let i = 0; i < numberOfObstacles; i++) {
    let width = Math.random() * (150 - 50) + 50; // Random width
    let height = Math.random() * (100 - 30) + 30; // Random height
    let x = Math.random() * (canvas.width - width);
    let y = Math.random() * (canvas.height - height);
    let vx = Math.random() * 1.5 - 0.75; // Slower x velocity, between -0.75 and 0.75
    let vy = Math.random() * 1.5 - 0.75; // Slower y velocity, same range

    obstacles.push({ x, y, width, height, vx, vy });
  }
}

function drawObstacles() {
  obstacles.forEach((obstacle, index) => {
    // Alternate between drawing alpha and beta for each obstacle
    const text = index % 2 === 0 ? "α" : "β"; // α for alpha, β for beta
    ctx.font = "48px serif"; // Adjust size and font as desired
    ctx.fillStyle = "red"; // Change color to make it stand out
    ctx.fillText(text, obstacle.x, obstacle.y);
  });
}

function updateObstacles() {
  obstacles.forEach((obstacle) => {
    // Existing movement logic
    obstacle.x += obstacle.vx;
    obstacle.y += obstacle.vy;

    // Check collision with Bennys character
    if (
      bennysCharacterX < obstacle.x + obstacle.width &&
      bennysCharacterX + characterWidth > obstacle.x &&
      bennysCharacterY < obstacle.y + obstacle.height &&
      bennysCharacterY + characterHeight > obstacle.y
    ) {
      // Calculate the center of both obstacle and character
      const obstacleCenterX = obstacle.x + obstacle.width / 2;
      const obstacleCenterY = obstacle.y + obstacle.height / 2;
      const characterCenterX = bennysCharacterX + characterWidth / 2;
      const characterCenterY = bennysCharacterY + characterHeight / 2;

      // Calculate the direction vector from character to obstacle
      const directionX = obstacleCenterX - characterCenterX;
      const directionY = obstacleCenterY - characterCenterY;

      // Calculate the distance between character and obstacle centers
      const distance = Math.sqrt(
        directionX * directionX + directionY * directionY
      );

      // Normalize the direction vector
      const normalizedDirectionX = directionX / distance;
      const normalizedDirectionY = directionY / distance;

      // Adjust the obstacle velocity based on the normalized direction
      obstacle.vx = (normalizedDirectionX * enemySpeed) / 10; // Adjust the division factor for desired speed
      obstacle.vy = (normalizedDirectionY * enemySpeed) / 10; // Adjust the division factor for desired speed
    }

    // Check collision with Patriots character
    if (
      patriotsCharacterX < obstacle.x + obstacle.width &&
      patriotsCharacterX + characterWidth > obstacle.x &&
      patriotsCharacterY < obstacle.y + obstacle.height &&
      patriotsCharacterY + characterHeight > obstacle.y
    ) {
      // Calculate the center of both obstacle and character
      const obstacleCenterX = obstacle.x + obstacle.width / 2;
      const obstacleCenterY = obstacle.y + obstacle.height / 2;
      const characterCenterX = patriotsCharacterX + characterWidth / 2;
      const characterCenterY = patriotsCharacterY + characterHeight / 2;

      // Calculate the direction vector from character to obstacle
      const directionX = obstacleCenterX - characterCenterX;
      const directionY = obstacleCenterY - characterCenterY;

      // Calculate the distance between character and obstacle centers
      const distance = Math.sqrt(
        directionX * directionX + directionY * directionY
      );

      // Normalize the direction vector
      const normalizedDirectionX = directionX / distance;
      const normalizedDirectionY = directionY / distance;

      // Adjust the obstacle velocity based on the normalized direction
      obstacle.vx = (normalizedDirectionX * enemySpeed) / 10; // Adjust the division factor for desired speed
      obstacle.vy = (normalizedDirectionY * enemySpeed) / 10; // Adjust the division factor for desired speed
    }

    // Check collision with canvas boundaries and reverse direction if necessary
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
  // This checks if there is any collision
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
  // Ensure the pill is not marked as collected
  gamePill.collected = false;

  // Randomly set new position for the pill
  gamePill.x = Math.random() * (canvas.width - 20) + 10; // Avoid spawning too close to the edges
  gamePill.y = Math.random() * (canvas.height - 20) + 10;
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  updateObstacles();
  drawObstacles();

  drawPill(); // Draw the pill if it's not been collected

  // Draw the characters with the correct direction
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

  // Update bullets
  updateBullets(bennysBullets, ctx, canvas.width, canvas.height);
  updateBullets(patriotsBullets, ctx, canvas.width, canvas.height);

  // Draw scores and health
  drawScoresAndHealth();

  // AI Movement and Actions
  if (selectedSide === "Bennys") {
    enemyAI("Patriots");
  } else if (selectedSide === "Patriots") {
    enemyAI("Bennys");
  }

  // Check for game end conditions
  checkCollisions();

  // Check for pill collection for both characters
  checkPillCollection();

  // Continue the game loop
  requestAnimationFrame(gameLoop);
}

// Function to draw a character with the option to flip horizontally
function drawCharacter(characterImage, x, y, width, height, direction) {
  ctx.save(); // Save the current context state

  if (characterImage === patriotsCharacter) {
    // For the Patriots character, we adjust the flipping logic:
    // Now if moving right, we flip the image, and if moving left, we draw it normally.
    if (direction === 1) {
      // If moving right, flip image
      ctx.scale(-1, 1);
      ctx.drawImage(characterImage, -x - width, y, width, height);
    } else {
      // If moving left, draw normally
      ctx.drawImage(characterImage, x, y, width, height);
    }
  } else {
    // For the Bennys character or any other characters, keep the original logic
    if (direction === -1) {
      // If facing left, flip image
      ctx.scale(-1, 1);
      ctx.drawImage(characterImage, -x - width, y, width, height);
    } else {
      // If facing right, draw as normal
      ctx.drawImage(characterImage, x, y, width, height);
    }
  }

  ctx.restore(); // Restore the original context state
}

function drawScoresAndHealth() {
  document.getElementById(
    "bennysScore"
  ).textContent = `Bennys: ${scores.Bennys}`;
  document.getElementById(
    "patriotsScore"
  ).textContent = `Patriots: ${scores.Patriots}`;

  // Update widths of health bars based on current health
  const bennysHealthPercent = (health.Bennys / 500) * 200; // Assuming 200 is the total width for the health bar
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
      health.Patriots -= 10; // Adjust damage as needed
      bennysBullets.splice(index, 1); // Remove the bullet
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
      health.Bennys -= 10; // Adjust damage as needed
      patriotsBullets.splice(index, 1); // Remove the bullet
      if (health.Bennys <= 0) endGame();
    }
  });
}

function enemyAI(enemy) {
  const now = Date.now();

  // Set default target to player's position
  let targetX =
    selectedSide === "Bennys" ? bennysCharacterX : patriotsCharacterX;
  let targetY =
    selectedSide === "Bennys" ? bennysCharacterY : patriotsCharacterY;

  let enemyX = enemy === "Patriots" ? patriotsCharacterX : bennysCharacterX;
  let enemyY = enemy === "Patriots" ? patriotsCharacterY : bennysCharacterY;

  // Check if the pill is available and prioritize it
  if (!gamePill.collected) {
    targetX = gamePill.x;
    targetY = gamePill.y;
  }

  const increasedSpeed = 100; // Adjust for a more appropriate AI movement speed

  if (now - enemyLastMoveTime > enemyMoveInterval) {
    let moveX = targetX > enemyX ? increasedSpeed : -increasedSpeed;
    let moveY = targetY > enemyY ? increasedSpeed : -increasedSpeed;

    // Add randomness to prevent direct mirroring if targeting player
    if (gamePill.collected) {
      if (Math.random() > 0.5) {
        moveX += (Math.random() - 0.5) * increasedSpeed;
      }
      if (Math.random() > 0.5) {
        moveY += (Math.random() - 0.5) * increasedSpeed;
      }
    }

    // Proposed new positions considering obstacles
    let proposedX = enemyX + moveX;
    let proposedY = enemyY + moveY;

    // Check for obstacle collisions before updating positions
    if (
      !isCollidingWithObstacle(
        proposedX,
        enemyY,
        characterWidth,
        characterHeight
      )
    ) {
      enemyX = Math.max(Math.min(proposedX, canvas.width - characterWidth), 0); // Ensure within bounds
    }

    if (
      !isCollidingWithObstacle(
        enemyX,
        proposedY,
        characterWidth,
        characterHeight
      )
    ) {
      enemyY = Math.max(
        Math.min(proposedY, canvas.height - characterHeight),
        0
      ); // Ensure within bounds
    }

    // Update global position variables
    if (enemy === "Bennys") {
      bennysCharacterX = enemyX;
      bennysCharacterY = enemyY;
      bennysDirection = moveX > 0 ? 1 : -1;
    } else {
      patriotsCharacterX = enemyX;
      patriotsCharacterY = enemyY;
      patriotsDirection = moveX > 0 ? 1 : -1;
    }

    // AI shooting logic, may shoot if not prioritizing pill
    if (Math.random() < 0.3 && gamePill.collected) {
      shootBullet(enemy);
    }

    enemyLastMoveTime = now;
  }
}

ctx.restore(); // Restore the original context state

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
  if (!selectedSide) return; // Exit if no side has been selected

  const speed = 15; // Speed of character movement
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
          bennysDirection = -1; // Update direction when moving left
        }
        break;
      case "ArrowRight":
        newX = Math.min(
          canvas.width - characterWidth,
          bennysCharacterX + speed
        );
        if (!isCollidingWithAnyObstacle(newX, bennysCharacterY)) {
          bennysCharacterX = newX;
          bennysDirection = 1; // Update direction when moving right
        }
        break;
    }
  } else if (selectedSide === "Patriots") {
    // Repeat the same logic for Patriots character
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
          patriotsDirection = -1; // Update direction when moving left
        }
        break;
      case "ArrowRight":
        newX = Math.min(
          canvas.width - characterWidth,
          patriotsCharacterX + speed
        );
        if (!isCollidingWithAnyObstacle(newX, patriotsCharacterY)) {
          patriotsCharacterX = newX;
          patriotsDirection = 1; // Update direction when moving right
        }
        break;
    }
  }

  // Handle shooting
  if (event.key === " ") {
    shootBullet(selectedSide); // Shoot bullet on spacebar press
  }
}

// Flags to track whether each player can shoot
let bennysCanShoot = true;
let patriotsCanShoot = true;

function shootBullet(fromSide) {
  if (
    (fromSide === "Bennys" && !bennysCanShoot) ||
    (fromSide === "Patriots" && !patriotsCanShoot)
  ) {
    return; // Exit function if the character is currently unable to shoot
  }

  // Calculate the starting position of the bullet based on the character's current position
  const bulletOffsetY = characterHeight / 2; // Center the bullet relative to the character
  let startX, startY, velocityX;

  if (fromSide === "Bennys") {
    startX =
      bennysCharacterX +
      characterWidth -
      (bennysDirection === -1 ? characterWidth : 0); // Adjust start X based on the direction
    startY = bennysCharacterY + bulletOffsetY;
    velocityX = bennysDirection; // The bullet's horizontal direction matches the character's
    bennysBullets.push(new Bullet(startX, startY, velocityX));
    bennysCanShoot = false; // Prevent immediate subsequent shots
    setTimeout(() => (bennysCanShoot = true), reloadInterval); // Reset shooting ability after reloadInterval
  } else if (fromSide === "Patriots") {
    startX =
      patriotsCharacterX + (patriotsDirection === 1 ? 0 : characterWidth); // Adjust for direction
    startY = patriotsCharacterY + bulletOffsetY;
    velocityX = patriotsDirection; // The bullet moves in the direction the character is facing
    patriotsBullets.push(new Bullet(startX, startY, velocityX));
    patriotsCanShoot = false; // Prevent immediate subsequent shots
    setTimeout(() => (patriotsCanShoot = true), reloadInterval); // Reset shooting ability after reloadInterval
  }
}


function generateRandomObstacle() {
  let width = Math.random() * (150 - 50) + 50; // Random width between 50 and 150
  let height = Math.random() * (100 - 30) + 30; // Random height between 30 and 100
  let x = Math.random() * (canvas.width - width); // Random x position within canvas
  let y = Math.random() * (canvas.height - height); // Random y position within canvas
  let vx = Math.random() * (obstacleMaxVelocity - obstacleMinVelocity) + obstacleMinVelocity; // Random velocityX
  let vy = Math.random() * (obstacleMaxVelocity - obstacleMinVelocity) + obstacleMinVelocity; // Random velocityY
  return { x, y, width, height, vx, vy };
}


function updateBullets(bullets, ctx, canvasWidth, canvasHeight) {
  bullets.forEach((bullet, index) => {
    bullet.move();
    let bulletCollided = false; // Flag to check if the bullet collided

    // Check collision with obstacles and handle healing and respawning
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
        // Heal and remove obstacle if shooter is not at full health
        if (health[shooter] < 500) {
          obstacles.splice(obstacleIndex, 1); // Remove the hit obstacle
          health[shooter] = Math.min(health[shooter] + 20, 500); // Heal the shooter
          // Respawn the obstacle after a random time
          setTimeout(() => {
            obstacles.push(generateRandomObstacle());
          }, Math.random() * (20000 - 5000) + 5000); // Between 5 and 20 seconds
        }
        break; // Exit the loop once a collision is processed
      }
    }

    // Check collision with players
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

    // Remove bullets that are off-screen, have collided with a player, or hit an obstacle
    if (
      bulletCollided ||
      bullet.x > canvasWidth ||
      bullet.x + bullet.width < 0 ||
      bullet.y > canvasHeight ||
      bullet.y + bullet.height < 0
    ) {
      bullets.splice(index, 1);
    } else {
      bullet.draw(ctx); // Draw the bullet if it hasn't collided
    }

    // Reset shooting capability if the bullet has left the screen or collided
    if (bulletCollided) {
      if (bullets === bennysBullets) {
        bennysCanShoot = true;
      } else if (bullets === patriotsBullets) {
        patriotsCanShoot = true;
      }
    }
  });
}

function endGame() {
  let winner = health.Bennys <= 0 ? "Patriots" : "Bennys";
  alert(`${winner} win!`);

  document.getElementById("playerSelection").style.display = "block";
  document.getElementById("gameCanvas").style.display = "none";

  let gameHeader = document.getElementById("gameHeader");
  gameHeader.classList.remove("teamVisible");
  gameHeader.style.display = "block"; // Change back to block for selection screen

  let teamDisplays = document.getElementsByClassName("teamDisplay");
  for (let element of teamDisplays) {
    element.style.display = "none";
  }

  location.reload(); // Consider removing this if you want to preserve game state or manage reset differently
}

// Call resizeCanvas at the end to ensure all variables are set before drawing
resizeCanvas();
