from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/game/$', consumers.gameConsumer()),
    re_path(r'ws/player/(?P<game_id>[a-f0-9-]+)/$', consumers.playerConsumer.as_asgi()),
    re_path(r'ws/ball/(?P<game_id>[a-f0-9-]+)/$', consumers.ballConsumer.as_asgi()),
]