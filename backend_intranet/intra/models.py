# intra/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.validators import MinValueValidator
import uuid

# ==============================================================================
# USER MANAGEMENT
# ==============================================================================

class User(AbstractUser):
    """Extended user model for different types of actors in the system"""
    
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Administrateur'
        SUPERVISOR = 'supervisor', 'Superviseur'
        AGENT = 'agent', 'Agent de distribution'
        LOGISTICIAN = 'logistician', 'Logisticien'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.AGENT)
    phone = models.CharField(max_length=20, blank=True)
    employee_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    is_active_field = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Profile information
    profile_photo = models.ImageField(upload_to='profiles/', null=True, blank=True)
    address = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"


# ==============================================================================
# GEOGRAPHIC MODELS
# ==============================================================================

class Department(models.Model):
    """Département (administrative division)"""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "Département"
        ordering = ['name']


class Commune(models.Model):
    """Commune (sub-administrative division)"""
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='communes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.department.name})"
    
    class Meta:
        verbose_name = "Commune"
        unique_together = ['name', 'department']
        ordering = ['department__name', 'name']


class Village(models.Model):
    """Village"""
    name = models.CharField(max_length=100)
    commune = models.ForeignKey(Commune, on_delete=models.CASCADE, related_name='villages')
    # GPS coordinates for village center
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.commune})"
    
    class Meta:
        unique_together = ['name', 'commune']
        ordering = ['commune__department__name', 'commune__name', 'name']


# ==============================================================================
# DISTRIBUTION INFRASTRUCTURE
# ==============================================================================

class DistributionSite(models.Model):
    """Points de distribution"""
    
    class SiteType(models.TextChoices):
        COOPERATIVE = 'cooperative', 'Coopérative'
        COLLECTION_POINT = 'collection_point', 'Point de collecte'
        MOBILE = 'mobile', 'Mobile'
        OTHER = 'other', 'Autre'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    site_type = models.CharField(max_length=20, choices=SiteType.choices)
    village = models.ForeignKey(Village, on_delete=models.CASCADE, related_name='distribution_sites')
    
    # GPS coordinates
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Site details
    contact_person = models.CharField(max_length=200, blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    capacity = models.PositiveIntegerField(help_text="Capacité de stockage (kg)")
    
    # Status
    is_active = models.BooleanField(default=True)
    opening_date = models.DateField(null=True, blank=True)
    closing_date = models.DateField(null=True, blank=True)
    
    # Assigned agents
    assigned_agents = models.ManyToManyField(User, through='SiteAssignment', related_name='assigned_sites')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.village}"
    
    class Meta:
        verbose_name = "Site de distribution"
        ordering = ['village__commune__department__name', 'village__commune__name', 'name']


