import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function vec2(x, y) {
    return { x: x, y: y };
}

function vec3(x, y, z) {
    return { x: x, y: y, z: z };
}

function collision(player, ball)
{
    // console.log(player.top < ball.bottom + ball.posChange.x );
    return ( player.top >= ball.bottom && // Player's top is above ball's bottom
        player.bottom <= ball.top && // Player's bottom is below ball's top
        player.right >= ball.left && // Player's right is beyond ball's left
        player.left <= ball.right );
}

class Ball{
    constructor(game, pos, posChange, redius)
    {
        this.game = game
        this.pos = pos;
        this.speed2 = posChange;
        this.speed = posChange;
        this.posChange = {x : this.speed, z: this.speed};
        this.redius = redius;
        this.ball = new THREE.Mesh(new THREE.SphereGeometry(this.redius), new THREE.MeshBasicMaterial({color: 0xae0f22}));
        this.ball.position.set(this.pos.x, this.pos.y, this.pos.z);
    }
    restart()
    {
        this.pos.z = 0;
        this.pos.x = 0;
        this.posChange.z = (-(this.posChange.z / this.speed ) * this.speed2);
        this.posChange.x = (this.posChange.x / this.speed) * this.speed2;
        this.speed = this.speed2;
    }
    update()
    {
        if(this.pos.z - this.redius <= -5)
            this.restart();
        if(this.pos.z + this.redius >= 5)
            this.restart();
        if(this.pos.x + this.redius >= 2.5)
            this.posChange.x *= -1;
        if(this.pos.x - this.redius <= -2.5)
            this.posChange.x *= -1;
        this.pos.z += this.posChange.z;
        this.pos.x += this.posChange.x;
        this.top = this.pos.x + this.redius;
        this.bottom = this.pos.x - this.redius;
        this.left = this.pos.z - this.redius;
        this.right = this.pos.z + this.redius;
        this.ball.position.set(this.pos.x, this.pos.y, this.pos.z);
    }
    collisionHandle(player)
    {
        if(collision(player, this))
        {
            let hitPoint = (this.pos.x - player.pos.x) / player.padSize;
            let angleMove = hitPoint * Math.PI / 4;
            if(this.pos.z < 0)
                this.posChange.z = this.speed * Math.cos(angleMove);
            else if(this.pos.z > 0)
                this.posChange.z = -this.speed * Math.cos(angleMove);
            this.posChange.x = this.speed * Math.sin(angleMove);
            if(this.speed < 90)
            {
                this.speed += 0.01;
            }
        }
    }
}

class Pad {
    constructor(pos, posChange, paddleSize, color, keys) {
        this.pos = pos;
        this.posChange = posChange;
        this.paddleSize = paddleSize;
        this.padSize = this.paddleSize.x / 2 + this.paddleSize.y / 2;
        this.keys = keys;
        this.paddle = new THREE.Mesh(
            new THREE.CapsuleGeometry(this.paddleSize.y, this.paddleSize.x, 15, 25),
            new THREE.MeshBasicMaterial({ color: color })
        );
        this.paddle.position.set(this.pos.x, this.pos.y, this.pos.z);
        this.paddle.rotation.x = 0.5 * Math.PI;
        this.paddle.rotation.z = 0.5 * Math.PI;
        
        this.keyStates = {};
        window.addEventListener('keydown', (event) => {
            this.keyStates[event.key] = true;
        });
        window.addEventListener('keyup', (event) => {
            this.keyStates[event.key] = false;
        });
    }
    
    update() {
        if ((this.keyStates[this.keys.left[0]] || this.keyStates[this.keys.left[1]] ) && this.pos.x - this.padSize - this.posChange > -2.5) {
            this.pos.x -= this.posChange;
        }
        if ((this.keyStates[this.keys.right[0]] || this.keyStates[this.keys.right[1]] )&& this.pos.x + this.padSize  + this.posChange < 2.5) {
            this.pos.x += this.posChange;
        }
        this.top = this.pos.x + this.padSize
        this.bottom = this.pos.x - this.padSize;
        this.right = this.pos.z + this.paddleSize.y;
        this.left = this.pos.z - this.paddleSize.y;
        this.paddle.position.set(this.pos.x, this.pos.y, this.pos.z);
    }
}

class Game {
    constructor() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        this.controler = new OrbitControls(this.camera, this.renderer.domElement);
        this.gridHelper = new THREE.GridHelper(5);
        this.axeHelper = new THREE.AxesHelper(5);

        this.planet = new THREE.Mesh(
            new THREE.PlaneGeometry(5, 10),
            new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
        );
        this.planet.rotation.x = 0.5 * Math.PI;

        this.wall = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 10),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        this.wall.position.set(-2.75, 0.25, 0);

        this.wall2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 10),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        this.wall2.position.set(2.75, 0.25, 0);

        this.padd1 = new Pad(vec3(0, 0.25 / 2, 4.75 + 0.25/2), 0.1, vec2(0.7, 0.25 / 2), 0x0000ff, {
            left: ['A','a'],
            right: ['D','d'],
        });

        this.padd2 = new Pad(vec3(0, 0.25 / 2, -4.75 - 0.25 /2), 0.1, vec2(0.7, 0.25 / 2), 0x00ff00, {
            left: ['ArrowLeft'],
            right: ['ArrowRight'],
        });
        this.ball = new Ball(this, vec3(0,0.25 / 2,0), 0.07, 0.25 / 2);
        this.camera.position.set(1, 3, 5);
        this.controler.update();

        this.scene.add(
            this.gridHelper,
            this.axeHelper,
            this.planet,
            this.wall,
            this.wall2,
            this.padd1.paddle,
            this.padd2.paddle,
            this.ball.ball
        );

        window.addEventListener('resize', () => {
            this.resize(window.innerWidth, window.innerHeight);
        });
    }

    resize(width, height) {
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    update() {
        this.padd1.update();
        this.padd2.update();
        this.ball.collisionHandle(this.padd1);
        this.ball.collisionHandle(this.padd2);
        this.ball.update();
    }
}

window.addEventListener('load', function () {
    const game = new Game();

    function animation() {
        game.update();
        game.render();
        requestAnimationFrame(animation);
    }

    animation();
});
