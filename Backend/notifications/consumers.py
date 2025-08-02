import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from urllib.parse import parse_qs
User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Try to authenticate user via JWT token from query parameters
        self.user = await self.get_user_from_token()
        
        if self.user is None or self.user.is_anonymous:
            await self.close(code=4001)
        else:
            self.group_name = f'notifications_{self.user.id}'
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()
            print(f"WebSocket: User {self.user.email} connected to notifications")

    @database_sync_to_async
    def get_user_from_token(self):
        """Authenticate user from JWT token in query parameters"""
        try:
            # Get token from query parameters or headers
            query_params = parse_qs(self.scope['query_string'].decode())
            token = query_params.get('token', [None])[0]
            
            if not token:
                # Try to get from headers
                headers = dict(self.scope['headers'])
                auth_header = headers.get(b'authorization', b'').decode()
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
            
            if not token:
                print("WebSocket: No token found in query params or headers")
                return AnonymousUser()
            
            # Validate and decode the token
            access_token = AccessToken(token)
            user = User.objects.get(id=access_token['user_id'])
            print(f"WebSocket: Authenticated user {user.email}")
            return user
            
        except (InvalidToken, TokenError, User.DoesNotExist) as e:
            print(f"WebSocket: Authentication failed: {e}")
            return AnonymousUser()
        except Exception as e:
            print(f"WebSocket: Unexpected error during authentication: {e}")
            return AnonymousUser()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def notify(self, event):
        await self.send(text_data=json.dumps(event['data']))

    @database_sync_to_async
    def get_user(self, user_id):
        return User.objects.get(id=user_id)