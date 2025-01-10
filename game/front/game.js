const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');

var player = {
    x : window.innerWidth / 2,
    y : window.innerHeight / 2,
    height : 15,
    width : 15,
    speed: 15,
}

function vec2(x, y)
{
    return{x: x, y: y};
}

function Player(pos, posChange, playerSize, keys)
{
    this.pos = pos;
    this.posChange = posChange;
    this.playerSize = playerSize;
    this.keys = keys;
    this.playerUpdate = function()
    {
        if(this.keys['ArrowUp'] && this.pos.y - this.posChange > 0)
            {
            this.pos.y -= this.posChange;
        }
        if(this.keys['ArrowDown'] && this.pos.y + this.playerSize.y + this.posChange < canvas.height)
        {
            this.pos.y += this.posChange;
        }
        this.top = this.pos.y;
        this.bottom = this.pos.y + this.playerSize.y;
        this.right = this.pos.x + this.playerSize.x;
        this.left = this.pos.x;
    };
    this.playerDraw = function()
    {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 4;
        ctx.strokeRect(this.pos.x, this.pos.y, this.playerSize.x, this.playerSize.y);
    };
}
function Player2(pos, posChange, playerSize, keys)
{
    this.pos = pos;
    this.posChange = posChange;
    this.playerSize = playerSize;
    this.keys = keys;
    this.playerUpdate = function()
    {
        if((this.keys['W'] || this.keys['w']) && this.pos.y - this.posChange > 0)
        {
            this.pos.y -= this.posChange;
        }
        if((this.keys['S'] || this.keys['s']) && this.pos.y + this.playerSize.y + this.posChange < canvas.height)
        {
            this.pos.y += this.posChange;
        }
        this.top = this.pos.y;
        this.bottom = this.pos.y + this.playerSize.y;
        this.right = this.pos.x + this.playerSize.x;
        this.left = this.pos.x;
    };
    this.playerDraw = function()
    {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 4;
        ctx.strokeRect(this.pos.x, this.pos.y, this.playerSize.x, this.playerSize.y);
    };
}

function collision(player, ball)
{
    return (player.top < ball.bottom + ball.posChange.y && player.bottom > ball.top + ball.posChange.y && player.right > ball.left + ball.posChange.x &&  player.left < ball.right + ball.posChange.x) 
}
function Ball(pos, posChange, redius)
{
    this.pos = pos;
    this.speed = posChange;
    this.posChange = {x : this.speed , y:this.speed};
    this.redius = redius;
    this.gameUpdate = function()
    {
        if(this.pos.x - this.redius <= 0)
        { 
            console.log(this.posChange.x);
            this.restart()
        }
        if(this.pos.x + this.redius >= window.innerWidth)
        {
            console.log(this.posChange.x);
            this.restart()
        }
        if(this.pos.y + this.redius >= window.innerHeight)
            this.posChange.y *= -1;
        if(this.pos.y - this.redius <= 0)
            this.posChange.y *= -1;
        this.pos.x += this.posChange.x;
        this.pos.y += this.posChange.y;
        this.top = this.pos.y - this.redius;
        this.bottom = this.pos.y + this.redius;
        this.left = this.pos.x - this.redius;
        this.right = this.pos.x + this.redius;
    };
    this.collisionHandle = function(player)
    {
        if(collision(player, this))
        {
            let hitPoint = (this.pos.y - (player.pos.y + player.playerSize.y / 2));
            hitPoint = hitPoint / player.playerSize.y / 2;
            let angleMove = hitPoint * Math.PI;
            if(this.pos.x < canvas.width / 2)
                this.posChange.x = this.speed * Math.cos(angleMove);
            else if(this.pos.x > canvas.width / 2)
                this.posChange.x = -this.speed * Math.cos(angleMove);
            console.log(player.playerSize.x - player.pos.x);
            console.log(this.pos.x);
            this.posChange.y = this.speed * Math.sin(angleMove);
            if(this.speed < 90)
            {
                this.speed += 0.5;
            }
        }
    }
    this.gameDraw = function()
    {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.redius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();
    };
    this.restart = function()
    {
        this.pos.x = player.x;
        this.pos.y = player.y ;
        // console.log(this.posChange.x);
        this.posChange.x = (-(this.posChange.x / this.speed ) * posChange);
        this.posChange.y = (this.posChange.y / this.speed) * posChange;
        this.speed = posChange;
        // player2.pos.y = canvas.height / 2 - player2.playerSize.y / 2;
        // player3.pos.y = canvas.height / 2 - player3.playerSize.y / 2;
    }
    
}



function gameUpdate() {
    player2.playerUpdate();
    player3.playerUpdate();
    
    ball.collisionHandle(player2);
    ball.collisionHandle(player3);
    ball.gameUpdate(player2);
    // console.log(player2.top);
    
}
var keys = {};
document.addEventListener('keydown', (event) => keys[event.key] = true);
document.addEventListener('keyup', (event) => keys[event.key] = false);
const ball = new Ball(vec2(player.x, player.y), 10, 20);
const player2 = new Player(vec2(5, canvas.height / 2 - 100), 20, vec2(50, 200), keys);
const player3 = new Player2(vec2(canvas.width - 50 - 5, canvas.height / 2 - 100), 20, vec2(50, 200), keys);

function gameDraw() {
    ctx.fillStyle = 'BLACK'
    ctx.fillRect(0, 0, canvas.width, canvas.height, );
    player2.playerDraw();
    player3.playerDraw();
    ball.gameDraw();
}

function gameLoop() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    requestAnimationFrame(gameLoop);
    gameUpdate();
    gameDraw();
}


window.addEventListener('load', function()
{
    gameLoop();
})
// ctx.stroke();