class SiteAssignment(models.Model):
    """Assignment of agents to distribution sites"""
    agent = models.ForeignKey(User, on_delete=models.CASCADE)
    site = models.ForeignKey(DistributionSite, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_primary = models.BooleanField(default=False, help_text="Agent principal du site")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['agent', 'site', 'start_date']


# ==============================================================================
# AGRICULTURAL INPUTS
# ==============================================================================

class InputCategory(models.Model):
    """Catégories d'intrants (semences, engrais, pesticides, etc.)"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.ImageField(upload_to='categories/', null=True, blank=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "Catégorie d'intrant"
        verbose_name_plural = "Catégories d'intrants"
        ordering = ['name']


class AgriculturalInput(models.Model):
    """Intrants agricoles (semences, engrais, pesticides, etc.)"""
    
    class Unit(models.TextChoices):
        KG = 'kg', 'Kilogramme'
        L = 'l', 'Litre'
        BAG = 'bag', 'Sac'
        PIECE = 'piece', 'Pièce'
        BOTTLE = 'bottle', 'Bouteille'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    category = models.ForeignKey(InputCategory, on_delete=models.CASCADE, related_name='inputs')
    
    # Product details
    brand = models.CharField(max_length=100, blank=True)
    variety = models.CharField(max_length=100, blank=True, help_text="Variété (pour les semences)")
    composition = models.TextField(blank=True, help_text="Composition chimique")
    
    # Units and packaging
    unit = models.CharField(max_length=10, choices=Unit.choices)
    package_size = models.DecimalField(max_digits=10, decimal_places=3, 
                                     help_text="Taille du conditionnement")
    
    # Pricing
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    subsidized_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Product information
    description = models.TextField(blank=True)
    usage_instructions = models.TextField(blank=True)
    safety_instructions = models.TextField(blank=True)
    
    # Product image
    image = models.ImageField(upload_to='inputs/', null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.package_size} {self.unit})"
    
    class Meta:
        verbose_name = "Intrant agricole"
        unique_together = ['name', 'brand', 'package_size', 'unit']
        ordering = ['category__name', 'name']


# ==============================================================================
# CAMPAIGN MANAGEMENT
# ==============================================================================

class Campaign(models.Model):
    """Campagnes de distribution"""
    
    class Status(models.TextChoices):
        PLANNED = 'planned', 'Planifiée'
        ACTIVE = 'active', 'Active'
        SUSPENDED = 'suspended', 'Suspendue'
        COMPLETED = 'completed', 'Terminée'
        CANCELLED = 'cancelled', 'Annulée'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Campaign period
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Geographic scope
    target_departments = models.ManyToManyField(Department, blank=True)
    target_communes = models.ManyToManyField(Commune, blank=True)
    target_villages = models.ManyToManyField(Village, blank=True)
    
    # Campaign details
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)
    budget = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    target_beneficiaries = models.PositiveIntegerField(null=True, blank=True)
    
    # Responsible persons
    manager = models.ForeignKey(User, on_delete=models.PROTECT, related_name='managed_campaigns')
    supervisors = models.ManyToManyField(User, related_name='supervised_campaigns', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.start_date} - {self.end_date})"
    
    class Meta:
        verbose_name = "Campagne"
        ordering = ['-start_date', 'name']


# ==============================================================================
# INVENTORY MANAGEMENT
# ==============================================================================

class Inventory(models.Model):
    """Stocks d'intrants par site"""
    
    site = models.ForeignKey(DistributionSite, on_delete=models.CASCADE, related_name='inventory')
    agricultural_input = models.ForeignKey(AgriculturalInput, on_delete=models.CASCADE)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE)
    
    # Stock levels
    initial_quantity = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    current_quantity = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    reserved_quantity = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    distributed_quantity = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    
    # Dates
    stock_date = models.DateField(default=timezone.now)
    expiry_date = models.DateField(null=True, blank=True)
    
    # Batch information
    batch_number = models.CharField(max_length=100, blank=True)
    supplier = models.CharField(max_length=200, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def available_quantity(self):
        return self.current_quantity - self.reserved_quantity
    
    def __str__(self):
        return f"{self.site.name} - {self.agricultural_input.name} ({self.current_quantity} {self.agricultural_input.unit})"
    
    class Meta:
        verbose_name = "Stock"
        unique_together = ['site', 'agricultural_input', 'campaign', 'batch_number']
        ordering = ['site__name', 'agricultural_input__name']


# ==============================================================================
# BENEFICIARY MANAGEMENT
# ==============================================================================

class Beneficiary(models.Model):
    """Bénéficiaires des distributions"""
    
    class Gender(models.TextChoices):
        MALE = 'M', 'Masculin'
        FEMALE = 'F', 'Féminin'
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Actif'
        SUSPENDED = 'suspended', 'Suspendu'
        INACTIVE = 'inactive', 'Inactif'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Personal information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=1, choices=Gender.choices)
    date_of_birth = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Geographic information
    village = models.ForeignKey(Village, on_delete=models.CASCADE, related_name='beneficiaries')
    address = models.TextField(blank=True)
    # Location fields
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Identification
    card_number = models.CharField(max_length=50, unique=True)
    national_id = models.CharField(max_length=50, blank=True)
    
    # Profile
    photo = models.ImageField(upload_to='beneficiaries/', null=True, blank=True)
    qr_code = models.ImageField(upload_to='qr_codes/', null=True, blank=True)
    
    # Agricultural information
    farm_size = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, 
                                  help_text="Superficie en hectares")
    main_crops = models.CharField(max_length=200, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    registration_date = models.DateField(default=timezone.now)
    
    # Campaign assignments
    campaigns = models.ManyToManyField(Campaign, through='BeneficiaryCampaign', 
                                     related_name='beneficiaries')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def __str__(self):
        return f"{self.full_name} ({self.card_number})"
    
    class Meta:
        verbose_name = "Bénéficiaire"
        ordering = ['last_name', 'first_name']


class BeneficiaryCampaign(models.Model):
    """Association bénéficiaire-campagne avec allocations"""
    beneficiary = models.ForeignKey(Beneficiary, on_delete=models.CASCADE)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE)
    
    # Allocation per input type
    assigned_agent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    assigned_site = models.ForeignKey(DistributionSite, on_delete=models.SET_NULL, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['beneficiary', 'campaign']


class BeneficiaryAllocation(models.Model):
    """Allocation d'intrants par bénéficiaire et campagne"""
    beneficiary_campaign = models.ForeignKey(BeneficiaryCampaign, on_delete=models.CASCADE, 
                                           related_name='allocations')
    agricultural_input = models.ForeignKey(AgriculturalInput, on_delete=models.CASCADE)
    
    allocated_quantity = models.DecimalField(max_digits=10, decimal_places=3, 
                                           validators=[MinValueValidator(0)])
    distributed_quantity = models.DecimalField(max_digits=10, decimal_places=3, default=0,
                                             validators=[MinValueValidator(0)])
    
    @property
    def remaining_quantity(self):
        return self.allocated_quantity - self.distributed_quantity
    
    def __str__(self):
        return f"{self.beneficiary_campaign.beneficiary.full_name} - {self.agricultural_input.name}"
    
    class Meta:
        unique_together = ['beneficiary_campaign', 'agricultural_input']


# ==============================================================================
# DISTRIBUTION TRANSACTIONS
# ==============================================================================

class Distribution(models.Model):
    """Enregistrement des distributions effectuées"""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'En attente'
        COMPLETED = 'completed', 'Terminée'
        CANCELLED = 'cancelled', 'Annulée'
        SYNCED = 'synced', 'Synchronisée'
    
    class PaymentMethod(models.TextChoices):
        FREE = 'free', 'Gratuit/Subventionné'
        CASH = 'cash', 'Espèces'
        MOBILE_MONEY = 'mobile_money', 'Mobile Money'
        CREDIT = 'credit', 'Crédit'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Core transaction info
    beneficiary = models.ForeignKey(Beneficiary, on_delete=models.CASCADE, related_name='distributions')
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='distributions_made')
    site = models.ForeignKey(DistributionSite, on_delete=models.CASCADE, related_name='distributions')
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='distributions')
    
    # Transaction details
    distribution_date = models.DateTimeField(default=timezone.now)
    reference_number = models.CharField(max_length=50, unique=True)
    
    # Location data
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Recipient information
    is_representative = models.BooleanField(default=False)
    representative_name = models.CharField(max_length=200, blank=True)
    representative_id_photo = models.ImageField(upload_to='representatives/', null=True, blank=True)
    
    # Payment
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.FREE)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Status and tracking
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    is_synced = models.BooleanField(default=False)
    sync_attempts = models.PositiveIntegerField(default=0)
    last_sync_attempt = models.DateTimeField(null=True, blank=True)
    
    # Signatures/validation
    agent_signature = models.TextField(blank=True, help_text="Signature numérique de l'agent")
    beneficiary_confirmation = models.BooleanField(default=False)
    
    # Notes
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.reference_number} - {self.beneficiary.full_name}"
    
    class Meta:
        verbose_name = "Distribution"
        ordering = ['-distribution_date']


