from pathlib import Path
from django.urls import reverse_lazy
from django.templatetags.static import static
from dotenv import load_dotenv
import os

load_dotenv()

DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")
USE_X_FORWARDED_HOST = False

hosts_env = os.getenv("ALLOWED_HOSTS", "")
if hosts_env.strip() == "*":
    ALLOWED_HOSTS = ["*"]
else:
    ALLOWED_HOSTS = [i.strip() for i in hosts_env.split(",") if i.strip()]

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get("SECRET_KEY")

INSTALLED_APPS = [
    "unfold",
    "unfold.contrib.import_export",
    "unfold.contrib.forms",
    "parler",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "django_filters",
    "import_export",
    "web",
    "UserAuth",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

LANGUAGE_CODE = "ru"
USE_I18N = True

LANGUAGES = [
    ("ru", "Русский"),
]

PARLER_LANGUAGES = {
    None: (
        {"code": "ru"},
    ),
    "default": {
        "hide_untranslated": True,
    },
}
PARLER_DEFAULT_LANGUAGE_CODE = "ru"

SESSION_ENGINE = "django.contrib.sessions.backends.db"
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 8 * 24 * 60 * 60

CORS_ORIGIN_ALLOW_ALL = True
CORS_ALLOW_CREDENTIALS = True

# CORS_ALLOWED_ORIGINS = [
#     "https://example.uz",   
#     "https://www.example.uz",  
# ]

# if DEBUG:
#     CORS_ALLOWED_ORIGINS += [
#         "http://127.0.0.1:5173",
#         "http://localhost:5173",
#         "http://127.0.0.1:5174",
#         "http://localhost:5174",
#     ]

REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
}

FILE_CHARSET = "utf-8"
DEFAULT_CHARSET = "utf-8"

X_FRAME_OPTIONS = "ALLOWALL"

DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024
DATA_UPLOAD_MAX_NUMBER_FIELDS = 2000

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "web/templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

UNFOLD = {
    "SITE_TITLE": "Csv Данные",
    "SITE_HEADER": "Csv Данные",
    "SITE_URL": "/api/calls/bulk_create",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": True,
    "COLORS": {
        "base": {
            "50": "249 250 251",
            "100": "243 244 246",
            "200": "229 231 235",
            "300": "209 213 219",
            "400": "156 163 175",
            "500": "107 114 128",
            "600": "75 85 99",
            "700": "55 65 81",
            "800": "31 41 55",
            "900": "17 24 39",
            "950": "3 7 18",
        },
        "primary": {
            "50": "240 243 255",
            "100": "224 231 255",
            "200": "184 198 255",
            "300": "122 150 255",
            "400": "59 121 255",
            "500": "26 47 251",
            "600": "0 47 230",
            "700": "0 37 178",
            "800": "0 26 128",
            "900": "0 16 76"
        },
        "font": {
            "subtle-light": "var(--color-base-500)",
            "subtle-dark": "var(--color-base-400)",
            "default-light": "var(--color-base-600)",
            "default-dark": "var(--color-base-300)",
            "important-light": "var(--color-base-900)",
            "important-dark": "var(--color-base-100)",
        },
    },
    "STYLES": [
        lambda request: static("main/admin/__admin.css"),
    ],
    "BORDER_RADIUS": "0.5rem",
    "SIDEBAR": {
        "show_search": True,
        "navigation": [
            {
                "separator": True,
                "collapsible": True,
                "title": "Главная навигация",
                "items": [
                    {
                        "title": "Панель управления",
                        "icon": "dashboard",
                        "link": reverse_lazy("admin:index"),
                    },
                ],
            },
        ],
    },
}

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("NAME"),
        "USER": os.environ.get("USER"),
        "PASSWORD": os.environ.get("PASSWORD"),
        "HOST": os.environ.get("HOST"),
        "PORT": os.environ.get("PORT"),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

TIME_ZONE = "Asia/Tashkent"
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "static")
STATICFILES_DIRS = [os.path.join(BASE_DIR, "assets")]

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

MESSAGE_STORAGE = "django.contrib.messages.storage.session.SessionStorage"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "UserAuth.UserModel"

SITE_URL = os.getenv("SITE_URL")