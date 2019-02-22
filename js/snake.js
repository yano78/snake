class Gameboard {
	constructor() {
		this.width = width;
		this.height = height;
		this.block = block;
		this.ctx = ctx;
		this.wallColor = '#555';
		// define walls for levels
		// x1, y1 - starting points of wall
		// x2, y2 - size of wall
		this.levels = [
			[],
			[{x1: 10, y1: 15, x2: 31, y2: 1}],
			[{x1: 10, y1: 15, x2: 31, y2: 1}, {x1: 25, y1: 8, x2: 1, y2: 15}],
			[
				{x1: 10, y1: 8, x2: 1, y2: 15},
				{x1: 40, y1: 8, x2: 1, y2: 15},
				{x1: 25, y1: 8, x2: 1, y2: 15},
				{x1: 14, y1: 15, x2: 8, y2: 1},
				{x1: 29, y1: 15, x2: 8, y2: 1}],
			[
				{x1: 10, y1: 8, x2: 1, y2: 15},
				{x1: 40, y1: 8, x2: 1, y2: 15},
				{x1: 25, y1: 8, x2: 1, y2: 15},
				{x1: 14, y1: 15, x2: 8, y2: 1},
				{x1: 29, y1: 15, x2: 8, y2: 1},
				{x1: 0, y1: 0, x2: 50, y2: 1},
				{x1: 0, y1: 29, x2: 50, y2: 1},
				{x1: 0, y1: 0, x2: 1, y2: 29},
				{x1: 49, y1: 0, x2: 1, y2: 29}
			]
		];
		this.walls = []; // currently active walls
		// powerups modifiers
		this.speedM = 0;
		this.pointsM = 1;
		this.noclip = false;

		this.food = null;
		this.powerup = null; // {isActive: true, x: 1, y: 1, type: 'cut'}
		this.powerups = [
			{type: 'cut', label: '-'},
			{type: 'extend', label: '+'},
			{type: 'faster', label: '>'},
			{type: 'slower', label: '<'},
			{type: 'multiply', label: '*'},
			{type: 'noclip', label: '|'}
		];
	}

	clear() {
		ctx.clearRect(0, 0, this.width * this.block, this.height * this.block);
		this.walls = [];
	}

	drawWalls(level) {
		// get walls for selected level
		const l = this.levels[level - 1];
		const b = this.block;
		this.ctx.fillStyle = this.wallColor;

		for (let w of l) {
			this.ctx.fillRect(w.x1 * b, w.y1 * b, w.x2 * b, w.y2 * b);
			for (let a = w.x1; a < w.x1 + w.x2; a++) {
				for (let b = w.y1; b < w.y1 + w.y2; b++) {
					this.walls.push({x: a, y: b});
				}
			}
		}
	}

	createFood(snake) {
		const w = this.width;
		const h = this.height;
		const color = '#0f0';

		if (!this.food) {

			let foodCollideFlag = true;

			// avoid creating food on snakes body or walls
			while (foodCollideFlag) {
				foodCollideFlag = false;
				const x = Math.floor(Math.random() * w);
				const y = Math.floor(Math.random() * h);
				this.food = {x, y};
				foodCollideFlag = this.checkConflict(snake);
			}

			this.drawFood(this.food, color);
		}
	}

	checkConflict(snake) {
		for (let s of snake.body) {
			if (Snake.collision(s, this.food)) {
				return true;
			}
		}

		for (let w of this.walls) {
			if (Snake.collision(w, this.food)) {
				return true;
			}
		}
	}

	drawFood(food, color) {
		const b = this.block;
		const ctx = this.ctx;

		ctx.fillStyle = color;
		ctx.fillRect(food.x * b, food.y * b, b, b);
		if (food.label) {
			ctx.fillStyle = '#fff';
			ctx.font = 1 + b + 'px VT323';
			ctx.fillText(food.label, food.x * b + (b / 4), food.y * b + (b / 1.3));
		}
	}

	createPowerup(snake) {
		const w = this.width;
		const h = this.height;
		let powerup = {};

		if (!this.powerup) {

			let collideFlag = true;

			while (collideFlag) {
				collideFlag = false;
				const x = Math.floor(Math.random() * w);
				const y = Math.floor(Math.random() * h);
				// powerup type - skip 'noclip' powerup if there is no walls on board
				const t = Math.floor(Math.random() * (this.walls.length ? this.powerups.length : this.powerups.length - 1));
				powerup = {x: x, y: y, ...this.powerups[t]};

				// check if powerup is generated on snakes body or on walls
				collideFlag = this.checkConflict(snake);
			}
			this.powerup = {isActive: false, ...powerup};
			this.drawFood(powerup, '#f00');
		}
	}

	resetPowerups() {
		this.powerup = null;
		this.speedM = 0;
		this.pointsM = 1;
		this.noclip = false;
	}
}

