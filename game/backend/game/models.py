from django.db import models

# Create your models here.
class Ball(models.Model):
    x = models.FloatField()
    y = models.FloatField()
    z = models.FloatField()
    posChangeX = models.FloatField()
    posChangeY = models.FloatField()
    def _str_(self):
        return f"Ball at ({self.x}, {self.y}, {self.z})"

class Player(models.Model):
    name = models.CharField(max_length=24)
    x = models.FloatField()
    y = models.FloatField()
    z = models.FloatField()
    speed = models.FloatField()
    upKey = models.BooleanField(default=True)
    downKey = models.BooleanField(default=True)
    winning = models.IntegerField()
    def _str_(self):
        return f"Player {self.name} at ({self.x}, {self.y}, {self.z})"

class Game(models.Model):
    Player1 = Player()
    Player2 = Player()
    ball = Ball()

