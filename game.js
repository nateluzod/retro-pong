const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreLeftEl = document.getElementById('scoreLeft');
const scoreRightEl = document.getElementById('scoreRight');
const gameOverEl = document.getElementById('gameOver');
const startMessageEl = document.getElementById('startMessage');

// Initialize Web Audio API for retro sounds
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Music system variables
let musicNodes = {
    bassOsc: null,
    bassGain: null,
    leadOsc: null,
    leadGain: null,
    drumOsc: null,
    drumGain: null,
    arpOsc: null,
    arpGain: null,
    masterGain: null
};

let musicTempo = 120; // BPM
let beatCounter = 0;
let musicStartTime = 0;
let isMusicPlaying = false;

// Retro sound effect functions
const sounds = {
    paddleHit: () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    },
    
    wallBounce: () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
    },
    
    score: () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(50, audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    },
    
    gameStart: () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'square';
        // Ascending arpeggio
        oscillator.frequency.setValueAtTime(261.63, audioContext.currentTime); // C4
        oscillator.frequency.setValueAtTime(329.63, audioContext.currentTime + 0.1); // E4
        oscillator.frequency.setValueAtTime(392.00, audioContext.currentTime + 0.2); // G4
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime + 0.3); // C5
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
    },
    
    gameOver: () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'square';
        // Descending sad sound
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(100, audioContext.currentTime + 0.4);
        
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
    }
};

