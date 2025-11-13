# users/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from .token_store import create_token_for, delete_token, clear_tokens_for_user, get_username_by_token
from rest_framework.permissions import IsAuthenticated
from .auth import InMemoryTokenAuthentication

User = get_user_model()

class LoginView(APIView):
    def post(self, request):
        username = request.data.get("username", "")
        password = request.data.get("password", "")
        if not username or not password:
            return Response({"detail": "username и password обязательны"}, status=status.HTTP_400_BAD_REQUEST)
        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({"detail": "Неверный логин или пароль"}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.is_active:
            return Response({"detail": "Пользователь не активен"}, status=status.HTTP_403_FORBIDDEN)
        clear_tokens_for_user(user.username)
        token = create_token_for(user.username)
        return Response({"username": user.username, "token": token}, status=status.HTTP_200_OK)

class LogoutView(APIView):
    authentication_classes = [InMemoryTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if auth_header.startswith("Token "):
            token = auth_header.split(" ", 1)[1]
            delete_token(token)
        return Response({"detail": "logged out"}, status=status.HTTP_200_OK)

class MeView(APIView):
    authentication_classes = [InMemoryTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"username": request.user.username}, status=status.HTTP_200_OK)

class UsersListView(APIView):
    authentication_classes = [InMemoryTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = User.objects.all().values("username", "id")
        return Response(list(qs), status=status.HTTP_200_OK)
