import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const API_URL = 'http://localhost:8000/game';

// var url_player = `ws://localhost:8000/ws/player/`
// var url_ball = `ws://localhost:8000/ws/ball/`
var url_game = `ws://localhost:8000/ws/game/`




function vec2(x, y) {
    return { x: x, y: y };
}

function vec3(x, y, z) {
    return { x: x, y: y, z: z };
}
    
class Ball{
    constructor(pos, posChange, redius, game_id)
    {
        var url_ball = `ws://localhost:8000/ws/ball/${game_id}/`
        this.socket = new WebSocket(url_ball)

        this.socket.onopen = function() 
        {
            console.log("BallSocket connection established");
        };
        this.pos = pos;
        this.speed2 = posChange;
        this.speed = posChange;
        this.posChange = {x : this.speed, z: this.speed};
        this.redius = redius;
        this.ball = new THREE.Mesh(new THREE.SphereGeometry(this.redius), new THREE.MeshBasicMaterial({color: 0xae0f22}));
        this.ball.position.set(this.pos.x, this.pos.y, this.pos.z);
        this.socket.onmessage = (e) => {
            // console.log('hi');
            let data = JSON.parse(e.data);
            // var ball_data = Object.values(data.ball_data).find(p => p.id === this.id);
            // console.log(this.id)
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
            if(data.type == 'restart')
            {
                
                this.posChange.x = data.ball_data.x;
                this.posChange.z = data.ball_data.z;
                this.posChange.x = data.ball_data.posChangeX;
                this.posChange.z = data.ball_data.posChangeZ;
                this.speed = data.ball_data.speed;
                
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
        // console.log(this.socket.readyState === WebSocket.OPEN)

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
        
async function fetchData() {
    try {
        const response = await fetch(`${API_URL}/startGame/`, {
            method: 'GET',
            // headers: {'Content-Type': 'application/json'},
            // body: JSON.stringify(playerData)
        });
        
        const data = await response.json();  // Get the JSON response
        return data;  // Return the data to the calling function
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
class onlinePad{
    constructor(name ,pos, posChange, paddleSize, color, socket) {
        this.name = name
        // this.socket = socket;
        this.pos = pos;
        this.posChange = posChange;
        this.paddleSize = paddleSize;
        this.padSize = this.paddleSize.x / 2 + this.paddleSize.y / 2 ;
        this.paddle = new THREE.Mesh(
            new THREE.CapsuleGeometry(this.paddleSize.y, this.paddleSize.x, 15, 25),
            new THREE.MeshBasicMaterial({ color: color })
        );
        this.paddle.position.set(this.pos.x, this.pos.y, this.pos.z);
        this.paddle.rotation.x = 0.5 * Math.PI;
        this.paddle.rotation.z = 0.5 * Math.PI;
        // this.socket.onmessage = (e) => {
        //     let data = JSON.parse(e.data);
        //     console.log(data.players.player1);
        //     // if(this.name == 'player2')
        //     //     var player = Object.values(data.players).find(p => p.name === "player2");
        //     // // console.log(player);
        //     // if(player.x)
        //     //     this.pos.x = player.x;
        //     // if(mode == 'online')
        // };
    };
        

    update() {
        
        this.paddle.position.set(this.pos.x, this.pos.y, this.pos.z);
    }
}
class Pad {
    constructor(name ,pos, posChange, paddleSize, color, keys, game_id) {
        // console.log(keys)
        var url_player = `ws://localhost:8000/ws/player/${game_id}/`
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
            // if(this.name == 'player1')
            // var player = Object.values(data.players).find(p => p.name === this.name);
            // else if(this.name == 'player2')
            //     var player = Object.values(data.players).find(p => p.name === "player2");
            // console.log(data);
            // if(player.x)
            this.pos.x = data.players.x;
            // console.log(data.players)
            // if(mode == 'online')
        };
    }
    
    update() {
        // console.log(this.socket.readyState === WebSocket.OPEN)
        if (this.socket.readyState === WebSocket.OPEN) {
            // console.log();
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
// var isOnline = 0;

class Game {
    constructor(mode) {
        this.socket = new WebSocket(url_game);
        this.socket.onopen = function(){
            console.log("gameWebSocket connection established");
        }
        this.ready = false;
        this.socket.onmessage = (e) => {
            if (this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify("success"));
            }
            let data = JSON.parse(e.data);
            this.game_id = data.id
            this.players = data.game.players;
            this.ballData = data.game.ball;
            if( mode == 'local')
            {
                this.startLocalGame();
                this.ready = true;
            }
            if(mode == 'online')
            {
                this.startOnlineGame();
                this.ready = true;
            };
        }
    }
    startLocalGame(){
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

        this.padd1 = new Pad(this.players.player1.name, vec3(this.players.player1.x, this.players.player1.y, this.players.player1.z), 0.1, vec2(this.players.player1.paddleSizeX, this.players.player1.paddleSizeY), 0x0000ff, this.players.player1.keys, this.game_id);

        this.padd2 = new Pad(this.players.player2.name, vec3(this.players.player2.x, this.players.player2.y, this.players.player2.z), 0.1, vec2(this.players.player2.paddleSizeX, this.players.player2.paddleSizeY), 0x00ff00, this.players.player2.keys, this.game_id);
        this.ball = new Ball( vec3(this.ballData.x,this.ballData.y,this.ballData.z), this.ballData.posChange, this.ballData.redius, this.game_id);
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
    startOnlineGame(){
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

        this.padd1 = new Pad(this.players.player1.name, vec3(this.players.player1.x, this.players.player1.y, this.players.player1.z), 0.1, vec2(this.players.player1.paddleSizeX, this.players.player1.paddleSizeY), 0x0000ff, this.players.player1.keys,this.game_id);

        this.padd2 = new onlinePad(this.players.player2.name, vec3(this.players.player2.x, this.players.player2.y, this.players.player2.z), 0.1, vec2(this.players.player2.paddleSizeX, this.players.player2.paddleSizeY), 0x00ff00, this.padd1.socket);
        this.ball = new Ball(vec3(this.ballData.x,this.ballData.y,this.ballData.z), this.ballData.posChange, this.ballData.redius, this.game_id);
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
        if (!this.ready) return;
        this.renderer.render(this.scene, this.camera);
    }

    update() {
        if (!this.ready) return;
        this.padd1.update();
        this.padd2.update();
        this.ball.update();
    }
}

window.addEventListener('load', function () {
    // const game = new Game();
    const localButton = document.createElement("button");
    localButton.textContent = "Play Local";
    localButton.onclick = () => {
        document.body.removeChild(localButton);
        document.body.removeChild(onlineButton);
        const game = new Game('local');
        function animation() {
            game.update();
            game.render();
            requestAnimationFrame(animation);
        }
        animation();
    }

    const onlineButton = document.createElement("button");
    onlineButton.textContent = "Play Online";
    onlineButton.onclick = () => {
        document.body.removeChild(localButton);
        document.body.removeChild(onlineButton);
        const game = new Game('online');
        function animation() {
            game.update();
            game.render();
            requestAnimationFrame(animation);
        }
        animation();
    }
    document.body.appendChild(localButton);
    document.body.appendChild(onlineButton);
});
