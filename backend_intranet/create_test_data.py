# Créez un fichier create_test_data.py dans manage.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'intranet.settings')
django.setup()

from intra.models import *

def create_test_data():
    # Département
    dep, created = Department.objects.get_or_create(
        name="Gbêkê", 
        code="GBK",
        defaults={'name': 'Gbêkê', 'code': 'GBK'}
    )
    
    # Commune
    commune, created = Commune.objects.get_or_create(
        name="Bouaké",
        department=dep,
        defaults={'name': 'Bouaké', 'code': 'BKE', 'department': dep}
    )
    
    # Village
    village, created = Village.objects.get_or_create(
        name="Kôkô",
        commune=commune,
        defaults={'name': 'Kôkô', 'commune': commune}
    )
    
    # Site de distribution
    site, created = DistributionSite.objects.get_or_create(
        name="Centre Agricole de Bouaké",
        village=village,
        defaults={
            'name': 'Centre Agricole de Bouaké',
            'site_type': DistributionSite.SiteType.COOPERATIVE,
            'village': village,
            'latitude': 7.6900,
            'longitude': -5.0300,
            'capacity': 5000
        }
    )
    
    # Catégorie d'intrant
    category, created = InputCategory.objects.get_or_create(
        name="Semences",
        defaults={'name': 'Semences', 'description': 'Semences agricoles'}
    )
    
    # Intrant agricole
    input_obj, created = AgriculturalInput.objects.get_or_create(
        name="Semence de maïs",
        category=category,
        defaults={
            'name': 'Semence de maïs',
            'category': category,
            'brand': 'SemCI',
            'variety': 'Maïs blanc',
            'unit': AgriculturalInput.Unit.KG,
            'package_size': 25,
            'unit_price': 1500,
            'subsidized_price': 500
        }
    )
    
    # Bénéficiaire
    beneficiary, created = Beneficiary.objects.get_or_create(
        card_number="BEN20240001",
        defaults={
            'first_name': 'Kouamé',
            'last_name': 'Konan',
            'gender': Beneficiary.Gender.MALE,
            'village': village,
            'card_number': 'BEN20240001',
            'phone': '22501234567'
        }
    )
    
    print("Données de test créées avec succès!")

if __name__ == '__main__':
    create_test_data()