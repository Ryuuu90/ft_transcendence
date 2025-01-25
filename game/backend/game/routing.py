from django.urls import re_path
from . import consumers

websocket_urlpatterns = {
    re_path(r'ws/player/', consumers.playerConsumer.as_asgi()),
    re_path(r'ws/ball/', consumers.ballConsumer.as_asgi())

}