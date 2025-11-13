from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django import forms
from .models import UserModel
from django.contrib.auth.models import Group
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from unfold.admin import ModelAdmin

admin.site.unregister(Group) 

@admin.register(Group)
class CustomGroupAdmin(BaseGroupAdmin, ModelAdmin):
    pass

class SimpleUserCreationForm(forms.ModelForm):
    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(label="Password confirmation", widget=forms.PasswordInput, required=False)

    class Meta:
        model = UserModel
        fields = ("username", "comment")

    def clean_password2(self):
        p1 = self.cleaned_data.get("password1")
        p2 = self.cleaned_data.get("password2")
        if p1 and p2 and p1 != p2:
            raise forms.ValidationError("Пароли не совпадают")
        return p2 or p1

    def save(self, commit=True):
        user = super().save(commit=False)
        password = self.cleaned_data.get("password1")
        if password:
            user.set_password(password)
        if commit:
            user.save()
        return user

class SimpleUserChangeForm(forms.ModelForm):
    class Meta:
        model = UserModel
        fields = ("username", "comment", "is_active", "is_staff", "is_superuser")

@admin.register(UserModel)
class CustomUserAdmin(UserAdmin, ModelAdmin):
    add_form = SimpleUserCreationForm
    form = SimpleUserChangeForm
    model = UserModel

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "password1", "password2", "comment"),
        }),
    )

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Дополнительно", {"fields": ("comment",)}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    list_display = ("username", "is_staff", "is_active")
    search_fields = ("username", "comment")
