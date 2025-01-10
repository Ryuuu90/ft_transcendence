function vec2(x, y)
{
    return{x: x, y: y};
}


function collision(player, ball)
{
    return (player.top < ball.bottom + ball.posChange.y && player.bottom > ball.top + ball.posChange.y && player.right > ball.left + ball.posChange.x &&  player.left < ball.right + ball.posChange.x) 
}
class Paddle{
    constructor(game, pos, posChange, paddleSize)
    {
        this.game = game;
        this.pos = pos;
        this.posChange = posChange;
        this.paddleSize = paddleSize;
        this.keys = {};
        window.addEventListener('keydown', (event) => {this.keys[event.key] = true});
        window.addEventListener('keyup', (event) => {this.keys[event.key] = false});
    }
    draw()
    {
        this.game.ctx.strokeStyle = 'red';
        this.game.ctx.lineWidth = 4;
        this.game.ctx.strokeRect(this.pos.x, this.pos.y, this.paddleSize.x, this.paddleSize.y);
    }
}

class Ai extends Paddle{
    constructor(game, pos, posChange, paddleSize)
    {
        super(game, pos, posChange, paddleSize)
    }
    update(ball)
    {
        var v;
        if(this.game.width > this.game.height)
        {
            v = this.game.width / this.game.height
            this.posChange = (Math.abs((this.pos.y + this.paddleSize.y / 2) - ball.pos.y) * v/ (Math.abs(this.pos.x - ball.pos.x) / ball.posChange.x)); 
        }
        else
        {
            v = this.game.height / this.game.width;
            this.posChange =  (Math.abs((this.pos.y + this.paddleSize.y / 2) - ball.pos.y) * v/ (Math.abs(this.pos.x - ball.pos.x ) / ball.posChange.x)); 
        }
        const maxSpeed = 90;
        this.posChange = Math.min(Math.abs(this.posChange), maxSpeed);
        if(ball.pos.y < this.pos.y || ball.pos.y > this.pos.y + this.paddleSize.y)
        {
            console.log(this.posChange);
            if(this.pos.y + this.paddleSize.y / 2 > ball.pos.y  && this.pos.y > ball.pos.y && this.pos  && this.pos.y - this.posChange > 0)
                this.pos.y -= this.posChange;
            else if(this.pos.y + this.paddleSize.y / 2 < ball.pos.y && this.pos.y + this.paddleSize.y < ball.pos.y && this.pos.y + this.paddleSize.y + this.posChange < this.game.canvas.height)
                this.pos.y += this.posChange;
        }
        this.top = this.pos.y;
        this.bottom = this.pos.y + this.paddleSize.y;
        this.right = this.pos.x + this.paddleSize.x;
        this.left = this.pos.x;
    }
}

class Ball{
    constructor(game, pos, posChange, redius)
    {
        this.game = game;
        this.pos = pos;
        this.speed2 = posChange;
        this.speed = posChange;
        this.posChange = {x : this.speed , y:this.speed};
        this.redius = redius;
    }
    draw()
    {
        this.game.ctx.beginPath();
        this.game.ctx.arc(this.pos.x, this.pos.y, this.redius, 0, Math.PI * 2);
        this.game.ctx.stroke();
        this.game.ctx.closePath();
    }
    restart()
    {
        this.pos.x = this.game.width  / 2;
        this.pos.y = this.game.height / 2;
        // console.log(this.posChange.x);
        this.posChange.x = (-(this.posChange.x / this.speed ) * this.speed2);
        this.posChange.y = (this.posChange.y / this.speed) * this.speed2;
        this.speed = this.speed2;
    }
    update()
    {
        if(this.pos.x - this.redius <= 0)
        { 
            console.log(this.posChange.x);
            this.restart()
        }
        if(this.pos.x + this.redius >= this.game.width)
        {
            console.log(this.posChange.x);
            this.restart()
        }
        if(this.pos.y + this.redius >= this.game.height)
            this.posChange.y *= -1;
        if(this.pos.y - this.redius <= 0)
            this.posChange.y *= -1;
        this.pos.x += this.posChange.x;
        this.pos.y += this.posChange.y;
        this.top = this.pos.y - this.redius;
        this.bottom = this.pos.y + this.redius;
        this.left = this.pos.x - this.redius;
        this.right = this.pos.x + this.redius;
    }
    collisionHandle(player)
    {
        if(collision(player, this))
        {
            let hitPoint = (this.pos.y - (player.pos.y + player.paddleSize.y / 2));
            hitPoint = hitPoint / player.paddleSize.y / 2;
            let angleMove = hitPoint * Math.PI;
            if(this.pos.x < canvas.width / 2)
                this.posChange.x = this.speed * Math.cos(angleMove);
            else if(this.pos.x > canvas.width / 2)
                this.posChange.x = -this.speed * Math.cos(angleMove);
            this.posChange.y = this.speed * Math.sin(angleMove);
            if(this.speed < 90)
            {
                this.speed += 15;
            }
        }
    }
}