// Dynamic music system
const music = {
    init: () => {
        // Create master gain
        musicNodes.masterGain = audioContext.createGain();
        musicNodes.masterGain.gain.value = 0.15;
        musicNodes.masterGain.connect(audioContext.destination);
        
        // Create bass line
        musicNodes.bassOsc = audioContext.createOscillator();
        musicNodes.bassGain = audioContext.createGain();
        musicNodes.bassOsc.type = 'sawtooth';
        musicNodes.bassGain.gain.value = 0;
        musicNodes.bassOsc.connect(musicNodes.bassGain);
        musicNodes.bassGain.connect(musicNodes.masterGain);
        
        // Create lead synth
        musicNodes.leadOsc = audioContext.createOscillator();
        musicNodes.leadGain = audioContext.createGain();
        musicNodes.leadOsc.type = 'square';
        musicNodes.leadGain.gain.value = 0;
        musicNodes.leadOsc.connect(musicNodes.leadGain);
        musicNodes.leadGain.connect(musicNodes.masterGain);
        
        // Create drum
        musicNodes.drumOsc = audioContext.createOscillator();
        musicNodes.drumGain = audioContext.createGain();
        musicNodes.drumOsc.type = 'triangle';
        musicNodes.drumGain.gain.value = 0;
        musicNodes.drumOsc.connect(musicNodes.drumGain);
        musicNodes.drumGain.connect(musicNodes.masterGain);
        
        // Create arpeggiator
        musicNodes.arpOsc = audioContext.createOscillator();
        musicNodes.arpGain = audioContext.createGain();
        musicNodes.arpOsc.type = 'sine';
        musicNodes.arpGain.gain.value = 0;
        musicNodes.arpOsc.connect(musicNodes.arpGain);
        musicNodes.arpGain.connect(musicNodes.masterGain);
        
        // Start oscillators (they're silent until we set gain)
        musicNodes.bassOsc.start();
        musicNodes.leadOsc.start();
        musicNodes.drumOsc.start();
        musicNodes.arpOsc.start();
    },
    
    start: () => {
        if (isMusicPlaying) return;
        
        if (!musicNodes.masterGain) {
            music.init();
        }
        
        isMusicPlaying = true;
        musicStartTime = audioContext.currentTime;
        music.update();
    },
    
    stop: () => {
        if (!isMusicPlaying) return;
        
        isMusicPlaying = false;
        // Fade out all gains
        const now = audioContext.currentTime;
        musicNodes.bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        musicNodes.leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        musicNodes.drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        musicNodes.arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    },
    
    update: () => {
        if (!isMusicPlaying) return;
        
        const now = audioContext.currentTime;
        const beatDuration = 60 / musicTempo;
        const currentBeat = Math.floor((now - musicStartTime) / beatDuration);
        
        // Calculate intensity based on game state
        let intensity = 0.3; // Base intensity
        
        // Add intensity based on score difference
        const scoreDiff = Math.abs(game.scoreLeft - game.scoreRight);
        intensity += scoreDiff * 0.1;
        
        // Add intensity if close to winning
        const maxScore = Math.max(game.scoreLeft, game.scoreRight);
        if (maxScore >= WINNING_SCORE - 1) {
            intensity += 0.3;
        }
        
        // Add intensity based on ball speed
        const ballSpeed = Math.sqrt(game.ball.dx * game.ball.dx + game.ball.dy * game.ball.dy);
        intensity += (ballSpeed - BALL_SPEED_INITIAL) * 0.05;
        
        intensity = Math.min(1, intensity);
        
        // Update tempo based on intensity
        musicTempo = 120 + (intensity * 80);
        
        // Bass pattern (always playing)
        const bassNotes = [55, 55, 82.41, 55, 55, 82.41, 73.42, 73.42]; // A1 pattern
        const bassNote = bassNotes[currentBeat % 8];
        musicNodes.bassOsc.frequency.setValueAtTime(bassNote, now);
        musicNodes.bassGain.gain.setValueAtTime(0.3 * intensity, now);
        
        // Drum pattern (kicks in at medium intensity)
        if (intensity > 0.4) {
            if (currentBeat % 4 === 0) {
                musicNodes.drumOsc.frequency.setValueAtTime(60, now);
                musicNodes.drumGain.gain.setValueAtTime(0.5, now);
                musicNodes.drumGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            } else if (currentBeat % 4 === 2) {
                musicNodes.drumOsc.frequency.setValueAtTime(200, now);
                musicNodes.drumGain.gain.setValueAtTime(0.3, now);
                musicNodes.drumGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            }
        }
        
        // Lead melody (kicks in at high intensity)
        if (intensity > 0.6) {
            const leadNotes = [440, 0, 523.25, 440, 392, 0, 349.23, 392]; // A4 melody
            const leadNote = leadNotes[currentBeat % 8];
            if (leadNote > 0) {
                musicNodes.leadOsc.frequency.setValueAtTime(leadNote, now);
                musicNodes.leadGain.gain.setValueAtTime(0.15 * intensity, now);
            } else {
                musicNodes.leadGain.gain.setValueAtTime(0, now);
            }
        }
        
        // Arpeggiator (maximum intensity)
        if (intensity > 0.8) {
            const arpNotes = [880, 1046.5, 1318.5, 1046.5]; // High arpeggio
            const arpNote = arpNotes[Math.floor((now * 8) % 4)];
            musicNodes.arpOsc.frequency.setValueAtTime(arpNote, now);
            musicNodes.arpGain.gain.setValueAtTime(0.1 * intensity, now);
        }
        
        // Schedule next update
        if (isMusicPlaying) {
            setTimeout(() => music.update(), 50);
        }
    }
};

const PADDLE_HEIGHT_INITIAL = 80;
const PADDLE_WIDTH = 15;
const PADDLE_SIZE_CHANGE = 10; // Pixels to shrink/grow per round
const PADDLE_MIN_HEIGHT = 30; // Minimum paddle height
const PADDLE_MAX_HEIGHT = 150; // Maximum paddle height
const BALL_SIZE = 12;
const PADDLE_SPEED = 5;
const BALL_SPEED_INITIAL = 4;
const WINNING_SCORE = 5;
const PARTICLE_COUNT = 20;

// Difficulty settings
const DIFFICULTY_LEVELS = {
    easy: {
        aiSpeed: 0.5,
        aiError: 30,
        aiReactionDelay: 15,
        label: 'EASY',
        color: '#00ff00'
    },
    medium: {
        aiSpeed: 0.75,
        aiError: 15,
        aiReactionDelay: 8,
        label: 'MEDIUM',
        color: '#ffff00'
    },
    hard: {
        aiSpeed: 0.95,
        aiError: 5,
        aiReactionDelay: 2,
        label: 'HARD',
        color: '#ff0000'
    }
};

