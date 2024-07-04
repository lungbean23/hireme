let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');
let backgroundPng = ['0.png', '1.png', '2.png'];
let foregroundPng = ['foreground.png', 'foreground1.png']; // Added the foreground image array
let currentBackgroundIndex = 0;
let currentForegroundIndex = 0;
let lastTime = 0;
const FRAME_RATE = 60;
const FRAME_DURATION = 1000 / FRAME_RATE;
let cachedImages = [];
let cachedForegroundImages = [];
let iterationCounter = 0;
let spriteIterationCounter = 0;

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

let sprite = {
    location: new Point(canvas.width / 2, canvas.height / 2 + 20), // Positioned 20 pixels below the middle
    speed: 4,
    width: 360,
    height: 360,
    images: {
        rest: [],
        run: []
    },
    currentImageIndex: 0,
    loaded: false,
    destination: new Point(0, 0),
    mode: 'rest',
    direction: new Point(0, 0),
    angle: 0,
    stepsTaken: 0,
    maxSteps: 111,
    facingLeft: false // To keep track of sprite's facing direction
};

let billboard = {
    visible: false,
    alpha: 0,
    scale: 0.5,
    targetAlpha: 0,
    targetScale: 0.3,
    fadeSpeed: 0.05,
    text: ['hire me!', 'it is really fun to create', 'art is a good thing to do.', 'we are all just human','.. .. ..', 'without chat gpt', 'data science is cool!'],
    currentText: '',
    textIndex: 0,
    messageIndex: 0,
    cursorVisible: true,
    cursorBlinkSpeed: 500,
    lastBlinkTime: 0,
    fontSize: 30 * 1.35, // Increased font size by 135%
    margin: 20 // Margin for the text inside the billboard
};

function resizeCanvas() {
    const aspectRatio = 3 / 4;
    const maxWidth = window.innerWidth * 0.3;
    const maxHeight = window.innerHeight * 0.4;
    const width = Math.min(maxWidth, maxHeight * aspectRatio);
    const height = width / aspectRatio;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function loadImage(src) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.src = `src/png/${src}`;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

async function preloadImages() {
    try {
        const backgroundLoadPromises = backgroundPng.map(src => loadImage(src));
        const foregroundLoadPromises = foregroundPng.map(src => loadImage(src));
        const restSpriteLoadPromises = ['turt0.png', 'turt1.png'].map(src => loadImage(src));
        const runSpriteLoadPromises = ['turt0.png', 'turt1.png'].map(src => loadImage(src));

        cachedImages = await Promise.all(backgroundLoadPromises);
        cachedForegroundImages = await Promise.all(foregroundLoadPromises);
        sprite.images.rest = await Promise.all(restSpriteLoadPromises);
        sprite.images.run = await Promise.all(runSpriteLoadPromises);
        sprite.loaded = true;
        console.log('Images loaded successfully');
    } catch (error) {
        console.error('Error loading images', error);
    }
}

canvas.addEventListener('click', (event) => {
    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;
    let scaleY = canvas.height / rect.height;

    // Adjust the mouse coordinates to account for scaling
    let x = (event.clientX - rect.left) * scaleX;
    let y = (event.clientY - rect.top) * scaleY;

    if (billboard.visible) {
        // Check if click is inside the billboard
        let width = (canvas.width - 200) * billboard.scale;
        let height = (canvas.height - 500) * billboard.scale;
        let bx = (canvas.width - width) / 2;
        let by = 30; // Margin from the top of the screen

        if (x >= bx && x <= bx + width && y >= by && y <= by + height) {
            // Click inside the billboard, show next line
            billboard.messageIndex = (billboard.messageIndex + 1) % billboard.text.length;
            billboard.currentText = '';
            billboard.textIndex = 0;
            return;
        }
    }

    console.log('Mouse clicked at: ', x, y);

    sprite.destination = new Point(x, canvas.height / 2 + 20); // Set destination 20 pixels below the middle
    sprite.mode = 'run';
    sprite.stepsTaken = 0;
    sprite.facingLeft = x < sprite.location.x; // Determine direction
});

function moveSpriteTowardsDestination() {
    if (sprite.mode !== 'run') return;

    let dx = sprite.destination.x - sprite.location.x;
    let dy = sprite.destination.y - sprite.location.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < sprite.speed) {
        sprite.location.x = sprite.destination.x;
        sprite.location.y = sprite.destination.y;
        sprite.mode = 'rest';
        return;
    }

    if (sprite.location.x > sprite.destination.x) {
        sprite.location.x -= sprite.speed;
    } else if (sprite.location.x < sprite.destination.x) {
        sprite.location.x += sprite.speed;
    }

    if (sprite.location.y > sprite.destination.y) {
        sprite.location.y -= sprite.speed;
    } else if (sprite.location.y < sprite.destination.y) {
        sprite.location.y += sprite.speed;
    }

    sprite.stepsTaken++;
    if (sprite.stepsTaken >= sprite.maxSteps) {
        sprite.mode = 'rest';
    }
}

