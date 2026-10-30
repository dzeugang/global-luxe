from django.urls import path
from .views import CustomerListView, CustomerDetailView

urlpatterns = [
    path('', CustomerListView.as_view()),
    path('<str:email>/', CustomerDetailView.as_view()),
]