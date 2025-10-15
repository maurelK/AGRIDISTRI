# intra/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'auth', views.AuthViewSet, basename='auth')
router.register(r'departments', views.DepartmentViewSet)
router.register(r'communes', views.CommuneViewSet)
router.register(r'villages', views.VillageViewSet)
router.register(r'sites', views.DistributionSiteViewSet)
router.register(r'input-categories', views.InputCategoryViewSet)
router.register(r'agricultural-inputs', views.AgriculturalInputViewSet)
router.register(r'campaigns', views.CampaignViewSet)
router.register(r'inventory', views.InventoryViewSet)
router.register(r'beneficiaries', views.BeneficiaryViewSet)
router.register(r'distributions', views.DistributionViewSet)
router.register(r'dashboard', views.DashboardViewSet, basename='dashboard')

# Dans intra/urls.py, ajoutez ces lignes au router
router.register(r'beneficiary-campaigns', views.BeneficiaryCampaignViewSet)
router.register(r'distribution-items', views.DistributionItemViewSet)
router.register(r'message-campaigns', views.MessageCampaignViewSet)
router.register(r'documents', views.DocumentViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/', views.api_overview, name='api-overview'),

]