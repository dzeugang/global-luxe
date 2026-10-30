# apps/shipping/urls.py
from rest_framework.routers import DefaultRouter
from .views import ShippingMethodViewSet

router = DefaultRouter()
router.register(r'', ShippingMethodViewSet, basename='shipping')

urlpatterns = router.urls