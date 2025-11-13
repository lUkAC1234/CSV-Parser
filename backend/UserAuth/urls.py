# users/urls.py
from django.urls import path
from .views import LoginView, LogoutView, MeView, UsersListView

app_name = "users"

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("users/", UsersListView.as_view(), name="users_list"),
]
