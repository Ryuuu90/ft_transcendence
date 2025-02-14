import json
import math
from channels.generic.websocket import WebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class playerConsumer(WebsocketConsumer):
    players = {}
    def connect(self):
        self.accept()
        self.gameChannel = get_channel_layer()
        async_to_sync(self.gameChannel.group_add)(
            "game_group",
            self.channel_name
        )
    
    def receive(self, text_data):
        if not text_data:
            print("empty data")
            return
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            print(f"Invalid JSON received: {text_data}")
            return
        
        # Ensure values are converted to float before usage
        self.players[self.channel_name] = {
            'name': data.get('name'),
            'x': float(data.get('x', 0)),  # Default to 0 if not present
            'y': float(data.get('y', 0)),
            'z': float(data.get('z', 0)),
            'speed': float(data.get('speed', 0)),
            'upKey': data.get('upKey', False),
            'downKey': data.get('downKey', False),
            'padSize': float(data.get('padSize', 0)),
            'padSizeY': float(data.get('padSizeY', 0))
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

        async_to_sync(self.gameChannel.group_send)(
            "game_group",
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
    def disconnect(self, close_code):
        if self.channel_name in self.players:
            del self.players[self.channel_name]  # Remove player data when disconnected
            print(f"Player {self.channel_name} disconnected.")

        async_to_sync(self.gameChannel.group_discard)(
            "game_group",
            self.channel_name
        )

    def player_data(self, event):
            # This function is responsible for handling player data sent by playerConsumer
        all_players = event['player_data']
        filtered_players = {key: value for key, value in all_players.items()}
        # print(f"Sending updated players data: {filtered_players}")

        self.send(text_data=json.dumps({
            'type': 'update',
            'players': filtered_players  # Send data of all other players
        }))
        # print(f"Received player data: {player_data}")

class ballConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        self.gameChannel = get_channel_layer()
        async_to_sync(self.gameChannel.group_add)(
            "game_group",
            self.channel_name
        )

    def receive(self, text_data):
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
                self.restart()
            self.ball['x'] += self.ball['posChangeX']
            self.ball['z'] += self.ball['posChangeZ']
            self.ball['top'] = self.ball['x'] + self.ball['redius']
            self.ball['bottom'] = self.ball['x'] - self.ball['redius']
            self.ball['left'] = self.ball['z'] - self.ball['redius']
            self.ball['right'] = self.ball['z'] + self.ball['redius']
                
        except json.JSONDecodeError:
            print(f"Invalid JSON received: {text_data}")
            return
        self.send(text_data=json.dumps({
            'type' : 'update',
            'message' : "Ball updated!",
            'ball_data' : self.ball
        }))
    def player_data(self, event):
        player_data = event['player_data']
        player_id = event['id']  # This identifies the player who sent the update
        self.collisionHandle(player_data, player_id)  # Pass the player_id

    def collisionHandle(self, player_data, player_id):
        if not hasattr(self, 'ball'):
            print("Ball not initialized yet")
            return
        
        # Get the specific player using the provided player_id
        player = player_data.get(player_id)

        if not player:
            print("Player data not found for this connection.")
            return
        
        # Check collision only for this specific player
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
            self.send(text_data=json.dumps({
                'type': 'collision',
                'message': f"Collision with {player['name']}",
                'ball_data': self.ball
            }))


    def restart(self):
        self.ball['z'] = 0
        self.ball['x'] = 0
        # print(self.ball['x'])
        self.ball['posChangeZ'] = (-(self.ball['posChangeZ']/ self.ball['speed']) * self.ball['speed2'])
        self.ball['posChangeX'] = (self.ball['posChangeX']/ self.ball['speed'] * self.ball['speed2'])
        self.ball['speed'] = self.ball['speed2']
        self.send(text_data=json.dumps({
                'type': 'restart',
                'ball_data': self.ball
            }))