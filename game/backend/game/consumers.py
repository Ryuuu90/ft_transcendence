import json
import math
from channels.generic.websocket import WebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class playerConsumer(WebsocketConsumer):
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
        self.player = {'name':data.get('name'),
            'x':data.get('x'),
            'y':data.get('y'),
            'z':data.get('z'),
            'speed':data.get('speed'),
            'upKey':data.get('upKey', False),
            'downKey':data.get('downKey', False),
            'padSize' :data.get('padSize'),
            'padSizeY' : data.get('padSizeY')    }
        if self.player['upKey'] and self.player['x'] + self.player['padSize'] + self.player['speed'] < 2.5:
            self.player['x'] += self.player['speed'] 
        if self.player['downKey'] and self.player['x'] - self.player['padSize'] - self.player['speed'] > -2.5:
            self.player['x'] -= self.player['speed']
        self.player['top'] = self.player['x'] + self.player['padSize']
        self.player['bottom'] = self.player['x'] - self.player['padSize']
        self.player['right'] = self.player['z'] + self.player['padSizeY']
        self.player['left'] = self.player['z'] - self.player['padSizeY']
        async_to_sync(self.gameChannel.group_send)(
            "game_group",
            {
                "type" : "player_data",
                "player_data" : self.player
            }
        )
        self.send(text_data=json.dumps({
        'type': 'update',
        'message': f"Player {self.player['name']} updated!",
        'player_data': self.player
        }))
    def player_data(self, event):
            # This function is responsible for handling player data sent by playerConsumer
        player_data = event['player_data']
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
                'x' : data.get('x'),
                'y' : data.get('y'),
                'z' : data.get('z'),
                'speed' : data.get('speed'),
                'speed2' : data.get('speed2'),
                'posChangeX' : data.get('posChangeX'),
                'posChangeZ' : data.get('posChangeZ'),
                'redius' : data.get('redius')
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
        self.collisionHandle(player_data)


    def collisionHandle(self, event):
        player = event
        if not hasattr(self, 'ball'):
            print("Ball not initialized yet")
            return
        if player['top'] >= self.ball['bottom'] and player['bottom'] <= self.ball['top'] and player['right'] >= self.ball['left'] and player['left'] <= self.ball['right']:
            hitPoint = (self.ball['x'] - player['x']) /  player['padSize']
            angleMove = hitPoint * math.pi / 4
            if self.ball['z'] < 0:
                self.ball['posChangeZ'] = self.ball['speed'] * math.cos(angleMove)
            elif self.ball['z'] > 0:
                self.ball['posChangeZ'] = -self.ball['speed'] * math.cos(angleMove)
            self.ball['posChangeX'] = self.ball['speed'] * math.sin(angleMove)
            if self.ball['speed'] < 90:
                self.ball['speed'] += 0.01
        self.send(text_data=json.dumps({
            'type' : 'collision',
            'message' : "Ball updated!",
            'ball_data' : self.ball
        }))
    def restart(self):
        self.ball['z'] = 0
        self.ball['x'] = 0
        self.ball['posChangeZ'] = (-(self.ball['posChangeZ']/ self.ball['speed']) * self.ball['speed2'])
        self.ball['posChangeX'] = (self.ball['posChangeX']/ self.ball['speed'] * self.ball['speed2'])
        self.ball['speed'] = self.ball['speed2']