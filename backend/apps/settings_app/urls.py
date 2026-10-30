# apps/settings_app/urls.py
from rest_framework.routers import DefaultRouter
from .views import AppSettingViewSet

router = DefaultRouter()
router.register(r'', AppSettingViewSet, basename='settings')

urlpatterns = router.urls