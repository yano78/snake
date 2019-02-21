class Gameboard {
	constructor() {
		this.width = width;
		this.height = height;
		this.block = block;
		this.ctx = ctx;
		this.wallColor = '#555';
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
		this.walls = [];
		// powerups modifiers
		this.speedM = 0;
		this.pointsM = 1;
		this.noclip = false;

		this.powerup = null; // {isActive: true, x: 1, y: 1, type: 'cut'}
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

		// draw walls and add walls element to array for collision check
		for (let w of l) {
			// w.x1, w.y1 are starting points
			// w.x2 is the width of the wall
			// w.y2 is the height of the wall
			this.ctx.fillRect(w.x1 * b, w.y1 * b, w.x2 * b, w.y2 * b);
			for (let a = w.x1; a < w.x1 + w.x2; a++) {
				for (let b = w.y1; b < w.y1 + w.y2; b++) {
					this.walls.push({x: a, y: b});
				}
			}
		}
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

		// add new segment each time snake eats food
		if (this.grow > 0) {
			this.grow--;
		} else if (this.grow < 0) {
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
			if (this.collision(nextHead, b)) {
				this.alive = false;
				return;
			}
		}

		// check if snake hits the wall
		if (this.board.walls.length !== 0 && !this.board.noclip) {
			for (let w of this.board.walls) {
				if (this.collision(nextHead, w)) {
					this.alive = false;
					return;
				}
			}
		}

		this.body.unshift(nextHead);

		this.draw();
	}

	collision(a, b) {
		return (a.x === b.x && a.y === b.y);
	}
}

class Game {
	constructor(board, snake, score, options) {
		this.board = board;
		this.snake = snake;
		this.food = null;
		this.flag = 0; // powerups flag
		this.score = score;
		this.options = options;
		this.powerups = [
			{type: 'cut', label: '-'},
			{type: 'extend', label: '+'},
			{type: 'faster', label: '>'},
			{type: 'slower', label: '<'},
			{type: 'multiply', label: '*'},
			{type: 'noclip', label: '|'}
		];
	}

	start() {
		// clear the board, set defaults and options
		this.board.clear();
		this.board.drawWalls(this.options.labyrinth);
		this.snake.alive = true;
		this.score.score = 0;
		this.score.updateScore(0);
		this.score.updateHighScore();
		this.food = null;
		this.snake.body = [{x: 5, y: 5}, {x: 4, y: 5}];
		this.snake.direction = 'right';
		this.createFood();
		this.board.ctx.canvas.focus();
		this.run();
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
			this.board.drawWalls(level);
			this.snake.move();

			// is snake still alive?
			if (!this.snake.alive) {
				break;
			}

			console.log('speed: %i; M: %i; points: %i; M: %i', speed, this.board.speedM, points, this.board.pointsM);

			// check if snake eaten food
			if (this.food) {
				if (this.snake.collision(this.snake.head, this.food)) {
					this.snake.grow++;
					this.score.updateScore(points * this.board.pointsM);
					this.flag++;
					this.food = null;
					this.createFood();

					if (this.flag === 1) {
						this.createPowerup();
						this.flag = 0;
					}
				}
			}

			// check if snake eaten powerup
			if (this.board.powerup && !this.board.powerup.isActive) {
				if (this.snake.collision(this.snake.head, this.board.powerup)) {
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
							break;
						case 'slower':
							this.board.speedM = -powerupVal;
							break;
						case 'multiply':
							this.board.pointsM = powerupVal;
							break;
						case 'noclip':
							this.board.noclip = true;
							break;
					}
					this.wait(powerupTime * 1000).then(() => this.resetPowerups());
					this.setTimer(powerupTime);
				}
			}

			await this.wait(200 - ((speed - 1) * 50) - (this.board.speedM * 10));
		}

		gameoverEl.classList.remove('hidden');
		this.score.updateHighScore();
	}

	wait(time) {
		return new Promise(resolve => setTimeout(resolve, time));
	}

	setTimer(time) {
		const timerEl = document.getElementById('timer');
		timerEl.innerText = time--;
		const timer = setInterval(function(){
			if (time <= 0) {
				clearInterval(timer);
			}
			timerEl.innerText = time--;
		}, 1000);
	}

	resetPowerups() {
		console.log("REsET");
		this.board.powerup = null;
		this.board.speedM = 0;
		this.board.pointsM = 1;
		this.board.noclip = false;
	}

	createFood() {
		const w = this.board.width;
		const h = this.board.height;
		const color = '#0f0';

		if (!this.food) {

			let foodCollideFlag = true;

			// avoid creating food on snakes body or walls
			while (foodCollideFlag) {
				foodCollideFlag = false;
				const x = Math.floor(Math.random() * w);
				const y = Math.floor(Math.random() * h);
				this.food = {x, y};

				for (let s of this.snake.body) {
					if (this.snake.collision(s, this.food)) {
						foodCollideFlag = true;
					}
				}

				for (let w of this.board.walls) {
					if (this.snake.collision(w, this.food)) {
						foodCollideFlag = true;
					}
				}
			}

			this.drawFood(this.food, color);
		}
	}

	drawFood(food, color) {
		const b = this.board.block;
		const ctx = this.board.ctx;

		ctx.fillStyle = color;
		ctx.fillRect(food.x * b, food.y * b, b, b);
		if (food.label) {
			ctx.fillStyle = '#fff';
			ctx.font = this.board.block + 'px VT323';
			ctx.fillText(food.label, food.x * b + (b / 4), food.y * b + (b / 1.3));
		}
	}

	createPowerup() {
		const w = this.board.width;
		const h = this.board.height;
		let powerup = {};

		if (!this.board.powerup) {

			let collideFlag = true;

			while (collideFlag) {
				collideFlag = false;
				const x = Math.floor(Math.random() * w);
				const y = Math.floor(Math.random() * h);
				const t = Math.floor(Math.random() * this.powerups.length);
				powerup = {x: x, y: y, ...this.powerups[t]};

				for (let s of this.snake.body) {
					if (this.snake.collision(s, powerup)) {
						collideFlag = true;
					}
				}

				for (let w of this.board.walls) {
					if (this.snake.collision(w, powerup)) {
						collideFlag = true;
					}
				}
			}
			this.board.powerup = {isActive: false, ...powerup};
			this.drawFood(powerup, '#f00');
			console.log(powerup);
		}
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
		const scoreElem = document.getElementById("score");
		this.score += s;
		scoreElem.innerText = this.score;
	}

	updateHighScore() {
		const highScoreElem = document.getElementById("highScore");
		this.highScore[this.highScore.length] = this.score;
		this.highScore.sort((a, b) => a - b);
		this.highScore = this.highScore.slice(-5).reverse(); // get 5 highest scores

		let highScoreHTML = '<ol>';
		for (let s of this.highScore) {
			highScoreHTML += `<li>${s}</li>`;
		}
		highScoreHTML += '</ol>';
		highScoreElem.innerHTML = highScoreHTML;
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