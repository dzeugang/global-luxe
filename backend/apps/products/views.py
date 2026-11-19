from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser  # ✅ NOUVEAU
from django_filters.rest_framework import DjangoFilterBackend, FilterSet
from django_filters import rest_framework as filters
from .models import Product, Category
from .serializers import ProductListSerializer, ProductDetailSerializer, CategorySerializer


class ProductFilter(FilterSet):
    category__slug = filters.CharFilter(field_name='category__slug', lookup_expr='exact')
    sale_price__gte = filters.NumberFilter(field_name='sale_price', lookup_expr='gte')
    sale_price__lte = filters.NumberFilter(field_name='sale_price', lookup_expr='lte')
    stock__gt = filters.NumberFilter(field_name='stock', lookup_expr='gt')
    rating__gte = filters.NumberFilter(field_name='rating', lookup_expr='gte')

    class Meta:
        model = Product
        fields = [
            'category__slug', 'sale_price__gte', 'sale_price__lte',
            'stock__gt', 'rating__gte',
            'is_active', 'is_featured', 'is_best_seller',
        ]


class CategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD complet pour les catégories.
    Supporte upload de fichiers (multipart/form-data) ET URLs.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'

    # ✅ Accepter JSON ET multipart/form-data
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = Category.objects.all()
        if self.action in ['list', 'retrieve'] and not self.request.user.is_staff:
            qs = qs.filter(is_active=True)
        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'sku']
    ordering_fields = ['sale_price', 'created_at', 'rating', 'name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer

    def get_queryset(self):
        qs = Product.objects.all().select_related('category')
        if self.action in ['list', 'retrieve'] and not self.request.user.is_staff:
            qs = qs.filter(is_active=True)
        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'featured', 'best_sellers']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        if product.orderitem_set.exists():
            # Un produit déjà commandé doit rester pour l'historique : on le désactive
            product.is_active = False
            product.save(update_fields=['is_active'])
            return Response(
                {'detail': 'Ce produit figure dans des commandes : il a été désactivé au lieu d\'être supprimé.',
                 'deactivated': True},
                status=200,
            )
        product.delete()
        return Response(status=204)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        products = self.get_queryset().filter(is_featured=True)[:8]
        return Response(ProductListSerializer(products, many=True).data)

    @action(detail=False, methods=['get'])
    def best_sellers(self, request):
        products = self.get_queryset().filter(is_best_seller=True)[:8]
        return Response(ProductListSerializer(products, many=True).data)