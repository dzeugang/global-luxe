from django.db import models


class Message(models.Model):
    customer_email = models.EmailField()
    customer_name = models.CharField(max_length=255, blank=True)
    subject = models.CharField(max_length=255)
    content = models.TextField()
    is_from_admin = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']