class Snake {
	constructor(board) {
		this.board = board;
		this.ctx = board.ctx;
		this.block = board.block;
		this.body = [{x: 5, y: 5}, {x: 4, y: 5}];
		this.color = '#fff';
		this.direction = 'right';
		this.grow = 0;
		this.newDirection = null;
		this.alive = true;
	}

	get head() {
		return Object.assign({}, this.body[0]);
	}

	draw() {
		const b = this.block;
		this.ctx.fillStyle = this.color;
		for (let s of this.body) {
			this.ctx.fillRect(s.x * b, s.y * b, b, b);
		}
	}

	erase(point) {
		const b = this.block;
		this.ctx.clearRect(point.x * b, point.y * b, b, b);
	}

	move() {
		let nextHead = this.head;
		const w = this.board.width;
		const h = this.board.height;

		if (this.newDirection) {
			this.direction = this.newDirection;
			this.newDirection = null;
		}

		switch (this.direction) {
			case 'up':
				nextHead.y--;
				break;
			case 'down':
				nextHead.y++;
				break;
			case 'left':
				nextHead.x--;
				break;
			case 'right':
				nextHead.x++;
				break;
		}

		// snake may go thru borders of the gameboard
		// since modulo doesn't work well in this case (negative numbers)
		// we need do a little trick
		nextHead.x = ((nextHead.x % w) + w) % w;
		nextHead.y = ((nextHead.y % h) + h) % h;

		// add new segment(s) each time snake eats food
		if (this.grow > 0) {
			this.grow--;
		}
		// remove segment(s) when power up is eaten
		else if (this.grow < 0) {
			this.grow++;
			if (this.body.length > 2) {
				this.erase(this.body.pop());
				this.erase(this.body.pop());
			}
		} else {
			this.erase(this.body.pop());
		}

		// check if snake bites itself
		for (let b of this.body) {
			if (Snake.collision(nextHead, b)) {
				this.alive = false;
				return;
			}
		}

		// check if snake hits the wall
		if (this.board.walls.length !== 0 && !this.board.noclip) {
			for (let w of this.board.walls) {
				if (Snake.collision(nextHead, w)) {
					this.alive = false;
					return;
				}
			}
		}

		this.body.unshift(nextHead);

		this.draw();
	}

	static collision(a, b) {
		return (a.x === b.x && a.y === b.y);
	}
}

class Game {
	constructor(board, snake, score, options) {
		this.board = board;
		this.snake = snake;
		this.foodEated = 0; // powerups foodEated
		this.score = score;
		this.options = options;
	}

	start() {
		// clear the board, set defaults and options
		this.board.clear();
		this.board.drawWalls(this.options.labyrinth);
		this.board.food = null;
		this.board.resetPowerups();
		this.snake.body = [{x: 5, y: 5}, {x: 4, y: 5}];
		this.snake.direction = 'right';
		this.snake.alive = true;
		this.score.score = 0;
		this.score.updateScore(0);
		this.board.createFood(snake);
		this.board.ctx.canvas.focus();
		this.run();
		document.getElementById('start').disabled = true;
	}

