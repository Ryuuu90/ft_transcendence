from rest_framework import serializers
from game.models import *

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ['id', 'name', 'x', 'y', 'z', 'speed', 'upKey', 'downKey', 'winning']

class BallSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ball
        fields = ['id', 'name', 'x', 'y', 'z', 'posChangeX', 'posChangeY']

class gameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ['id', 'Player1', 'Player2', 'ball']