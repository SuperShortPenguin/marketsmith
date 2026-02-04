# core/routing.py
from django.urls import re_path
from .consumers import WaitingRoomConsumer

websocket_urlpatterns = [
    re_path(r"ws/waiting/(?P<game_id>\d+)/$", WaitingRoomConsumer.as_asgi()),
]