class DistributionItem(models.Model):
    """Détail des intrants distribués"""
    distribution = models.ForeignKey(Distribution, on_delete=models.CASCADE, related_name='items')
    agricultural_input = models.ForeignKey(AgriculturalInput, on_delete=models.CASCADE)
    
    # Quantities
    allocated_quantity = models.DecimalField(max_digits=10, decimal_places=3,
                                           help_text="Quantité à remettre")
    distributed_quantity = models.DecimalField(max_digits=10, decimal_places=3,
                                             help_text="Quantité effectivement remise")
    
    # Pricing
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    subsidy_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Inventory tracking
    inventory_source = models.ForeignKey(Inventory, on_delete=models.CASCADE,
                                       help_text="Source du stock utilisé")
    
    def save(self, *args, **kwargs):
        # Calculate total price
        self.total_price = self.distributed_quantity * self.unit_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.agricultural_input.name} - {self.distributed_quantity} {self.agricultural_input.unit}"
    
    class Meta:
        unique_together = ['distribution', 'agricultural_input']


# ==============================================================================
# PAYMENT RECORDS
# ==============================================================================

class PaymentTransaction(models.Model):
    """Enregistrement des transactions financières"""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'En attente'
        COMPLETED = 'completed', 'Terminée'
        FAILED = 'failed', 'Échouée'
        CANCELLED = 'cancelled', 'Annulée'
        REFUNDED = 'refunded', 'Remboursée'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    distribution = models.OneToOneField(Distribution, on_delete=models.CASCADE, related_name='payment')
    
    # Transaction details
    transaction_id = models.CharField(max_length=100, unique=True)
    external_reference = models.CharField(max_length=100, blank=True, 
                                        help_text="Référence Mobile Money ou autre")
    
    # Amounts
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment method details
    payment_method = models.CharField(max_length=20, choices=Distribution.PaymentMethod.choices)
    mobile_operator = models.CharField(max_length=50, blank=True)
    payer_phone = models.CharField(max_length=20, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    # Receipt
    receipt_number = models.CharField(max_length=50, unique=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.transaction_id} - {self.amount} FCFA"
    
    class Meta:
        verbose_name = "Transaction de paiement"
        ordering = ['-created_at']


# ==============================================================================
# COMMUNICATION SYSTEM
# ==============================================================================

class MessageCampaign(models.Model):
    """Campagnes de communication"""
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Brouillon'
        SCHEDULED = 'scheduled', 'Programmé'
        SENDING = 'sending', 'En cours d\'envoi'
        SENT = 'sent', 'Envoyé'
        CANCELLED = 'cancelled', 'Annulé'
    
    class MessageType(models.TextChoices):
        INFO = 'info', 'Information'
        ALERT = 'alert', 'Alerte'
        REMINDER = 'reminder', 'Rappel'
        WEATHER = 'weather', 'Météo'
        TRAINING = 'training', 'Formation'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    message_type = models.CharField(max_length=20, choices=MessageType.choices)
    
    # Content
    content = models.TextField()
    content_local_language = models.TextField(blank=True)
    
    # Targeting
    target_departments = models.ManyToManyField(Department, blank=True)
    target_communes = models.ManyToManyField(Commune, blank=True)
    target_villages = models.ManyToManyField(Village, blank=True)
    target_gender = models.CharField(max_length=1, choices=Beneficiary.Gender.choices, blank=True)
    target_age_min = models.PositiveIntegerField(null=True, blank=True)
    target_age_max = models.PositiveIntegerField(null=True, blank=True)
    
    # Scheduling
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    
    # Statistics
    total_recipients = models.PositiveIntegerField(default=0)
    successful_deliveries = models.PositiveIntegerField(default=0)
    failed_deliveries = models.PositiveIntegerField(default=0)
    
    # Creator
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_campaigns')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} ({self.status})"
    
    class Meta:
        verbose_name = "Campagne de message"
        ordering = ['-created_at']


class MessageDelivery(models.Model):
    """Suivi des livraisons de messages"""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'En attente'
        SENT = 'sent', 'Envoyé'
        DELIVERED = 'delivered', 'Livré'
        FAILED = 'failed', 'Échec'
        READ = 'read', 'Lu'
    
    campaign = models.ForeignKey(MessageCampaign, on_delete=models.CASCADE, related_name='deliveries')
    beneficiary = models.ForeignKey(Beneficiary, on_delete=models.CASCADE, related_name='messages_received')
    
    # Delivery details
    phone_number = models.CharField(max_length=20)
    delivery_method = models.CharField(max_length=10, choices=[('sms', 'SMS'), ('push', 'Push')])
    
    # Status tracking
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # External references
    external_id = models.CharField(max_length=100, blank=True)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['campaign', 'beneficiary']


# ==============================================================================
# DIGITAL LIBRARY
# ==============================================================================

class DocumentCategory(models.Model):
    """Catégories de documents"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.ImageField(upload_to='doc_categories/', null=True, blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True,
                             related_name='subcategories')
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "Catégorie de document"
        verbose_name_plural = "Catégories de documents"
        ordering = ['name']


class Document(models.Model):
    """Bibliothèque numérique"""
    
    class DocumentType(models.TextChoices):
        GUIDE = 'guide', 'Guide technique'
        MANUAL = 'manual', 'Manuel'
        VIDEO = 'video', 'Vidéo'
        REPORT = 'report', 'Rapport'
        FORM = 'form', 'Formulaire'
        OTHER = 'other', 'Autre'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300)
    description = models.TextField()
    category = models.ForeignKey(DocumentCategory, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DocumentType.choices)
    
    # File information
    file = models.FileField(upload_to='documents/')
    file_size = models.BigIntegerField(null=True, blank=True)
    mime_type = models.CharField(max_length=100)
    thumbnail = models.ImageField(upload_to='thumbnails/', null=True, blank=True)
    
    # Content
    keywords = models.TextField(blank=True, help_text="Mots-clés séparés par des virgules")
    language = models.CharField(max_length=10, default='fr')
    
    # Access control
    is_public = models.BooleanField(default=True)
    allowed_roles = models.CharField(max_length=200, blank=True, 
                                   help_text="Rôles autorisés (séparés par des virgules)")
    
    # Metadata
    author = models.CharField(max_length=200, blank=True)
    version = models.CharField(max_length=20, default='1.0')
    publication_date = models.DateField(null=True, blank=True)
    
    # Statistics
    download_count = models.PositiveIntegerField(default=0)
    view_count = models.PositiveIntegerField(default=0)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_documents')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-created_at']


# ==============================================================================
# SYNC AND AUDIT TRAIL
# ==============================================================================

class SyncLog(models.Model):
    """Journal de synchronisation"""
    
    class SyncType(models.TextChoices):
        MANUAL = 'manual', 'Manuel'
        AUTOMATIC = 'automatic', 'Automatique'
        FORCED = 'forced', 'Forcé'
    
    class Status(models.TextChoices):
        SUCCESS = 'success', 'Succès'
        PARTIAL = 'partial', 'Partiel'
        FAILED = 'failed', 'Échec'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sync_logs')
    sync_type = models.CharField(max_length=20, choices=SyncType.choices)
    
    # Sync details
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices)
    
    # Statistics
    records_sent = models.PositiveIntegerField(default=0)
    records_received = models.PositiveIntegerField(default=0)
    errors_count = models.PositiveIntegerField(default=0)
    
    # Details
    error_details = models.TextField(blank=True)
    sync_summary = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"Sync {self.started_at} - {self.status}"
    
    class Meta:
        ordering = ['-started_at']


class AuditTrail(models.Model):
    """Piste d'audit pour traçabilité"""
    
    class Action(models.TextChoices):
        CREATE = 'create', 'Création'
        UPDATE = 'update', 'Modification'
        DELETE = 'delete', 'Suppression'
        LOGIN = 'login', 'Connexion'
        LOGOUT = 'logout', 'Déconnexion'
        SYNC = 'sync', 'Synchronisation'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=20, choices=Action.choices)
    
    # Object tracking
    content_type = models.CharField(max_length=100, blank=True)
    object_id = models.CharField(max_length=100, blank=True)
    object_repr = models.CharField(max_length=200, blank=True)
    
    # Change details
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Location
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.created_at}"
    
    class Meta:
        ordering = ['-created_at']