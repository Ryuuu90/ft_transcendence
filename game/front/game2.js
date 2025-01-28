import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const API_URL = 'http://localhost:8000/game';

var url_player = `ws://localhost:8000/ws/player/`
var url_ball = `ws://localhost:8000/ws/ball/`



function vec2(x, y) {
    return { x: x, y: y };
}

function vec3(x, y, z) {
    return { x: x, y: y, z: z };
}
    
class Ball{
    constructor(game, pos, posChange, redius)
    {
        this.socket = new WebSocket(url_ball)

        this.socket.onopen = function() 
        {
            console.log("BallSocket connection established");
        };
        this.game = game
        this.pos = pos;
        this.speed2 = posChange;
        this.speed = posChange;
        this.posChange = {x : this.speed, z: this.speed};
        this.redius = redius;
        this.ball = new THREE.Mesh(new THREE.SphereGeometry(this.redius), new THREE.MeshBasicMaterial({color: 0xae0f22}));
        this.ball.position.set(this.pos.x, this.pos.y, this.pos.z);
        this.socket.onmessage = (e) => {
            let data = JSON.parse(e.data);
            if(data.type == 'update')
            {
                this.pos.x = data.ball_data.x;
                this.posChange.x = data.ball_data.posChangeX;
                this.pos.z = data.ball_data.z;
            }
            if(data.type == 'collision')
            {
                this.posChange.x = data.ball_data.posChangeX
                this.posChange.z = data.ball_data.posChangeZ
                this.speed = data.ball_data.speed
            }
        }
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
        if(this.socket.readyState === WebSocket.OPEN )
        {
            this.socket.send(JSON.stringify({
                x : this.pos.x,
                y : this.pos.y,
                z : this.pos.z,
                speed : this.speed,
                speed2 : this.speed2,
                posChangeX : this.posChange.x,
                posChangeZ : this.posChange.z,
                redius : this.redius
            }))
        }
        this.ball.position.set(this.pos.x, this.pos.y, this.pos.z);
    }
}
        
    //     async function fetchData(playerData) {
    //         try {
    //     const response = await fetch(`${API_URL}/startGame/`, {
    //         method: 'POST',
    //         headers: {'Content-Type': 'application/json'},
    //         body: JSON.stringify(playerData)
    //     });
        
    //     const data = await response.json();  // Get the JSON response
    //     return data;  // Return the data to the calling function
    // } catch (error) {
    //     console.error('Error fetching data:', error);
    // }
// }
class Pad {
    constructor(name ,pos, posChange, paddleSize, color, keys) {
        this.socket = new WebSocket(url_player)

        this.socket.onopen = function() {
        console.log("WebSocket connection established");
        };
        this.name = name
        this.pos = pos;
        this.posChange = posChange;
        this.paddleSize = paddleSize;
        this.padSize = this.paddleSize.x / 2 + this.paddleSize.y / 2 ;
        this.keys = keys;
        this.paddle = new THREE.Mesh(
            new THREE.CapsuleGeometry(this.paddleSize.y, this.paddleSize.x, 15, 25),
            new THREE.MeshBasicMaterial({ color: color })
        );
        this.paddle.position.set(this.pos.x, this.pos.y, this.pos.z);
        this.paddle.rotation.x = 0.5 * Math.PI;
        this.paddle.rotation.z = 0.5 * Math.PI;
        
        this.keyStates = {}
        window.addEventListener('keydown', (event) => {
            this.keyStates[event.key] = true;
        });
        window.addEventListener('keyup', (event) => {
            this.keyStates[event.key] = false;
        });
        this.socket.onmessage = (e) => {
            let data = JSON.parse(e.data);
            if(data.player_data.x)
                this.pos.x = data.player_data.x;
        };
    }
    
    update() {

        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({name : this.name,
                x : this.pos.x,
                y : this.pos.y,
                z : this.pos.z,
                speed : this.posChange,
                downKey : (this.keyStates[this.keys.left[0]] || this.keyStates[this.keys.left[1]]) ,
                upKey : (this.keyStates[this.keys.right[0]] || this.keyStates[this.keys.right[1]]),
                padSize : this.padSize,
                padSizeY : this.paddleSize.y
            }));
        }
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

        this.padd1 = new Pad("player1", vec3(0, 0.25 / 2, 4.75 + 0.25/2), 0.1, vec2(0.7, 0.25 / 2), 0x0000ff, {
            left: ['A','a'],
            right: ['D','d'],
        });

        this.padd2 = new Pad("player2", vec3(0, 0.25 / 2, -4.75 - 0.25 /2), 0.1, vec2(0.7, 0.25 / 2), 0x00ff00, {
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
