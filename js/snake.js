class Gameboard {
	constructor () {
		this.width = width;
		this.height = height;
		this.block = block;
		this.ctx = ctx;
		this.bgColor = '#ccc';
		this.wallColor = '#000';
	}

	draw(){
		this.ctx.fillStyle = this.bgColor;
		this.ctx.fillRect(0, 0, this.width * this.block, this.height * this.block);
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

board.draw();