let currentDifficulty = 'medium';
let aiSettings = DIFFICULTY_LEVELS[currentDifficulty];

let gameState = 'waiting';
let ballSpeedX = BALL_SPEED_INITIAL;
let ballSpeedY = BALL_SPEED_INITIAL;
let particles = [];
let isAIEnabled = true; // Single player mode by default
let paddleLeftHeight = PADDLE_HEIGHT_INITIAL;
let paddleRightHeight = PADDLE_HEIGHT_INITIAL;
let aiReactionTimer = 0;

const game = {
    scoreLeft: 0,
    scoreRight: 0,
    paddleLeft: {
        x: 30,
        y: canvas.height / 2 - paddleLeftHeight / 2,
        dy: 0,
        height: paddleLeftHeight
    },
    paddleRight: {
        x: canvas.width - 30 - PADDLE_WIDTH,
        y: canvas.height / 2 - paddleRightHeight / 2,
        dy: 0,
        height: paddleRightHeight
    },
    ball: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        dx: ballSpeedX,
        dy: ballSpeedY,
        trail: []
    }
};

const keys = {};

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02;
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.restore();
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function drawPaddle(paddle, color) {
    ctx.fillStyle = color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.fillRect(paddle.x, paddle.y, PADDLE_WIDTH, paddle.height);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x - 2, paddle.y - 2, PADDLE_WIDTH + 4, paddle.height + 4);
    
    // Visual indicator for size changes
    if (paddle.height < PADDLE_HEIGHT_INITIAL) {
        // Red tint for shrunk paddles
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(paddle.x - 2, paddle.y - 2, PADDLE_WIDTH + 4, paddle.height + 4);
    } else if (paddle.height > PADDLE_HEIGHT_INITIAL) {
        // Green glow for grown paddles
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.fillRect(paddle.x - 2, paddle.y - 2, PADDLE_WIDTH + 4, paddle.height + 4);
        // Extra glow effect
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#00ff00';
        ctx.strokeStyle = '#00ff00';
        ctx.strokeRect(paddle.x - 4, paddle.y - 4, PADDLE_WIDTH + 8, paddle.height + 8);
    }
}

function drawBall() {
    game.ball.trail.push({ x: game.ball.x, y: game.ball.y });
    if (game.ball.trail.length > 10) {
        game.ball.trail.shift();
    }
    
    game.ball.trail.forEach((point, index) => {
        ctx.save();
        ctx.globalAlpha = index / 10 * 0.5;
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffff00';
        ctx.fillRect(point.x - BALL_SIZE/2, point.y - BALL_SIZE/2, BALL_SIZE, BALL_SIZE);
        ctx.restore();
    });
    
    ctx.fillStyle = '#ffff00';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ffff00';
    ctx.fillRect(game.ball.x - BALL_SIZE/2, game.ball.y - BALL_SIZE/2, BALL_SIZE, BALL_SIZE);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(game.ball.x - BALL_SIZE/2 - 1, game.ball.y - BALL_SIZE/2 - 1, BALL_SIZE + 2, BALL_SIZE + 2);
}

