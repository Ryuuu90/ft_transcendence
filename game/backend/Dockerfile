FROM python:3.10.12

WORKDIR /usr/src/app

COPY ./requirements.txt .

RUN pip install --upgrade pip

RUN pip install --no-cache-dir -r requirements.txt

RUN pip uninstall django-cors-headers && pip install django-cors-headers && pip install daphne


CMD [ "daphne", "-b", "0.0.0.0", "-p", "8000", "game_backend.asgi:application"]