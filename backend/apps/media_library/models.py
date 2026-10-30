from django.db import models

class MediaFile(models.Model):
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='media_library/')
    file_type = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