	async run() {
		const gameoverEl = document.getElementById("gameover");

		gameoverEl.classList.add("hidden");

		const level = this.options.labyrinth;
		const powerupTime = this.options.powerupTime;
		const powerupVal = this.options.powerupVal;
		const speed = this.options.speed;
		const points = speed + level - 1;

		while (true) {
			this.snake.move();

			// when 'noclip' powerup is active we need to redraw the walls
			if (this.board.powerup && this.board.powerup.type === 'noclip') {
				this.board.drawWalls(level);
			}

			if (!this.snake.alive) {
				break;
			}

			// check if snake eaten food
			if (this.board.food) {
				if (Snake.collision(this.snake.head, this.board.food)) {
					this.snake.grow++;
					this.score.updateScore(points * this.board.pointsM);
					this.foodEated++;
					this.board.food = null;
					this.board.createFood(snake);

					// create new powerup after some amount of eaten food
					if (this.foodEated % 5 === 0) {
						this.board.createPowerup(snake);
					}
				}
			}

			// check if snake eaten powerup
			if (this.board.powerup && !this.board.powerup.isActive) {
				if (Snake.collision(this.snake.head, this.board.powerup)) {
					this.board.powerup.isActive = true;
					switch (this.board.powerup.type) {
						// one time power ups
						case 'cut':
							this.snake.grow -= powerupVal;
							this.board.powerup = null;
							break;
						case 'extend':
							this.snake.grow += powerupVal;
							this.board.powerup = null;
							break;
						// timed power ups
						case 'faster':
							this.board.speedM = powerupVal;
							this.setTimer(powerupTime);
							break;
						case 'slower':
							this.board.speedM = -powerupVal;
							this.setTimer(powerupTime);
							break;
						case 'multiply':
							this.board.pointsM = powerupVal;
							this.setTimer(powerupTime);
							break;
						case 'noclip':
							this.board.noclip = true;
							this.setTimer(powerupTime);
							break;
					}
					this.wait(powerupTime * 1000).then(() => this.board.resetPowerups());
				}
			}
			await this.wait(200 - ((speed - 1) * 50) - (this.board.speedM * 20));
		}

		gameoverEl.classList.remove('hidden');
		this.score.updateHighScore();
		document.getElementById('start').disabled = false;
	}

	wait(time) {
		return new Promise(resolve => setTimeout(resolve, time));
	}

	// powerups timer
	setTimer(time) {
		const timerEl = document.getElementById('timer');
		timerEl.innerText = time--;
		const timer = setInterval(function () {
			if (time <= 0) {
				clearInterval(timer);
			}
			timerEl.innerText = time--;
		}, 1000);
	}

	keyDown(event) {
		const direction = this.snake.direction;

		// Use arrows and WSAD keys to move snake
		switch (event.key.toLowerCase()) {
			case 'w' :
			case 'arrowup' :
				if (direction !== 'down') {
					this.snake.newDirection = 'up';
				}
				break;
			case 's' :
			case 'arrowdown' :
				if (direction !== 'up') {
					this.snake.newDirection = 'down';
				}
				break;
			case 'a':
			case 'arrowleft' :
				if (direction !== 'right') {
					this.snake.newDirection = 'left';
				}
				break;
			case 'd':
			case 'arrowright':
				if (direction !== 'left') {
					this.snake.newDirection = 'right';
				}
		}
	}
}

class Scoreboard {
	constructor() {
		this.highScore = new Array(5).fill(0);
		this.score = 0;
	}

	updateScore(s) {
		const scoreEl = document.getElementById("score");
		this.score += s;
		scoreEl.innerText = this.score;
	}

	updateHighScore() {
		const highScoreEl = document.getElementById("highScore");
		this.highScore[this.highScore.length] = this.score;
		this.highScore.sort((a, b) => a - b);
		this.highScore = this.highScore.slice(-5).reverse(); // get 5 highest scores

		let highScoreHTML = '<ol>';
		for (let s of this.highScore) {
			highScoreHTML += `<li>${s}</li>`;
		}
		highScoreHTML += '</ol>';
		highScoreEl.innerHTML = highScoreHTML;
	}
}

class Options {
	constructor() {
		this.labyrinth = parseInt(document.getElementById('labyrinth').value);
		this.speed = parseInt(document.getElementById('speed').value);
		this.powerupTime = parseInt(document.getElementById('powerupTime').value);
		this.powerupVal = parseInt(document.getElementById('powerupVal').value);
	}

	update(el) {
		this[el.name] = parseInt(el.value);
	}
}

// initial settings
const canvas = document.getElementById('snake');
const ctx = canvas.getContext('2d');
const width = 50;
const height = 30;
const block = 10;

canvas.width = width * block;
canvas.height = height * block;

const board = new Gameboard(width, height, block, ctx); // init board
const snake = new Snake(board); // add snake to board
const score = new Scoreboard();
const opt = new Options();
const game = new Game(board, snake, score, opt);

document.addEventListener('keydown', game.keyDown.bind(game));

// game.start();