function drawNet() {
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 15]);
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawBackground() {
    ctx.fillStyle = '#0a0014';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function updateAI() {
    // Add reaction delay based on difficulty
    aiReactionTimer++;
    if (aiReactionTimer < aiSettings.aiReactionDelay) {
        return;
    }
    aiReactionTimer = 0;
    
    // AI controls the right paddle
    const paddleCenter = game.paddleRight.y + game.paddleRight.height / 2;
    const ballY = game.ball.y;
    
    // Predict where the ball will be when it reaches the paddle
    let predictedY = ballY;
    if (game.ball.dx > 0) { // Ball is moving towards AI
        const timeToReachPaddle = (game.paddleRight.x - game.ball.x) / game.ball.dx;
        predictedY = game.ball.y + (game.ball.dy * timeToReachPaddle * aiSettings.aiSpeed);
    }
    
    // Add some randomness to make AI beatable
    predictedY += (Math.random() - 0.5) * aiSettings.aiError;
    
    // Move AI paddle towards predicted position
    const diff = predictedY - paddleCenter;
    if (Math.abs(diff) > 5) { // Dead zone to prevent jittering
        if (diff > 0) {
            game.paddleRight.dy = Math.min(PADDLE_SPEED * aiSettings.aiSpeed, Math.abs(diff) * 0.1);
        } else {
            game.paddleRight.dy = -Math.min(PADDLE_SPEED * aiSettings.aiSpeed, Math.abs(diff) * 0.1);
        }
    } else {
        game.paddleRight.dy = 0;
    }
    
    game.paddleRight.y += game.paddleRight.dy;
    game.paddleRight.y = Math.max(0, Math.min(canvas.height - game.paddleRight.height, game.paddleRight.y));
}

function updatePaddles() {
    // Human player controls
    if (keys['w'] || keys['W']) game.paddleLeft.dy = -PADDLE_SPEED;
    else if (keys['s'] || keys['S']) game.paddleLeft.dy = PADDLE_SPEED;
    else game.paddleLeft.dy = 0;
    
    game.paddleLeft.y += game.paddleLeft.dy;
    game.paddleLeft.y = Math.max(0, Math.min(canvas.height - game.paddleLeft.height, game.paddleLeft.y));
    
    if (isAIEnabled) {
        updateAI();
    } else {
        // Two player mode - right paddle controlled by arrows
        if (keys['ArrowUp']) game.paddleRight.dy = -PADDLE_SPEED;
        else if (keys['ArrowDown']) game.paddleRight.dy = PADDLE_SPEED;
        else game.paddleRight.dy = 0;
        
        game.paddleRight.y += game.paddleRight.dy;
        game.paddleRight.y = Math.max(0, Math.min(canvas.height - game.paddleRight.height, game.paddleRight.y));
    }
}

function checkPaddleCollision() {
    if (game.ball.x - BALL_SIZE/2 <= game.paddleLeft.x + PADDLE_WIDTH &&
        game.ball.x + BALL_SIZE/2 >= game.paddleLeft.x &&
        game.ball.y + BALL_SIZE/2 >= game.paddleLeft.y &&
        game.ball.y - BALL_SIZE/2 <= game.paddleLeft.y + game.paddleLeft.height &&
        game.ball.dx < 0) {
        
        game.ball.dx = Math.abs(game.ball.dx) * 1.05;
        let relativeIntersectY = (game.paddleLeft.y + game.paddleLeft.height/2) - game.ball.y;
        let normalizedRelativeIntersectionY = relativeIntersectY / (game.paddleLeft.height/2);
        game.ball.dy = -normalizedRelativeIntersectionY * 5;
        createExplosion(game.ball.x, game.ball.y, '#00ffff');
        sounds.paddleHit();
    }
    
    if (game.ball.x + BALL_SIZE/2 >= game.paddleRight.x &&
        game.ball.x - BALL_SIZE/2 <= game.paddleRight.x + PADDLE_WIDTH &&
        game.ball.y + BALL_SIZE/2 >= game.paddleRight.y &&
        game.ball.y - BALL_SIZE/2 <= game.paddleRight.y + game.paddleRight.height &&
        game.ball.dx > 0) {
        
        game.ball.dx = -Math.abs(game.ball.dx) * 1.05;
        let relativeIntersectY = (game.paddleRight.y + game.paddleRight.height/2) - game.ball.y;
        let normalizedRelativeIntersectionY = relativeIntersectY / (game.paddleRight.height/2);
        game.ball.dy = -normalizedRelativeIntersectionY * 5;
        createExplosion(game.ball.x, game.ball.y, '#ff00ff');
        sounds.paddleHit();
    }
}

function updateBall() {
    game.ball.x += game.ball.dx;
    game.ball.y += game.ball.dy;
    
    if (game.ball.y - BALL_SIZE/2 <= 0 || game.ball.y + BALL_SIZE/2 >= canvas.height) {
        game.ball.dy = -game.ball.dy;
        createExplosion(game.ball.x, game.ball.y, '#00ff00');
        sounds.wallBounce();
    }
    
    checkPaddleCollision();
    
    if (game.ball.x < 0) {
        game.scoreRight++;
        scoreRightEl.textContent = game.scoreRight;
        createExplosion(0, game.ball.y, '#ff0000');
        sounds.score();
        adjustPaddles('left');
        resetBall();
        checkWin();
    }
    
    if (game.ball.x > canvas.width) {
        game.scoreLeft++;
        scoreLeftEl.textContent = game.scoreLeft;
        createExplosion(canvas.width, game.ball.y, '#ff0000');
        sounds.score();
        adjustPaddles('right');
        resetBall();
        checkWin();
    }
}

function resetBall() {
    game.ball.x = canvas.width / 2;
    game.ball.y = canvas.height / 2;
    game.ball.dx = (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED_INITIAL;
    game.ball.dy = (Math.random() - 0.5) * BALL_SPEED_INITIAL;
    game.ball.trail = [];
}

function checkWin() {
    if (game.scoreLeft >= WINNING_SCORE || game.scoreRight >= WINNING_SCORE) {
        gameState = 'over';
        gameOverEl.style.display = 'block';
        if (isAIEnabled) {
            gameOverEl.textContent = game.scoreLeft >= WINNING_SCORE ? 'YOU WIN!' : 'COMPUTER WINS!';
        } else {
            gameOverEl.textContent = game.scoreLeft >= WINNING_SCORE ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!';
        }
        sounds.gameOver();
        music.stop();
    }
}

function adjustPaddles(loserSide) {
    if (loserSide === 'left') {
        // Shrink left paddle (loser)
        paddleLeftHeight = Math.max(PADDLE_MIN_HEIGHT, paddleLeftHeight - PADDLE_SIZE_CHANGE);
        game.paddleLeft.height = paddleLeftHeight;
        // Recenter loser paddle
        game.paddleLeft.y = Math.min(game.paddleLeft.y, canvas.height - paddleLeftHeight);
        
        // Grow right paddle (winner)
        paddleRightHeight = Math.min(PADDLE_MAX_HEIGHT, paddleRightHeight + PADDLE_SIZE_CHANGE);
        game.paddleRight.height = paddleRightHeight;
        // Keep winner paddle centered if possible
        const centerY = game.paddleRight.y + (paddleRightHeight - PADDLE_SIZE_CHANGE) / 2;
        game.paddleRight.y = Math.max(0, Math.min(canvas.height - paddleRightHeight, centerY - paddleRightHeight / 2));
    } else {
        // Shrink right paddle (loser)
        paddleRightHeight = Math.max(PADDLE_MIN_HEIGHT, paddleRightHeight - PADDLE_SIZE_CHANGE);
        game.paddleRight.height = paddleRightHeight;
        // Recenter loser paddle
        game.paddleRight.y = Math.min(game.paddleRight.y, canvas.height - paddleRightHeight);
        
        // Grow left paddle (winner)
        paddleLeftHeight = Math.min(PADDLE_MAX_HEIGHT, paddleLeftHeight + PADDLE_SIZE_CHANGE);
        game.paddleLeft.height = paddleLeftHeight;
        // Keep winner paddle centered if possible
        const centerY = game.paddleLeft.y + (paddleLeftHeight - PADDLE_SIZE_CHANGE) / 2;
        game.paddleLeft.y = Math.max(0, Math.min(canvas.height - paddleLeftHeight, centerY - paddleLeftHeight / 2));
    }
}

function resetGame() {
    game.scoreLeft = 0;
    game.scoreRight = 0;
    scoreLeftEl.textContent = '0';
    scoreRightEl.textContent = '0';
    gameOverEl.style.display = 'none';
    startMessageEl.style.display = 'none';
    resetBall();
    // Reset paddle sizes
    paddleLeftHeight = PADDLE_HEIGHT_INITIAL;
    paddleRightHeight = PADDLE_HEIGHT_INITIAL;
    game.paddleLeft.height = paddleLeftHeight;
    game.paddleRight.height = paddleRightHeight;
    game.paddleLeft.y = canvas.height / 2 - paddleLeftHeight / 2;
    game.paddleRight.y = canvas.height / 2 - paddleRightHeight / 2;
    particles = [];
    music.stop();
}

function updateParticles() {
    particles = particles.filter(particle => particle.life > 0);
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });
}