function checkTrapDoorZone() {
    if (sprite.location.x >= canvas.width / 3 && sprite.location.x <= (canvas.width * 2) / 3) {
        if (!billboard.visible) {
            billboard.visible = true;
            billboard.alpha = 0;
            billboard.scale = 0.5;
            billboard.targetAlpha = 1;
            billboard.targetScale = 0.6;
            billboard.currentText = '';
            billboard.textIndex = 0;
        }
    } else {
        if (billboard.visible) {
            billboard.targetAlpha = 0;
            billboard.targetScale = 0.5;
            billboard.messageIndex++;
            if (billboard.messageIndex >= billboard.text.length) {
                billboard.messageIndex = 0;
            }
            billboard.visible = false;
        }
    }
}

function updateBillboardText() {
    if (billboard.visible && iterationCounter % 4 === 0) {
        if (billboard.textIndex < billboard.text[billboard.messageIndex].length) {
            billboard.currentText += billboard.text[billboard.messageIndex][billboard.textIndex];
            billboard.textIndex++;
        }
    }

    if (iterationCounter % (FRAME_RATE / 2) === 0) {
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
        let height = (canvas.height - 500) * billboard.scale;
        let x = (canvas.width - width) / 2;
        let y = 30; // Margin from the top of the screen

        ctx.save();
        ctx.globalAlpha = billboard.alpha;

        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.fillRect(x - 10, y - 10, width + 20, height + 20);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, width, height);

        ctx.fillStyle = 'white';
        ctx.font = `${billboard.fontSize}px "Courier New", Courier, monospace`;
        ctx.textBaseline = 'top';

        let text = billboard.currentText;
        let words = text.split(' ');
        let line = '';
        let lines = [];
        let maxWidth = width - 2 * billboard.margin;

        for (let i = 0; i < words.length; i++) {
            let testLine = line + words[i] + ' ';
            let metrics = ctx.measureText(testLine);
            let testWidth = metrics.width;
            if (testWidth > maxWidth && i > 0) {
                lines.push(line);
                line = words[i] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x + billboard.margin, y + billboard.margin + i * billboard.fontSize * 1.2);
        }

        ctx.restore();
    } else {
        billboard.visible = false;
    }
}

function drawSprite() {
    let currentImage = sprite.mode === 'run' ? sprite.images.run[sprite.currentImageIndex] : sprite.images.rest[sprite.currentImageIndex];
    ctx.save();
    if (sprite.facingLeft) {
        ctx.scale(-1, 1); // Flip horizontally
        ctx.drawImage(currentImage, -sprite.location.x - sprite.width / 2, sprite.location.y - sprite.height / 2, sprite.width, sprite.height);
    } else {
        ctx.drawImage(currentImage, sprite.location.x - sprite.width / 2, sprite.location.y - sprite.height / 2, sprite.width, sprite.height);
    }
    ctx.restore();
}

async function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    
    if (deltaTime >= FRAME_DURATION) {
        lastTime = timestamp;
        let bgImage = cachedImages[currentBackgroundIndex];
        let fgImage = cachedForegroundImages[currentForegroundIndex];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

        iterationCounter++;
        if (iterationCounter % 6 === 0) {
            currentBackgroundIndex = (currentBackgroundIndex + 1) % cachedImages.length;
            currentForegroundIndex = (currentForegroundIndex + 1) % cachedForegroundImages.length;
        }

        if (sprite.loaded) {
            moveSpriteTowardsDestination();

            spriteIterationCounter++;
            if (sprite.mode === 'run' && spriteIterationCounter % 9 === 0) {
                sprite.currentImageIndex = (sprite.currentImageIndex + 1) % sprite.images.run.length;
            } else if (sprite.mode === 'rest' && spriteIterationCounter % 9 === 0) {
                sprite.currentImageIndex = (sprite.currentImageIndex + 1) % sprite.images.rest.length;
            }

            drawSprite();
            checkTrapDoorZone();
        }

        if (billboard.visible || billboard.alpha > 0) {
            updateBillboardText();
            drawBillboard();
        }

        // Draw the foreground image
        if (fgImage) {
            ctx.save();
            ctx.drawImage(fgImage, 0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
    }

    requestAnimationFrame(gameLoop);
}

async function startGame() {
    await preloadImages();
    requestAnimationFrame(gameLoop);
}

document.getElementById('show-resume-btn').addEventListener('click', () => {
    const billboard = document.getElementById('billboard');
    billboard.style.display = 'block';
});

document.getElementById('billboard').addEventListener('click', (event) => {
    if (event.target.id === 'close-resume-btn') {
        const billboard = document.getElementById('billboard');
        billboard.style.display = 'none';
    }
});

startGame();

