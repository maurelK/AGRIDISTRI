# intra/serializers.py
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import *

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'employee_id', 'profile_photo', 'is_active',
            'date_joined', 'last_login'
        )
        read_only_fields = ('date_joined', 'last_login')
    
    def get_full_name(self, obj):
        return obj.get_full_name()

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError("Compte désactivé")
            else:
                raise serializers.ValidationError("Identifiants invalides")
        else:
            raise serializers.ValidationError("Must include username and password")
        
        return data

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class CommuneSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = Commune
        fields = '__all__'

class VillageSerializer(serializers.ModelSerializer):
    commune_name = serializers.CharField(source='commune.name', read_only=True)
    department_name = serializers.CharField(source='commune.department.name', read_only=True)
    
    class Meta:
        model = Village
        fields = '__all__'

class DistributionSiteSerializer(serializers.ModelSerializer):
    village_name = serializers.CharField(source='village.name', read_only=True)
    commune_name = serializers.CharField(source='village.commune.name', read_only=True)
    department_name = serializers.CharField(source='village.commune.department.name', read_only=True)
    
    class Meta:
        model = DistributionSite
        fields = '__all__'

class InputCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = InputCategory
        fields = '__all__'

class AgriculturalInputSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = AgriculturalInput
        fields = '__all__'

class CampaignSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    
    class Meta:
        model = Campaign
        fields = '__all__'

class InventorySerializer(serializers.ModelSerializer):
    site_name = serializers.CharField(source='site.name', read_only=True)
    input_name = serializers.CharField(source='agricultural_input.name', read_only=True)
    campaign_name = serializers.CharField(source='campaign.name', read_only=True)
    unit = serializers.CharField(source='agricultural_input.unit', read_only=True)
    
    class Meta:
        model = Inventory
        fields = '__all__'

class BeneficiarySerializer(serializers.ModelSerializer):
    village_name = serializers.CharField(source='village.name', read_only=True)
    commune_name = serializers.CharField(source='village.commune.name', read_only=True)
    department_name = serializers.CharField(source='village.commune.department.name', read_only=True)
    
    class Meta:
        model = Beneficiary
        fields = '__all__'

class BeneficiaryCampaignSerializer(serializers.ModelSerializer):
    beneficiary_name = serializers.CharField(source='beneficiary.full_name', read_only=True)
    campaign_name = serializers.CharField(source='campaign.name', read_only=True)
    
    class Meta:
        model = BeneficiaryCampaign
        fields = '__all__'

class BeneficiaryAllocationSerializer(serializers.ModelSerializer):
    input_name = serializers.CharField(source='agricultural_input.name', read_only=True)
    unit = serializers.CharField(source='agricultural_input.unit', read_only=True)
    
    class Meta:
        model = BeneficiaryAllocation
        fields = '__all__'

class DistributionSerializer(serializers.ModelSerializer):
    beneficiary_name = serializers.CharField(source='beneficiary.full_name', read_only=True)
    agent_name = serializers.CharField(source='agent.get_full_name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    campaign_name = serializers.CharField(source='campaign.name', read_only=True)
    
    class Meta:
        model = Distribution
        fields = '__all__'

class DistributionItemSerializer(serializers.ModelSerializer):
    input_name = serializers.CharField(source='agricultural_input.name', read_only=True)
    unit = serializers.CharField(source='agricultural_input.unit', read_only=True)
    
    class Meta:
        model = DistributionItem
        fields = '__all__'

class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = '__all__'

class MessageCampaignSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = MessageCampaign
        fields = '__all__'

class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    
    class Meta:
        model = Document
        fields = '__all__'

class SyncLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = SyncLog
        fields = '__all__'