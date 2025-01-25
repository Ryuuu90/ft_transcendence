import json
from channels.generic.websocket import WebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class playerConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        self.gameChannel = get_channel_layer()
    
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
            'padSize' :data.get('padSize')}     
        if self.player['upKey']:
            self.player['x'] += self.player['speed'] 
        if self.player['downKey']:
            self.player['x'] -= self.player['speed']
        
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

class ballConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        self.gameChannel = get_channel_layer()
        self.gameChannel.group_add(
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
                'z' : data.gat('z'),
                'posChangeX' : data.get('posChangeX'),
                'posChangeY' : data.get('posChangeY'),
            }
        except json.JSONDecodeError:
            print(f"Invalid JSON received: {text_data}")
            return
    def collisionHandle(self, event):
        player = event['player_data']