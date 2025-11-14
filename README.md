# CSV-Parser

Простой README для деплоя проекта (React / Vite + Django + Django REST Framework).

---

## Шаги

1. Запускаем сервер и устанавливаем: `postgres`, `git`, `gunicorn`, `nginx`.
2. Создаём базу данных.
3. Импортируем репозиторий на сервер (клонируем репозиторий).

---

## Backend

1. Заходим в папку `backend`.
2. Создаём виртуальное окружение:

```bash
python -m venv myenv
# активировать окружение
# Linux / macOS: source myenv/bin/activate
# Windows: myenv\Scripts\activate
```

3. Устанавливаем зависимости:

```bash
pip install -r requirements.txt
```

4. Создаём файл `.env` и добавляем туда переменные:

```
SECRET_KEY=Django App secret key
DEBUG=False
ALLOWED_HOSTS=http://example.com, http://www.example.com
SITE_URL=http://example.com

NAME=database name
USER=user
PASSWORD=password
HOST=localhost
PORT=5432
```

5. Делаем миграции, создаём суперпользователя и собираем статические файлы:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic
```

---

## Frontend

1. Заходим в папку `frontend`.
2. Устанавливаем зависимости:

```bash
npm i
```

3. Создаём файл `.env` для фронтенда и добавляем:

```
VITE_MODE=production
VITE_REACT_DEV_TOOLS=false
VITE_DEFAULT_LANG=ru
VITE_API_ORIGIN=http://example.com
```

4. Собираем продакшн-бандл:

```bash
npm run build
```

---

## Настройка на сервере

1. Настраиваем `gunicorn` для запуска Django-приложения.
2. Настраиваем `nginx`: указываем проксирование `api` и `admin` на backend; для фронтенда указываем `index.html` внутри папки `frontend`.

---
