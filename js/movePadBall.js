
const URL = "https://teachablemachine.withgoogle.com/models/4bVVT6nUe/";
let model, webcam, labelContainer, maxPredictions;
let mainContainer = document.querySelector(".main-container");
let pad = document.querySelector("#pad");
let ball = document.querySelector("#ball");
let bricks = document.querySelectorAll(".brick");

let gameRunning = 0;
let ballTop = 0;
let ballLeft = 0;
let ballMoveDelay = 10;
let padCollisionPoint = 0;
let maxLives = 10;
let ballsLife = maxLives;
let timerId = 0;
let totalScore = 0;
let ballsDirection = {
  left: 0,
  top: 0
};

// Add music when the game is loaded
window.addEventListener("click", function() {
  const gameMusic = document.getElementById("gameMusic");
  gameMusic.play();
});
let movementPhysics = 60; // Movement speed of pad on keyboard controls
mainContainer.addEventListener("click", (event) => {
  if (gameRunning === 0) {
    startGame();
  }
});



async function initCamera() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  const flip = true; // whether to flip the webcam
  webcam = new tmImage.Webcam(250, 250, flip); // width, height, flip
  await webcam.setup(); // request access to the webcam
  await webcam.play();
  window.requestAnimationFrame(loop);
  startBallMove();
  const webcamContainer = document.createElement("div");
  webcamContainer.classList.add("webcam-container");
  webcamContainer.style.position = "fixed";
  webcamContainer.style.top = "10px";
  webcamContainer.style.right = "10px";
  webcamContainer.style.width = "200px";
  webcamContainer.style.height = "150px";
  webcamContainer.style.border = "1px solid black";
  webcamContainer.appendChild(webcam.canvas);
  document.body.appendChild(webcamContainer);
}

async function loop() {
  webcam.update();
  await predict();
  
  if (gameRunning === 1) {
    moveBall(); // Add ball movement
    checkCollision(); // Add collision detection
  }
  
  window.requestAnimationFrame(loop);
}


async function predict() {
  const prediction = await model.predict(webcam.canvas);
  const classes = prediction.sort((a, b) => b.probability - a.probability);
  const mostProbableClass = classes[0].className;
  movePad(mostProbableClass);
}

let platformSpeed = 30; // Initial speed of the platform
let speedMultiplier = 1; // Multiplier for the platform speed

function movePad(gesture) {
  let padLeft = +mainContainer.style.getPropertyValue("--pad-left");
  const padWidth = pad.offsetWidth;
  const containerWidth = mainContainer.offsetWidth;

  if (gesture === "Move Left") {
    padLeft -= movementPhysics * speedMultiplier;
  } else if (gesture === "Move Right") {
    padLeft += movementPhysics * speedMultiplier;
  } else if (gesture === "Stop") {
    return;
  }

  if (padLeft < 0) {
    padLeft = 0;
  }
  if (padLeft > containerWidth - padWidth) {
    padLeft = containerWidth - padWidth;
  }

  if (gameRunning === 0) {
    ballLeft = padLeft + padWidth / 2 - ball.offsetWidth / 2;
    mainContainer.style.setProperty("--ball-left", ballLeft.toString());
  }
  mainContainer.style.setProperty("--pad-left", padLeft.toString());
}

const startBallMove = () => {
    ballTop = pad.offsetTop - ball.offsetHeight;
    ballsDirection = {
        left: 0,
        top: -2
    }
}

const onLifeGone = () => {
    gameRunning = 0
    clearInterval(timerId)
    ballTop = pad.offsetTop - ball.offsetHeight;
    ballLeft = pad.offsetLeft + pad.offsetWidth / 2 - ball.offsetWidth / 2;
    mainContainer.style.setProperty("--ball-left", ballLeft.toString())
    mainContainer.style.setProperty("--ball-top", ballTop.toString())
}

const redirectToIndex = () => {
  window.location.href = "index.html";
};


