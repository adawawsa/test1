const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextCtx = nextCanvas.getContext('2d');

canvas.width = BOARD_WIDTH * BLOCK_SIZE;
canvas.height = BOARD_HEIGHT * BLOCK_SIZE;
nextCanvas.width = 4 * BLOCK_SIZE;
nextCanvas.height = 4 * BLOCK_SIZE;

const COLORS = [
    null,
    '#00f0f0', // I - シアン
    '#0000f0', // J - 青
    '#f0a000', // L - オレンジ
    '#f0f000', // O - 黄色
    '#00f000', // S - 緑
    '#f000f0', // T - 紫
    '#f00000'  // Z - 赤
];

const PIECES = [
    null,
    [[1, 1, 1, 1]], // I
    [[2, 0, 0], [2, 2, 2]], // J
    [[0, 0, 3], [3, 3, 3]], // L
    [[4, 4], [4, 4]], // O
    [[0, 5, 5], [5, 5, 0]], // S
    [[0, 6, 0], [6, 6, 6]], // T
    [[7, 7, 0], [0, 7, 7]] // Z
];

class Tetris {
    constructor() {
        this.board = this.createBoard();
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropInterval = 1000;
        this.lastDropTime = 0;
        
        this.initEventListeners();
    }
    
    createBoard() {
        return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
    }
    
    initEventListeners() {
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        document.getElementById('pause-button').addEventListener('click', () => this.togglePause());
        
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gamePaused) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    this.score += 1;
                    this.updateScore();
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case ' ':
                    this.hardDrop();
                    break;
            }
        });
    }
    
    startGame() {
        this.board = this.createBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = true;
        this.gamePaused = false;
        this.dropInterval = 1000;
        
        this.updateScore();
        this.updateLevel();
        this.updateLines();
        
        document.getElementById('start-button').textContent = 'リスタート';
        document.getElementById('pause-button').disabled = false;
        
        this.spawnPiece();
        this.gameLoop();
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        document.getElementById('pause-button').textContent = this.gamePaused ? '再開' : '一時停止';
        
        if (!this.gamePaused) {
            this.gameLoop();
        }
    }
    
    gameLoop(currentTime = 0) {
        if (!this.gameRunning || this.gamePaused) return;
        
        const deltaTime = currentTime - this.lastDropTime;
        
        if (deltaTime > this.dropInterval) {
            this.movePiece(0, 1);
            this.lastDropTime = currentTime;
        }
        
        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    spawnPiece() {
        const pieceIndex = this.nextPiece || Math.floor(Math.random() * 7) + 1;
        this.currentPiece = PIECES[pieceIndex];
        this.currentX = Math.floor((BOARD_WIDTH - this.currentPiece[0].length) / 2);
        this.currentY = 0;
        
        this.nextPiece = Math.floor(Math.random() * 7) + 1;
        this.drawNextPiece();
        
        if (this.checkCollision()) {
            this.gameOver();
        }
    }
    
    movePiece(dx, dy) {
        this.currentX += dx;
        this.currentY += dy;
        
        if (this.checkCollision()) {
            this.currentX -= dx;
            this.currentY -= dy;
            
            if (dy > 0) {
                this.lockPiece();
                this.checkLines();
                this.spawnPiece();
            }
        }
    }
    
    rotatePiece() {
        const rotated = this.currentPiece[0].map((_, i) =>
            this.currentPiece.map(row => row[i]).reverse()
        );
        
        const previousPiece = this.currentPiece;
        this.currentPiece = rotated;
        
        if (this.checkCollision()) {
            this.currentPiece = previousPiece;
        }
    }
    
    hardDrop() {
        let dropDistance = 0;
        while (!this.checkCollision()) {
            this.currentY++;
            dropDistance++;
        }
        this.currentY--;
        dropDistance--;
        
        this.score += dropDistance * 2;
        this.updateScore();
        
        this.lockPiece();
        this.checkLines();
        this.spawnPiece();
    }
    
    checkCollision() {
        for (let y = 0; y < this.currentPiece.length; y++) {
            for (let x = 0; x < this.currentPiece[y].length; x++) {
                if (this.currentPiece[y][x]) {
                    const boardX = this.currentX + x;
                    const boardY = this.currentY + y;
                    
                    if (boardX < 0 || boardX >= BOARD_WIDTH || 
                        boardY >= BOARD_HEIGHT ||
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    lockPiece() {
        for (let y = 0; y < this.currentPiece.length; y++) {
            for (let x = 0; x < this.currentPiece[y].length; x++) {
                if (this.currentPiece[y][x]) {
                    const boardY = this.currentY + y;
                    if (boardY >= 0) {
                        this.board[boardY][this.currentX + x] = this.currentPiece[y][x];
                    }
                }
            }
        }
    }
    
    checkLines() {
        let linesCleared = 0;
        
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(BOARD_WIDTH).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += [40, 100, 300, 1200][linesCleared - 1] * this.level;
            this.updateScore();
            this.updateLines();
            
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
                this.updateLevel();
            }
        }
    }
    
    draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // ボードを描画
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, COLORS[this.board[y][x]]);
                }
            }
        }
        
        // 現在のピースを描画
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.length; y++) {
                for (let x = 0; x < this.currentPiece[y].length; x++) {
                    if (this.currentPiece[y][x]) {
                        this.drawBlock(
                            this.currentX + x,
                            this.currentY + y,
                            COLORS[this.currentPiece[y][x]]
                        );
                    }
                }
            }
        }
    }
    
    drawBlock(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 2, 2);
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, 2, BLOCK_SIZE - 2);
    }
    
    drawNextPiece() {
        nextCtx.fillStyle = '#000';
        nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
        
        if (this.nextPiece) {
            const piece = PIECES[this.nextPiece];
            const offsetX = (4 - piece[0].length) / 2;
            const offsetY = (4 - piece.length) / 2;
            
            for (let y = 0; y < piece.length; y++) {
                for (let x = 0; x < piece[y].length; x++) {
                    if (piece[y][x]) {
                        nextCtx.fillStyle = COLORS[piece[y][x]];
                        nextCtx.fillRect(
                            (offsetX + x) * BLOCK_SIZE,
                            (offsetY + y) * BLOCK_SIZE,
                            BLOCK_SIZE - 2,
                            BLOCK_SIZE - 2
                        );
                        
                        nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                        nextCtx.fillRect(
                            (offsetX + x) * BLOCK_SIZE,
                            (offsetY + y) * BLOCK_SIZE,
                            BLOCK_SIZE - 2,
                            2
                        );
                        nextCtx.fillRect(
                            (offsetX + x) * BLOCK_SIZE,
                            (offsetY + y) * BLOCK_SIZE,
                            2,
                            BLOCK_SIZE - 2
                        );
                    }
                }
            }
        }
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateLevel() {
        document.getElementById('level').textContent = this.level;
    }
    
    updateLines() {
        document.getElementById('lines').textContent = this.lines;
    }
    
    gameOver() {
        this.gameRunning = false;
        alert(`ゲームオーバー！\nスコア: ${this.score}`);
        document.getElementById('pause-button').disabled = true;
    }
}

const game = new Tetris();