from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from game.models import *
from game.serializers import *
import json


Player1 = Player()

game = Game()



Player1.name = "rayan"
Player1.x = 10
Player1.y = 10
Player1.z = 10
Player1.speed = 10
# Player1.key = "up"
Player1.winning = 0
# Player1.save()
game.Player1 = Player1
# game.save()

def index(request):
    return render(request, "index/index.html", {
        "player" : game.Player1
    })


@api_view(['GET', 'POST'])
def startGame(request):
    if request.method == 'GET':
        # player = {}
        serializer = PlayerSerializer(player, many=True)
        return JsonResponse(serializer.data, safe=False)
    # if request.method == 'PUT':
    #     data = json.loads(request.body)
    #     player = Player.objects.get(name=data.get('name'))
    #     player.x=data.get('x')
    #     player.y=data.get('y')
    #     player.z=data.get('z')
    #     player.speed=data.get('speed',False)
    #     player.upKey=data.get('upKey',False)
    #     player.downKey=data.get('downKey')
    #     player.winning=data.get('winning', 0)
    #     player.save()
    #     return Response(request.body, status=status.HTTP_201_CREATED)
    if request.method == 'POST':
        data = json.loads(request.body)
        if  Player.objects.filter(name=data.get('name')).exists():
            player = Player.objects.get(name=data.get('name'))
            player.x=data.get('x')
            player.y=data.get('y')
            player.z=data.get('z')
            player.speed=data.get('speed')
            player.upKey=data.get('upKey',False)
            player.downKey=data.get('downKey',False)
            player.winning=data.get('winning', 0)
            if player.upKey:
                player.x += player.speed  # Move up along x
            if player.downKey:
                player.x -= player.speed 
            player.save()
        else :
            player = Player(
                name=data.get('name'),
                x=data.get('x'),
                y=data.get('y'),
                z=data.get('z'),
                speed=data.get('speed'),
                upKey=data.get('upKey', False),
                downKey=data.get('downKey', False),
                winning=data.get('winning', 0)
            )
            if player.upKey:
                player.x += player.speed  # Move up along x
            if player.downKey:
                player.x -= player.speed  
            player.save()

            # serializer.save()
        return Response({'name' : player.name,
                         'x' : player.x,
                         'y' : player.y,
                         'z' : player.z,
                         'speed' : player.speed,
                         'upKey' : player.upKey,
                         'upDown' : player.downKey,
                         'winning' : player.winning}, status=status.HTTP_201_CREATED)
    else:
        return Response(request.errors, status=status.HTTP_400_BAD_REQUEST)