const onBallDropped = () => {
  ballsLife--;
  document.getElementById("lives").innerText = ballsLife.toString();

  if (ballsLife === 0) {
    gameOver(); // Call gameOver function when lives reach 0
    clearInterval(timerId);
    ballsDirection = {
      left: 0,
      top: 0
    };
    redirectToIndex(); // Redirect to the index page
  } else {
    onLifeGone();
  }
};

const gameOver = () => {
  gameRunning = 0;
  clearInterval(timerId);
  alert("Game Over"); // Display the game over message in a popup
  redirectToIndex(); // Redirect to the index page
};

const getCollisionBetween = (element1, element2) => {
    let left1 = element1.offsetLeft
    let left2 = element2.offsetLeft
    let top1 = element1.offsetTop
    let top2 = element2.offsetTop

    let right1 = left1 + element1.offsetWidth
    let right2 = left2 + element2.offsetWidth
    let bottom1 = top1 + element1.offsetHeight
    let bottom2 = top2 + element2.offsetHeight

    if (right1 > left2 && right1 < right2) {
        //ltr collision
        if (bottom1 > top2 && bottom1 < bottom2) {
            //ttb collision
            if (bottom1 - top2 > right1 - left2) {
                console.log("111")
                return "ltr"
            } else {
                console.log("112")
                return "ttb"
            }
        }
        if (top1 < bottom2 && top1 > top2) {
            //btt collision
            if (top1 - bottom2 > right1 - left2) {
                console.log("121")
                return "ltr"
            } else {
                console.log("122")
                return "btt"
            }
        }
    }
    if (left1 < right2 && left1 > left2) {
        //rtl collision
        if (bottom1 > top2 && bottom1 < bottom2) {
            //ttb collision
            if (bottom1 - top2 > right2 - left1) {
                console.log("211")
                return "rtl"
            } else {
                console.log("212")
                return "ttb"
            }
        }
        if (top1 < bottom2 && top1 > top2) {
            //btt collision
            if (top1 - bottom2 > right2 - left1) {
                console.log("221")
                return "rtl"
            } else {
                console.log("222")
                return "btt"
            }
        }
    }
    return false
        // return type [1/0/-1, 1/0/-1] i.e. [ttb//btt, ltr//rtl]
}

const checkPadCollision = () => {
    if (getCollisionBetween(ball, pad)) {
        jump()
        padCollisionPoint = ball.offsetLeft + ball.offsetWidth / 2;
        if (padCollisionPoint < (pad.offsetLeft + pad.offsetWidth / 4)) {
            ballsDirection.left = -Math.sqrt(14)
            ballsDirection.top = -2
            console.log("1")
        } else if (padCollisionPoint < (pad.offsetLeft + pad.offsetWidth / 2)) {
            ballsDirection.left = -2
            ballsDirection.top = -Math.sqrt(14)
            console.log("2")
        } else if (padCollisionPoint >= (pad.offsetLeft + pad.offsetWidth / 2) && padCollisionPoint < (pad.offsetLeft + pad.offsetWidth / 4 * 3)) {
            ballsDirection.left = 2
            ballsDirection.top = -Math.sqrt(14)
            console.log("3")
        } else {
            ballsDirection.left = Math.sqrt(14)
            ballsDirection.top = -2
            console.log("4")
        }
        while (ballTop + ball.offsetHeight > pad.offsetTop)
            ballTop--
    }
}

