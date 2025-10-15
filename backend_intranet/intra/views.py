# intra/views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Count
from django.utils import timezone
from rest_framework.decorators import api_view
from datetime import datetime, timedelta
from .models import *
from .serializers import *

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['role', 'is_active']
    search_fields = ['username', 'first_name', 'last_name', 'employee_id']

    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_photo.url)
            else:
                # Fallback si pas de request dans le contexte
                return f"http://localhost:8000{obj.profile_photo.url}"
        return None


class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            
            user_data = UserSerializer(user).data
            
            return Response({
                'user': user_data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Déconnexion réussie'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code']

class CommuneViewSet(viewsets.ModelViewSet):
    queryset = Commune.objects.all()
    serializer_class = CommuneSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['department']
    search_fields = ['name', 'code']

class VillageViewSet(viewsets.ModelViewSet):
    queryset = Village.objects.all()
    serializer_class = VillageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['commune']
    search_fields = ['name']

class DistributionSiteViewSet(viewsets.ModelViewSet):
    queryset = DistributionSite.objects.all()
    serializer_class = DistributionSiteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['site_type', 'is_active', 'village']
    search_fields = ['name', 'contact_person']

    @action(detail=True, methods=['get'])
    def inventory(self, request, pk=None):
        site = self.get_object()
        inventory = Inventory.objects.filter(site=site)
        serializer = InventorySerializer(inventory, many=True)
        return Response(serializer.data)

class AgriculturalInputViewSet(viewsets.ModelViewSet):
    queryset = AgriculturalInput.objects.all()
    serializer_class = AgriculturalInputSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'is_active', 'unit']
    search_fields = ['name', 'brand', 'variety']

class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'description']

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        campaign = self.get_object()
        
        # Statistiques de base
        total_distributions = Distribution.objects.filter(campaign=campaign).count()
        total_beneficiaries = BeneficiaryCampaign.objects.filter(campaign=campaign).count()
        
        # Quantités distribuées
        distribution_items = DistributionItem.objects.filter(
            distribution__campaign=campaign
        )
        total_quantity = distribution_items.aggregate(
            total=Sum('distributed_quantity')
        )['total'] or 0
        
        # Distribution par intrant
        inputs_distribution = distribution_items.values(
            'agricultural_input__name',
            'agricultural_input__unit'
        ).annotate(
            total_quantity=Sum('distributed_quantity')
        )
        
        return Response({
            'total_distributions': total_distributions,
            'total_beneficiaries': total_beneficiaries,
            'total_quantity_distributed': total_quantity,
            'distribution_by_input': list(inputs_distribution)
        })

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['site', 'agricultural_input', 'campaign']

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        # Stocks avec moins de 10% de la quantité initiale
        low_stock = Inventory.objects.filter(
            current_quantity__lt=models.F('initial_quantity') * 0.1
        )
        serializer = self.get_serializer(low_stock, many=True)
        return Response(serializer.data)

