# apps/products/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet

products_router = DefaultRouter()
products_router.register(r'', ProductViewSet, basename='products')

categories_router = DefaultRouter()
categories_router.register(r'', CategoryViewSet, basename='categories')

urlpatterns = [
    # IMPORTANT : categories AVANT products (sinon conflit)
    path('categories/', include(categories_router.urls)),
    path('', include(products_router.urls)),
]