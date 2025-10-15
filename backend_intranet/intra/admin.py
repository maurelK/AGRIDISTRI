# intra/admin.py
from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from .models import *

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'is_active']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'email', 'employee_id']

@admin.register(DistributionSite)
class DistributionSiteAdmin(GISModelAdmin):
    list_display = ['name', 'site_type', 'village', 'is_active']
    list_filter = ['site_type', 'is_active']
    search_fields = ['name', 'village__name']

@admin.register(Beneficiary)
class BeneficiaryAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'gender', 'village', 'status']
    list_filter = ['gender', 'status', 'village__commune__department']
    search_fields = ['first_name', 'last_name', 'card_number']

@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ['name', 'start_date', 'end_date', 'status']
    list_filter = ['status', 'start_date']
    search_fields = ['name', 'description']

@admin.register(AgriculturalInput)
class AgriculturalInputAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'unit', 'unit_price', 'is_active']
    list_filter = ['category', 'unit', 'is_active']
    search_fields = ['name', 'brand', 'variety']

# Register other models
admin.site.register(Department)
admin.site.register(Commune)
admin.site.register(Village)
admin.site.register(InputCategory)
admin.site.register(Inventory)
admin.site.register(Distribution)
admin.site.register(PaymentTransaction)
admin.site.register(MessageCampaign)
admin.site.register(Document)