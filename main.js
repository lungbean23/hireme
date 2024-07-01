// Define background images
const background_array = ["0.png", "1.png", "2.png"];

// Initialize cursor variable
let CCC = 0;

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Event listener for mouse clicks
document.addEventListener('click', function(event) {
    const centerX = window.innerWidth / 2;
    if (event.clientX < centerX) {
        // Clicked left of center
        CCC--;
    } else {
        // Clicked right of center
        CCC++;
    }
});

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate index within bounds of background_array
    let index = CCC % background_array.length;
    if (index < 0) {
        index += background_array.length;
    }

    // Load and draw background image
    const img = new Image();
    img.onload = function() {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = background_array[index];

    // Request next frame
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