class BeneficiaryViewSet(viewsets.ModelViewSet):
    queryset = Beneficiary.objects.all()
    serializer_class = BeneficiarySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['village', 'status', 'gender']
    search_fields = ['first_name', 'last_name', 'card_number', 'phone']

    @action(detail=False, methods=['post'])
    def search_by_card(self, request):
        card_number = request.data.get('card_number')
        try:
            beneficiary = Beneficiary.objects.get(card_number=card_number)
            serializer = self.get_serializer(beneficiary)
            return Response(serializer.data)
        except Beneficiary.DoesNotExist:
            return Response(
                {'error': 'Bénéficiaire non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def distributions(self, request, pk=None):
        beneficiary = self.get_object()
        distributions = Distribution.objects.filter(beneficiary=beneficiary)
        serializer = DistributionSerializer(distributions, many=True)
        return Response(serializer.data)

class DistributionViewSet(viewsets.ModelViewSet):
    queryset = Distribution.objects.all()
    serializer_class = DistributionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'agent', 'site', 'campaign', 'payment_method']
    search_fields = ['beneficiary__first_name', 'beneficiary__last_name', 'reference_number']

    def perform_create(self, serializer):
        # Générer un numéro de référence unique
        import uuid
        reference = f"DIST-{uuid.uuid4().hex[:8].upper()}"
        serializer.save(reference_number=reference, agent=self.request.user)

    @action(detail=False, methods=['get'])
    def sync_pending(self, request):
        pending = Distribution.objects.filter(is_synced=False)
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_sync(self, request):
        distribution_ids = request.data.get('distribution_ids', [])
        distributions = Distribution.objects.filter(id__in=distribution_ids)
        
        updated_count = distributions.update(is_synced=True, last_sync_attempt=timezone.now())
        
        return Response({
            'message': f'{updated_count} distributions synchronisées',
            'synced_ids': list(distributions.values_list('id', flat=True))
        })

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        # Filtres
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        campaign_id = request.query_params.get('campaign_id')
        
        queryset = Distribution.objects.all()
        
        if start_date:
            queryset = queryset.filter(distribution_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(distribution_date__lte=end_date)
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        
        # Statistiques
        total_distributions = queryset.count()
        total_beneficiaries = queryset.values('beneficiary').distinct().count()
        
        # Distribution par jour
        daily_stats = queryset.extra(
            {'date': "date(distribution_date)"}
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        # Distribution par site
        site_stats = queryset.values('site__name').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response({
            'total_distributions': total_distributions,
            'total_beneficiaries': total_beneficiaries,
            'daily_stats': list(daily_stats),
            'site_stats': list(site_stats)
        })

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def overview(self, request):
        # Statistiques globales
        total_beneficiaries = Beneficiary.objects.count()
        total_agents = User.objects.filter(role=User.Role.AGENT).count()
        total_sites = DistributionSite.objects.count()
        active_campaigns = Campaign.objects.filter(status=Campaign.Status.ACTIVE).count()
        
        # Distributions du jour
        today = timezone.now().date()
        today_distributions = Distribution.objects.filter(
            distribution_date__date=today
        ).count()
        
        # Stocks bas
        low_stock_count = Inventory.objects.filter(
            current_quantity__lt=models.F('initial_quantity') * 0.1
        ).count()
        
        # Distributions en attente de synchronisation
        pending_sync = Distribution.objects.filter(is_synced=False).count()
        
        return Response({
            'total_beneficiaries': total_beneficiaries,
            'total_agents': total_agents,
            'total_sites': total_sites,
            'active_campaigns': active_campaigns,
            'today_distributions': today_distributions,
            'low_stock_count': low_stock_count,
            'pending_sync': pending_sync
        })
    

class InputCategoryViewSet(viewsets.ModelViewSet):
    queryset = InputCategory.objects.all()
    serializer_class = InputCategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class BeneficiaryCampaignViewSet(viewsets.ModelViewSet):
    queryset = BeneficiaryCampaign.objects.all()
    serializer_class = BeneficiaryCampaignSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['beneficiary', 'campaign', 'is_active']

class DistributionItemViewSet(viewsets.ModelViewSet):
    queryset = DistributionItem.objects.all()
    serializer_class = DistributionItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['distribution', 'agricultural_input']

class MessageCampaignViewSet(viewsets.ModelViewSet):
    queryset = MessageCampaign.objects.all()
    serializer_class = MessageCampaignSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'message_type']
    search_fields = ['title', 'content']

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'document_type', 'is_active']
    search_fields = ['title', 'description', 'keywords']

@api_view(['GET'])
def api_overview(request):
    """Vue d'aperçu de l'API"""
    endpoints = {
        'message': 'API AgriDistriConnect',
        'endpoints': {
            'auth': '/api/auth/login/',
            'users': '/api/users/',
            'beneficiaries': '/api/beneficiaries/',
            'sites': '/api/sites/',
            'agricultural-inputs': '/api/agricultural-inputs/',
            'campaigns': '/api/campaigns/',
            'distributions': '/api/distributions/',
            'inventory': '/api/inventory/',
        }
    }
    return Response(endpoints)