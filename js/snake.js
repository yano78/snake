class Gameboard {
	constructor() {
		this.width = width;
		this.height = height;
		this.block = block;
		this.ctx = ctx;
		this.wallColor = '#000';
	}

	draw() {
		ctx.clearRect(0, 0, this.width * this.block, this.height * this.block);
	}
}

class Snake {
	constructor(board) {
		this.board = board;
		this.ctx = board.ctx;
		this.block = board.block;
		this.body = [{x: 5, y: 5}];
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

		nextHead.x = ((nextHead.x % w) + w) % w;
		nextHead.y = ((nextHead.y % h) + h) % h;

		// add new segment each time snake eats food
		if (this.grow > 0) {
			this.grow--;
		} else {
			this.erase(this.body.pop());
		}

		// check if snake bite itself
		for (let b of this.body) {
			if (this.collision(nextHead, b)) {
				this.alive = false;
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
		this.score = score;
		this.highScore = [];
		this.options = options;
	}

	start() {
		this.board.draw();
		this.snake.alive = true;
		this.score.score = 0;
		this.score.updateScore(0);
		this.score.updateHighScore();
		this.food = null;
		this.snake.body = [{x: 5, y: 5}];
		this.snake.direction = 'right';
		this.createFood();
		this.run();
	}

	async run() {
		const gameover = document.getElementById("gameover");

		gameover.classList.add("hidden");

		let speed;

		while (true) {
			this.snake.move();

			speed = parseInt(this.options.speed);

			// is snake still alive?
			if (!this.snake.alive) {
				break;
			}

			if (this.food) {
				if (this.snake.collision(this.snake.head, this.food)) {
					this.snake.grow++;
					this.score.updateScore(speed);
					this.food = null;
					this.createFood();
				}
			}

			await this.wait(200 - (speed - 1) * 50);
		}

		gameover.classList.remove("hidden");
		this.score.updateHighScore();
	}

	wait(time) {
		return new Promise(resolve => setTimeout(resolve, time));
	}

	createFood() {
		const w = this.board.width;
		const h = this.board.height;
		const color = '#0f0';

		if (!this.food) {

			let foodCollideFlag = true;

			// avoid creating food on snakes body
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

			}
			this.drawFood(this.food, color);
		}
	}

	drawFood(food, color) {
		const b = this.board.block;
		const ctx = this.board.ctx;

		ctx.fillStyle = color;
		ctx.fillRect(this.food.x * b, this.food.y * b, b, b);
	}

	keyDown(event) {
		const direction = this.snake.direction;
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
		this.highScore = this.highScore.slice(-5).reverse();

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
		this.labyrinth = document.getElementById('labyrinth').value;
		this.speed = document.getElementById('speed').value;
	}

	update(el){
		console.log(el);
		this[el.name] = el.value;
	}
}

const canvas = document.getElementById('snake');
const ctx = canvas.getContext('2d');
const width = 30;
const height = 20;
const block = 14;

canvas.width = width * block;
canvas.height = height * block;

const board = new Gameboard(width, height, block, ctx);
const snake = new Snake(board);
const score = new Scoreboard();
const opt = new Options();
const game = new Game(board, snake, score, opt);

document.addEventListener('keydown', game.keyDown.bind(game));

game.start();