function drawDifficulty() {
    if (isAIEnabled) {
        ctx.save();
        ctx.fillStyle = aiSettings.color;
        ctx.font = '14px Orbitron';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = aiSettings.color;
        ctx.fillText(aiSettings.label, canvas.width / 2, 30);
        ctx.restore();
    }
}

function gameLoop() {
    drawBackground();
    drawNet();
    drawDifficulty();
    
    if (gameState === 'playing') {
        updatePaddles();
        updateBall();
    }
    
    drawPaddle(game.paddleLeft, '#00ffff');
    drawPaddle(game.paddleRight, '#ff00ff');
    drawBall();
    updateParticles();
    
    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => {
    console.log('Key pressed:', e.key, 'Code:', e.code);
    keys[e.key] = true;
    
    if (e.key === ' ' || e.code === 'Space' || e.keyCode === 32) {
        e.preventDefault();
        console.log('Space detected, current state:', gameState);
        if (gameState === 'waiting') {
            gameState = 'playing';
            startMessageEl.style.display = 'none';
            sounds.gameStart();
            music.start();
            console.log('Game started!');
        } else if (gameState === 'playing') {
            gameState = 'paused';
            startMessageEl.style.display = 'block';
            startMessageEl.textContent = 'PAUSED - Press SPACE to Continue';
            music.stop();
        } else if (gameState === 'paused') {
            gameState = 'playing';
            startMessageEl.style.display = 'none';
            music.start();
        } else if (gameState === 'over') {
            resetGame();
            gameState = 'playing';
        }
    }
    
    // Change difficulty with number keys (only in AI mode)
    if (isAIEnabled && gameState === 'waiting') {
        if (e.key === '1') {
            currentDifficulty = 'easy';
            aiSettings = DIFFICULTY_LEVELS[currentDifficulty];
            startMessageEl.textContent = 'EASY Mode - Press SPACE to Start';
            console.log('Difficulty set to EASY');
        } else if (e.key === '2') {
            currentDifficulty = 'medium';
            aiSettings = DIFFICULTY_LEVELS[currentDifficulty];
            startMessageEl.textContent = 'MEDIUM Mode - Press SPACE to Start';
            console.log('Difficulty set to MEDIUM');
        } else if (e.key === '3') {
            currentDifficulty = 'hard';
            aiSettings = DIFFICULTY_LEVELS[currentDifficulty];
            startMessageEl.textContent = 'HARD Mode - Press SPACE to Start';
            console.log('Difficulty set to HARD');
        }
    }
    
    // Toggle AI mode with 'P' key
    if (e.key === 'p' || e.key === 'P' || e.code === 'KeyP') {
        isAIEnabled = !isAIEnabled;
        resetGame();
        gameState = 'waiting';
        startMessageEl.style.display = 'block';
        if (isAIEnabled) {
            startMessageEl.textContent = `${aiSettings.label} Mode - Press SPACE to Start`;
        } else {
            startMessageEl.textContent = 'Two Player Mode - Press SPACE to Start';
        }
        // Update player labels
        const rightLabel = document.getElementById('rightPlayerLabel');
        if (rightLabel) {
            rightLabel.textContent = isAIEnabled ? 'CPU' : 'P2';
        }
        const leftLabel = document.querySelector('.score-left div');
        if (leftLabel) {
            leftLabel.textContent = isAIEnabled ? 'YOU' : 'P1';
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Initialize on load
window.addEventListener('load', () => {
    console.log('Game loaded, initial state:', gameState);
    gameLoop();
});