class player1 extends Paddle {
    constructor(game, pos, posChange, paddleSize, keys)
    {
        super(game, pos, posChange, paddleSize,keys);
    }
    update()
    {
        if((this.keys['W'] || this.keys['w']) && this.pos.y - this.posChange > 0)
        {
            this.pos.y -= this.posChange;
        }
        if((this.keys['S'] || this.keys['s']) && this.pos.y + this.paddleSize.y + this.posChange < this.game.canvas.height)
        {
            this.pos.y += this.posChange;
        }
        this.top = this.pos.y;
        this.bottom = this.pos.y + this.paddleSize.y;
        this.right = this.pos.x + this.paddleSize.x;
        this.left = this.pos.x;
    }
}

class player2 extends Paddle {
    constructor(game, pos, posChange, paddleSize, keys)
    {
        super(game, pos, posChange, paddleSize,keys);
        console.log(this.keys);
    }
    update()
    {
        if((this.keys['ArrowUp']) && this.pos.y - this.posChange > 0)
        {
            this.pos.y -= this.posChange;
        }
        if((this.keys['ArrowDown']) && this.pos.y + this.paddleSize.y + this.posChange < this.game.height)
        {
            this.pos.y += this.posChange;
        }
        this.top = this.pos.y;
        this.bottom = this.pos.y + this.paddleSize.y;
        this.right = this.pos.x + this.paddleSize.x;
        this.left = this.pos.x;
    }
}

class Game{
    constructor(canvas, context)
    {
        this.canvas = canvas;
        this.ctx = context;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.paddle1 = new player1(this, vec2(5, this.height / 2 - 100), 40, vec2(50, 200));
        this.paddle2 = new Ai(this, vec2(this.width - 50 - 5, this.height / 2 - 100), 20, vec2(50, 200));
        this.ball = new Ball(this, vec2(this.width / 2, this.height / 2), 15, 20);
        window.addEventListener('resize', (e) => {
            this.resize(e.currentTarget.innerWidth, e.currentTarget.innerHeight);
        });
        
    }
    resize(width, height)
    {
        this.canvas.width = Math.floor(width);
        this.canvas.height = Math.floor(height);
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.paddle1 = new player1(this, vec2(5, this.height / 2 - 100), 20, vec2(50, 200));
        this.paddle2 = new Ai(this, vec2(this.width - 50 - 5, this.height / 2 - 100), 20, vec2(50, 200));
    }
    render()
    {
        this.ctx.fillStyle = 'BLACK';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.paddle1.draw();
        this.paddle2.draw();
        this.ball.draw();
    }
    update()
    {
        this.paddle1.update(this.ball);
        this.paddle2.update(this.ball);
        this.ball.collisionHandle(this.paddle1);
        this.ball.collisionHandle(this.paddle2);
        this.ball.update();
    }
}

window.addEventListener('load', function()
{
    const canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const game = new Game(canvas, ctx);
    function animate(){
        game.render();
        game.update();
        requestAnimationFrame(animate);
    }
    animate();
});