const onCollisionWithBrick = (ball, brick, collision) => {
    bricktouch()
    totalScore += 100
    document.getElementById("score").innerText = totalScore.toString()
    if (ball.classList.contains('powerball')) {
        if (brick.classList.contains('l1')) {
            brickbroken()
            brick.classList.remove('l1');
            brick.classList.add("broken");
            brick.classList.add("l0");
            if (brick.classList.contains('power')) {
                dropPower(brick);
            }
        } else if (brick.classList.contains('l4')) {
            brick.classList.remove('l4');
            brick.classList.add('l2');
        } else if (brick.classList.contains('l3')) {
            brick.classList.remove('l3');
            brick.classList.add('l1');
        } else if (brick.classList.contains('l2')) {
            brickbroken()
            brick.classList.remove('l2');
            brick.classList.add("broken");
            brick.classList.add("l0");
            if (brick.classList.contains('power')) {
                dropPower(brick);
            }
        }
    } else {
        if (brick.classList.contains('l1')) {
            brickbroken()
            brick.classList.remove('l1');
            brick.classList.add("broken");
            brick.classList.add("l0");
            if (brick.classList.contains('power')) {
                dropPower(brick);
            }
        } else if (brick.classList.contains('l4')) {
            brick.classList.remove('l4');
            brick.classList.add('l3');
        } else if (brick.classList.contains('l3')) {
            brick.classList.remove('l3');
            brick.classList.add('l2');
        } else if (brick.classList.contains('l2')) {
            brick.classList.remove('l2');
            brick.classList.add('l1');
        }
    }
}

// Add speed control functions
function increaseSpeed() {
  speedMultiplier += 0.5;
}

function decreaseSpeed() {
  if (speedMultiplier > 0.5) {
    speedMultiplier -= 0.5;
  }
}

// Add event listeners for speed control
document.addEventListener("keydown", (event) => {
  if (event.key === "+") {
    increaseSpeed();
  } else if (event.key === "-") {
    decreaseSpeed();
  }
});
let ignoreBrickCollision = false
const checkBrickCollision = () => {
    if (ignoreBrickCollision)
        return
    for (let brick of bricks) {
        if (ignoreBrickCollision)
            return
        if (brick.classList.contains("broken"))
            continue

        let collision = getCollisionBetween(ball, brick)

        if (!collision)
            continue

        onCollisionWithBrick(ball, brick, collision);
        ignoreBrickCollision = true
        setTimeout(() => {
            ignoreBrickCollision = false
        }, ballMoveDelay * 2)

        if (collision === "rtl" || collision === "ltr")
            ballsDirection.left *= -1
        if (collision === "ttb" || collision === "btt")
            ballsDirection.top *= -1
    }
}

const checkWallCollision = () => {
    if (ballLeft > mainContainer.offsetWidth - ball.offsetWidth - 1)
        ballsDirection.left *= -1
    if (ballLeft < 1)
        ballsDirection.left *= -1
    if (ballTop < 1)
        ballsDirection.top *= -1
    if (ballTop > mainContainer.offsetHeight - ball.offsetWidth - 1)
        onBallDropped()
}

const checkCollision = () => {
    checkWallCollision()
    checkBrickCollision()
    checkPadCollision()
}

const moveBall = () => {
    ballTop += ballsDirection.top;
    ballLeft += ballsDirection.left;
    mainContainer.style.setProperty("--ball-left", ballLeft.toString())
    mainContainer.style.setProperty("--ball-top", ballTop.toString())
    checkCollision();
    checkEndgame();
}

function checkEndgame() {
    if (document.querySelectorAll('.broken').length === bricks.length) {
        console.log('Game Finished');
        clearInterval(timerId);
        nextLevel();
    }
}

const startGame = () => {
  if (gameRunning === 0) {
    ballTop = pad.offsetTop - ball.offsetHeight;
    ballLeft = pad.offsetLeft + pad.offsetWidth / 2 - ball.offsetWidth / 2;
    mainContainer.style.setProperty("--ball-left", ballLeft.toString());
    mainContainer.style.setProperty("--ball-top", ballTop.toString());
    ballsDirection = {
      left: 0,
      top: -3,
    };
    gameRunning = 1;
    timerId = setInterval(moveBall, ballMoveDelay);
  }
};


// Call the initCamera() function to start the camera and hand gesture detection
initCamera();