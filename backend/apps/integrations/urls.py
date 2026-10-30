# urls.py
from django.urls import path
from .views import CJImportProductsView, StripeCreatePaymentIntentView

urlpatterns = [
    path('cj/import-products/', CJImportProductsView.as_view()),
    path('stripe/create-payment-intent/', StripeCreatePaymentIntentView.as_view()),
]