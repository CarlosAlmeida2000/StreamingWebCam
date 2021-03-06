"""
ASGI config for Streaming project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/howto/deployment/asgi/
"""

import os
from channels.routing import ProtocolTypeRouter,  URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
import Reuniones.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Streaming.settings')

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        # Just HTTP for new. (We can add other protocols later.)
        "websocket": AuthMiddlewareStack(
            URLRouter(
                Reuniones.routing.webscoket_urlpatterns
            )
        )
    }
)
