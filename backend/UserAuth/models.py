from django.db import models
from django.contrib.auth.models import AbstractUser

class UserModel(AbstractUser):
    comment = models.TextField("Комментарий", blank=True, null=True)

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"
