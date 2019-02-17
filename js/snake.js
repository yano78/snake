class Gameboard {
	constructor() {
		this.width = width;
		this.height = height;
		this.block = block;
		this.ctx = ctx;
		this.bgColor = '#ccc';
		this.wallColor = '#000';
	}

	draw() {
		this.ctx.fillStyle = this.bgColor;
		this.ctx.fillRect(0, 0, this.width * this.block, this.height * this.block);
	}
}

class Snake {
	constructor(board) {
		this.board = board;
		this.ctx = board.ctx;
		this.block = board.block;
		this.body = [{x: 5, y: 5}];
		this.color = '#888';
		this.direction = 'right';
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
		this.ctx.fillStyle = "#ccc";
		this.ctx.fillRect(point.x * b, point.y * b, b, b);
	}

	move() {
		let nextHead = this.head;
		const w = this.board.width;
		const h = this.board.height;

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

		this.body.unshift(nextHead);
		this.erase(this.body.pop());

		this.draw();
	}

	collision(a, b) {
		return (a.x === b.x && a.y === b.y);
	}

}

class Game {
	constructor(board, snake) {
		this.board = board;
		this.snake = snake;
		this.food = null;
		this.score = 0;
		this.highScore = [];
	}

	async run() {
		this.board.draw();
		this.createFood();
		while (true) {
			this.snake.move();

			await this.wait(200);
		}
	}

	wait(time) {
		return new Promise(resolve => setTimeout(resolve, time));
	}

	createFood() {
		const w = this.board.width;
		const h = this.board.height;
		const b = this.board.block;
		const ctx = this.board.ctx;
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
					this.snake.direction = 'up';
				}
				break;
			case 's' :
			case 'arrowdown' :
				if (direction !== 'up') {
					this.snake.direction = 'down';
				}
				break;
			case 'a':
			case 'arrowleft' :
				if (direction !== 'right') {
					this.snake.direction = 'left';
				}
				break;
			case 'd':
			case 'arrowright':
				if (direction !== 'left') {
					this.snake.direction = 'right';
				}
		}
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
const game = new Game(board, snake);

document.addEventListener('keydown', game.keyDown.bind(game));

game.run();