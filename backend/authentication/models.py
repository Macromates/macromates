from datetime import timedelta

from django.db import models
from django.utils import timezone


class CodeModel(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=12)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return self.created_at < timezone.now() - timedelta(minutes=15)

    def __str__(self):
        return f"{self.email} - {self.code}"
