from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework import exceptions
from django.contrib.auth import get_user_model
from .token_store import get_username_by_token

User = get_user_model()

class InMemoryTokenAuthentication(BaseAuthentication):
    keyword = b"Token"

    def authenticate(self, request):
        auth = get_authorization_header(request).split()
        if not auth:
            return None
        if auth[0].lower() != self.keyword.lower():
            return None
        if len(auth) == 1:
            raise exceptions.AuthenticationFailed("Invalid token header. No credentials provided.")
        if len(auth) > 2:
            raise exceptions.AuthenticationFailed("Invalid token header.")
        try:
            token = auth[1].decode()
        except Exception:
            token = auth[1]
        username = get_username_by_token(token)
        if not username:
            raise exceptions.AuthenticationFailed("Invalid or expired token.")
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed("User not found for token.")
        return (user, token)
