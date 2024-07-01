let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');
let backgroundPng = ['0.png', '1.png', '2.png'];
let currentBackgroundIndex = 0;
let lastTime = 0;
const FRAME_RATE = 60;
const FRAME_DURATION = 1000 / FRAME_RATE;
let cachedImages = [];
let iterationCounter = 0;
let spriteIterationCounter = 0;

let sprite = {
    x: 3,
    y: screen.height / 2,
    speed: 1,
    width: 90,  // Desired width of the sprite
    height: 90, // Desired height of the sprite
    images: {
        rest: [],
        run: []
    },
    currentImageIndex: 0,
    loaded: false,
    destination: null,
    mode: 'rest', // 'run' or 'rest'
    direction: 'right' // 'right' or 'left'
};

let billboard = {
    visible: false,
    alpha: 0,
    scale: 0.5,
    targetAlpha: 0,
    targetScale: 0.5,
    fadeSpeed: 0.05,
    text: 'Trap Door Activated!',
    currentText: '',
    textIndex: 0,
    cursorVisible: true,
    cursorBlinkSpeed: 500,
    lastBlinkTime: 0
};

function loadImage(src) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.src = `src/png/${src}`;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

async function preloadImages() {
    const backgroundLoadPromises = backgroundPng.map(src => loadImage(src));
    const restSpriteLoadPromises = ['turt0.png', 'turt1.png'].map(src => loadImage(src));
    const runSpriteLoadPromises = ['turt0.png', 'turt1.png'].map(src => loadImage(src));
    cachedImages = await Promise.all(backgroundLoadPromises);
    sprite.images.rest = await Promise.all(restSpriteLoadPromises);
    sprite.images.run = await Promise.all(runSpriteLoadPromises);
    sprite.loaded = true;
}

function moveSpriteTowardsDestination() {
    if (!sprite.destination || sprite.mode === 'rest') return;

    let dx = sprite.destination.x - sprite.x;
    let dy = sprite.destination.y - sprite.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < sprite.speed) {
        sprite.x = sprite.destination.x;
        sprite.y = sprite.destination.y;
        sprite.destination = null;
    } else {
        sprite.x += dx / distance * sprite.speed;
        sprite.y += dy / distance * sprite.speed;
    }

    // Restrict movement to the ground level
    if (sprite.y < screen.height / 2) {
        sprite.y = screen.height / 2;
    }

    // Determine direction
    sprite.direction = dx < 0 ? 'left' : 'right';
}

canvas.addEventListener('click', (event) => {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    console.log('Mouse clicked at: ', x, y);
    console.log('holle ouse cloick');

    sprite.destination = { x: x, y: Math.max(y, screen.height / 2) }; // Ensure destination is at or below ground level
    sprite.mode = sprite.mode === 'rest' ? 'run' : 'rest';
});

function checkTrapDoorZone() {
    // Check if the sprite is in the middle third of the screen
    if (sprite.x >= canvas.width / 3 && sprite.x <= (canvas.width * 2) / 3) {
        if (!billboard.visible) {
            billboard.visible = true;
            billboard.alpha = 0;
            billboard.scale = 0.5;
            billboard.targetAlpha = 1;
            billboard.targetScale = 1;
            billboard.currentText = '';
            billboard.textIndex = 0;
        }
    } else {
        if (billboard.visible) {
            billboard.targetAlpha = 0;
            billboard.targetScale = 0.5;
        }
    }
}
function updateBillboardText() {
    if (billboard.visible && billboard.textIndex < billboard.text.length && iterationCounter % 4 === 0) {
        billboard.currentText += billboard.text[billboard.textIndex];
        billboard.textIndex++;
    }

    if (iterationCounter % (FRAME_RATE / 2) === 0) { // blink cursor every half second
        billboard.cursorVisible = !billboard.cursorVisible;
    }
}


function drawBillboard() {
    if (billboard.alpha < billboard.targetAlpha) {
        billboard.alpha += billboard.fadeSpeed;
        if (billboard.alpha > billboard.targetAlpha) billboard.alpha = billboard.targetAlpha;
    } else if (billboard.alpha > billboard.targetAlpha) {
        billboard.alpha -= billboard.fadeSpeed;
        if (billboard.alpha < billboard.targetAlpha) billboard.alpha = billboard.targetAlpha;
    }

    if (billboard.scale < billboard.targetScale) {
        billboard.scale += billboard.fadeSpeed;
        if (billboard.scale > billboard.targetScale) billboard.scale = billboard.targetScale;
    } else if (billboard.scale > billboard.targetScale) {
        billboard.scale -= billboard.fadeSpeed;
        if (billboard.scale < billboard.targetScale) billboard.scale = billboard.targetScale;
    }

    if (billboard.alpha > 0) {
        let width = (canvas.width - 200) * billboard.scale;
        let height = (canvas.height - 200) * billboard.scale;
        let x = (canvas.width - width) / 2;
        let y = (canvas.height - height) / 2;

        ctx.save();
        ctx.globalAlpha = billboard.alpha;

        // Draw the border
        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)'; // Gold color with transparency
        ctx.fillRect(x - 10, y - 10, width + 20, height + 20);
        
        // Draw the billboard background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black
        ctx.fillRect(x, y, width, height);

        // Draw the text with typing effect and blinking cursor
        ctx.fillStyle = 'white';
        ctx.font = '30px "Courier New", Courier, monospace';
        let displayText = billboard.currentText;
        if (billboard.cursorVisible && billboard.textIndex < billboard.text.length) {
            displayText += '_';
        }
        ctx.fillText(displayText, x + 50, y + height / 2);
        ctx.restore();
    } else {
        billboard.visible = false;
    }
}


async function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;

    if (deltaTime >= FRAME_DURATION) {
        lastTime = timestamp;
        let bgImage = cachedImages[currentBackgroundIndex];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

        iterationCounter++;
        if (iterationCounter % 6 === 0) {
            currentBackgroundIndex = (currentBackgroundIndex + 1) % cachedImages.length;
        }

        if (sprite.loaded) {
            moveSpriteTowardsDestination();

            spriteIterationCounter++;
            if (sprite.mode === 'run' && spriteIterationCounter % 9 === 0) {
                sprite.currentImageIndex = (sprite.currentImageIndex + 1) % sprite.images.run.length;
            } else if (sprite.mode === 'rest' && spriteIterationCounter % 9 === 0) {
                sprite.currentImageIndex = (sprite.currentImageIndex + 1) % sprite.images.rest.length;
            }

            let currentImage = sprite.mode === 'run' ? sprite.images.run[sprite.currentImageIndex] : sprite.images.rest[sprite.currentImageIndex];

            // Draw the turtle image with flipping if needed
            ctx.save();
            if (sprite.direction === 'left') {
                ctx.scale(-1, 1);
                ctx.drawImage(currentImage, -sprite.x - sprite.width, sprite.y, sprite.width, sprite.height);
            } else {
                ctx.drawImage(currentImage, sprite.x, sprite.y, sprite.width, sprite.height);
            }
            ctx.restore();

            // Check if the sprite is in the trap door zone
            checkTrapDoorZone();
        }

        // Draw the billboard if the trap door is activated
        if (billboard.visible || billboard.alpha > 0) {
            updateBillboardText(deltaTime);
            drawBillboard();
        }
    }

    requestAnimationFrame(gameLoop);
}


async function startGame() {
    await preloadImages();
    requestAnimationFrame(gameLoop);
}

startGame();
