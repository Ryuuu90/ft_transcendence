from channels.generic.websocket import AsyncWebsocketConsumer
import json
import math
import uuid
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
import asyncio

class gameConsumer(AsyncWebsocketConsumer):
    games = {}
    gameInit = {}
    player_id = 0
    ball_id = 0
    game = {
        'players': {},
        'ball': {}
    }
    async def connect(self):
        await self.accept()
        game = {
            'players' : {'player1': {'name' : str(uuid.uuid4()), 'x' : '0', 'y' : '0.125', 'z' : '4.875', 'paddleSizeX' : '0.7', 'paddleSizeY' : '0.125', 'keys' : {'left' : ['A', 'a'], 'right' : ['D', 'd'] }, 'status' : 'offline' }, 'player2' :{'name' : str(uuid.uuid4()), 'x' : '0', 'y' : '0.125', 'z' : '-4.875', 'paddleSizeX' : '0.7', 'paddleSizeY' : '0.125', 'keys' : {'left' : ['ArrowLeft'], 'right' : ['ArrowRight'] }, 'status':'offline' }},
            'ball' : {'id' : str(uuid.uuid4()),'x' : '0', 'y' : '0.125', 'z' : '0', 'posChange' : '0.07', 'redius' : '0.125'}
        }
        self.game_id = str(uuid.uuid4()) if len(self.game['players']) % 2 == 0 else list(self.games.keys())[-1]
        self.games[self.game_id] = self.game
        self.gameChannel = get_channel_layer()
        # await self.gameChannel.group_add(
        #     "game_init",
        #     self.channel_name
        # )
        await self.gameChannel.group_add(
            f"game_group_{self.game_id}",
            self.channel_name
        )
        await self.send(text_data=json.dumps({
            'type': 'init',
            'game': game,
            'id': self.game_id  # Send data of all other players
        }))
    async def receive(self, text_data):
        if not text_data:
            print("empty data")
            return
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            print(f"Invalid JSON received: {text_data}")
            return
        # await self.gameChannel.group_send(
        #     "game_init",
        #     {
        #         "type": "game_data",
        #         "game_data": self.games[self.channel_name],
        #         "id": self.channel_name
        #     }
        # )
    async def game_data(self, event):
        game = event['game_data']
        # await self.send(text_data=json.dumps({
        #     'type': 'init',
        #     'players': game  # Send data of all other players
        # }))
    async def player_data(self, event):
        player_data = event['player_data']
        # print()
        # player_id = event['id']
        if len(player_data) == 2:
            self.game['players'] = player_data
    async def ball_data(self, event):
        ball = event['ball_data']
        id = event['id']
        # print(bool(ball))
        if bool(ball) :
            self.game['ball'] = ball
        if self.game['ball'] and len(self.game['players']) == 2:
            self.games[self.game_id] = self.game
            await self.gameChannel.group_send(
                f"game_group_{self.game_id}",
                {
                    "type": "game_data",
                    "game_data": self.games,
                    "id": self.channel_name,
                }
            )

    async def disconnect(self, close_code):
        self.close()
        print(f"GameWebSocket disconnected.")

startgame = False
class playerConsumer(AsyncWebsocketConsumer):
    players = {}
    async def connect(self):
        await self.accept()
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        print(f"Game ID: {self.game_id}")
        self.gameChannel = get_channel_layer()
        await self.gameChannel.group_add(
            f"game_group_{self.game_id}",
            self.channel_name
        )
    
    async def receive(self, text_data):
        if not text_data:
            print("empty data")
            return
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            print(f"Invalid JSON received: {text_data}")
            return
        
        self.players[self.channel_name] = {
            'name': data.get('name'),
            'x': float(data.get('x', 0)),  # Default to 0 if not present
            'y': float(data.get('y', 0)),
            'z': float(data.get('z', 0)),
            'speed': float(data.get('speed', 0)),
            'upKey': data.get('upKey', False),
            'downKey': data.get('downKey', False),
            'padSize': float(data.get('padSize', 0)),
            'padSizeY': float(data.get('padSizeY', 0)),
            'status' : 'online'
        }
        player = self.players[self.channel_name]
        # Now do the calculations with float values





        
        if player['upKey'] and player['x'] + player['padSize'] + player['speed'] < 2.5:
            player['x'] += player['speed'] 
        if player['downKey'] and player['x'] - player['padSize'] - player['speed'] > -2.5:
            player['x'] -= player['speed']

        player['top'] = player['x'] + player['padSize']
        player['bottom'] = player['x'] - player['padSize']
        player['right'] = player['z'] + player['padSizeY']
        player['left'] = player['z'] - player['padSizeY']

        await self.gameChannel.group_send(
            f"game_group_{self.game_id}",
            {
                "type": "player_data",
                "player_data": self.players,
                "id": self.channel_name
            }
        )
        
        # self.send(text_data=json.dumps({
        #     'type': 'update',
        #     'message': f"Player {self.player['name']} updated!",
        #     'player_data': self.player
        # }))
    async def disconnect(self, close_code):
        if self.channel_name in self.players:
            del self.players[self.channel_name]  # Remove player data when disconnected
            print(f"Player {self.channel_name} disconnected.")

        await self.gameChannel.group_discard(
            "game_group",
            self.channel_name
        )
    async def game_data(self, event):
        game_data = event['game_data'][self.game_id]
    async def ball_data(self, event):
        return
    async def player_data(self, event):
        all_players = event['player_data']
        filtered_players = {key: value for key, value in all_players.items()}
        # print(f"Sending updated players data: {filtered_players}")

        await self.send(text_data=json.dumps({
            'type': 'update',
            'players': filtered_players[self.channel_name] 
        }))
        # print(f"Received player data: {player_data}")

class ballConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.gameChannel = get_channel_layer()
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        # print(f"Game ID: {self.game_id}")
        await self.gameChannel.group_add(
            f"game_group_{self.game_id}",
            self.channel_name
        )

    async def receive(self, text_data):
        if not text_data:
            print("empty data")
            return
        try:
            data = json.loads(text_data)
            self.ball = {
                'x' : float(data.get('x')),
                'y' : float(data.get('y')),
                'z' : float(data.get('z')),
                'speed' : float(data.get('speed')),
                'speed2' : float(data.get('speed2')),
                'posChangeX' : float(data.get('posChangeX')),
                'posChangeZ' : float(data.get('posChangeZ')),
                'redius' : float(data.get('redius'))
            }
            if self.ball['x'] - self.ball['redius'] <= -2.5:
                self.ball['posChangeX'] = -self.ball['posChangeX']
            if self.ball['x'] + self.ball['redius'] >= 2.5:
                self.ball['posChangeX'] = -self.ball['posChangeX']
            if self.ball['z'] - self.ball['redius'] <= -5 or self.ball['z'] + self.ball['redius'] >= 5:
                await self.restart()
            self.ball['x'] += self.ball['posChangeX']
            self.ball['z'] += self.ball['posChangeZ']
            self.ball['top'] = self.ball['x'] + self.ball['redius']
            self.ball['bottom'] = self.ball['x'] - self.ball['redius']
            self.ball['left'] = self.ball['z'] - self.ball['redius']
            self.ball['right'] = self.ball['z'] + self.ball['redius']
                
        except json.JSONDecodeError:
            print(f"Invalid JSON received: {text_data}")
            return
        await self.gameChannel.group_send(
            f"game_group_{self.game_id}",
            {
                "type": "ball_data",
                "ball_data": self.ball,
                "id": self.channel_name
            }
        )
    async def ball_data(self, event):
        ball = event['ball_data']
        await self.send(text_data=json.dumps({
            'type' : 'update',
            'message' : "Ball updated!",
            'ball_data' : ball
        }))
    async def game_data(self, event):
        game_data = event['game_data'][self.game_id]
    #     player_data = game_data['player_data']
    #     ball_data = game_data['ball']
    #     print(game_data)
        # player_id = event['id']  # This identifies the player who sent the update
        # await self.collisionHandle(player_data, player_id)  

    async def player_data(self, event):
        player_data = event['player_data']
        player_id = event['id'] 
        await self.collisionHandle(player_data, player_id)

    async def collisionHandle(self, player_data, player_id):
        # print(player_data)
        if not hasattr(self, 'ball'):
            print("Ball not initialized yet")
            return
        
        player = player_data.get(player_id)
        # print(player)
        if not player:
            print("Player data not found for this connection.")
            return
        
        if (
            player['top'] >= self.ball['bottom'] and 
            player['bottom'] <= self.ball['top'] and 
            player['right'] >= self.ball['left'] and 
            player['left'] <= self.ball['right']
        ):
            hitPoint = (self.ball['x'] - player['x']) / player['padSize']
            angleMove = hitPoint * math.pi / 4

            if self.ball['z'] < 0:
                self.ball['posChangeZ'] = self.ball['speed'] * math.cos(angleMove)
            elif self.ball['z'] > 0:
                self.ball['posChangeZ'] = -self.ball['speed'] * math.cos(angleMove)

            self.ball['posChangeX'] = self.ball['speed'] * math.sin(angleMove)

            if self.ball['speed'] < 90:
                self.ball['speed'] += 0.01

            # print(f"Collision detected with player {player['name']}!")

            # Send collision update
            await self.send(text_data=json.dumps({
                'type': 'collision',
                'message': f"Collision with {player['name']}",
                'ball_data': self.ball
            }))


    async def restart(self):
        self.ball['z'] = 0
        self.ball['x'] = 0
        # print(self.ball['x'])
        self.ball['posChangeZ'] = (-(self.ball['posChangeZ']/ self.ball['speed']) * self.ball['speed2'])
        self.ball['posChangeX'] = (self.ball['posChangeX']/ self.ball['speed'] * self.ball['speed2'])
        self.ball['speed'] = self.ball['speed2']
        # print(self.ball)
        await self.send(text_data=json.dumps({
                'type': 'restart',
                'ball_data': self.ball
            }))