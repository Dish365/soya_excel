from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime, timedelta
import random
from decimal import Decimal

# Import all the updated models
from manager.models import Manager, SoybeanMealProduct, SupplyInventory, WeeklyDistributionPlan, KPIMetrics
from clients.models import Farmer, FeedStorage, Order
from driver.models import Driver, Vehicle, Delivery, DeliveryItem, DeliveryPerformanceMetrics
from route.models import Route, RouteStop, WeeklyRoutePerformance


class Command(BaseCommand):
    help = 'Creates realistic mock data for Soya Excel operations'

    def handle(self, *args, **options):
        self.stdout.write('Creating Soya Excel mock data...\n')
        
        # Create users and managers
        managers = self.create_managers()
        
        # Create soybean meal products
        products = self.create_soybean_products()
        
        # Create supply inventory
        self.create_supply_inventory(products)
        
        # Create farmers (clients) with realistic distribution
        farmers = self.create_farmers()
        
        # Create vehicles and drivers
        vehicles, drivers = self.create_vehicles_and_drivers()
        
        # Create realistic orders
        orders = self.create_realistic_orders(farmers, products, managers[0])
        
        # Create weekly distribution plans
        self.create_weekly_plans(managers[0], orders)
        
        # Create routes and deliveries
        routes = self.create_routes_with_kpi_tracking(managers[0].user, farmers, orders, vehicles, drivers)
        
        # Create KPI metrics
        self.create_kpi_metrics()
        
        self.stdout.write(self.style.SUCCESS('\nSoya Excel mock data created successfully!'))
        self.print_summary()

    def create_managers(self):
        """Create Soya Excel managers"""
        managers = []
        
        # Create main manager if not exists
        try:
            user = User.objects.get(username='soya_manager')
            manager = Manager.objects.get(user=user)
            managers.append(manager)
        except (User.DoesNotExist, Manager.DoesNotExist):
            user = User.objects.create_user(
                username='soya_manager',
                password='SoyaExcel_2024',
                email='manager@soyaexcel.com',
                first_name='Pierre',
                last_name='Dubois'
            )
            manager = Manager.objects.create(
                user=user,
                employee_id='SE-MGR001',
                full_name='Pierre Dubois',
                phone_number='+15141234567',
                email='manager@soyaexcel.com',
                can_approve_plans=True,
                can_manage_contracts=True,
                managed_provinces=['QC', 'ON', 'NB']
            )
            managers.append(manager)
            self.stdout.write(f'Created manager: {manager.full_name}')
        
        return managers

    def create_supply_inventory(self, products):
        """Create supply inventory for soybean meal products"""
        for product in products:
            inventory, created = SupplyInventory.objects.get_or_create(
                product=product,
                silo_number=f'SILO-{product.product_code[-2:]}',
                defaults={
                    'current_stock': Decimal(random.randint(500, 2000)),
                    'minimum_stock': Decimal(200),
                    'maximum_stock': Decimal(3000),
                    'storage_location': f'Silo {product.product_code[-2:]}',
                    'current_batch_number': f'BATCH{random.randint(1000, 9999)}',
                    'batch_received_date': timezone.now() - timedelta(days=random.randint(1, 15)),
                    'quality_grade': random.choice(['A', 'B', 'Premium']),
                    'alix_inventory_id': f'ALIX-{product.product_code}'
                }
            )
            if created:
                self.stdout.write(f'Created inventory: {inventory}')
    
    def create_weekly_plans(self, manager, orders):
        """Create weekly distribution plans"""
        # Current week and next 3 weeks
        for week_offset in range(4):
            week_start = timezone.now().date() + timedelta(weeks=week_offset)
            week_start = week_start - timedelta(days=week_start.weekday())  # Monday
            
            plan, created = WeeklyDistributionPlan.objects.get_or_create(
                planning_week=f'week_{week_offset}' if week_offset > 0 else 'current',
                week_start_date=week_start,
                defaults={
                    'plan_name': f'Week Plan {week_start.strftime("%Y-W%V")}',
                    'week_end_date': week_start + timedelta(days=6),
                    'total_quantity_planned': Decimal(random.randint(200, 800)),
                    'total_contract_deliveries': Decimal(random.randint(100, 400)),
                    'total_on_demand_deliveries': Decimal(random.randint(50, 200)),
                    'planned_routes': random.randint(5, 15),
                    'estimated_total_km': Decimal(random.randint(800, 2500)),
                    'forecasted_demand': Decimal(random.randint(180, 750)),
                    'status': 'approved' if week_offset <= 1 else 'draft',
                    'created_by': manager,
                    'planned_on_tuesday': True,
                    'finalized_by_friday': week_offset <= 1
                }
            )
            if created:
                self.stdout.write(f'Created weekly plan: {plan.plan_name}')
    
    def create_routes_with_kpi_tracking(self, created_by, farmers, orders, vehicles, drivers):
        """Create routes with KPI tracking"""
        routes = []
        
        for day in range(7):  # Next 7 days
            route_date = timezone.now().date() + timedelta(days=day)
            
            # Select vehicle and driver
            vehicle = random.choice(vehicles)
            available_drivers = [d for d in drivers if vehicle.vehicle_type in d.can_drive_vehicle_types]
            driver = random.choice(available_drivers) if available_drivers else drivers[0]
            
            route = Route.objects.create(
                name=f'Route {route_date.strftime("%Y-%m-%d")} - {vehicle.vehicle_number}',
                date=route_date,
                route_type=random.choice(['contract', 'mixed', 'on_demand']),
                status='active' if day == 0 else 'planned',
                planned_during_week=f'{timezone.now().year}-W{timezone.now().isocalendar()[1]}',
                total_distance=Decimal(random.randint(120, 350)),
                estimated_duration=random.randint(240, 480),
                assigned_vehicle_type=vehicle.vehicle_type,
                total_capacity_used=Decimal(random.uniform(20.0, float(vehicle.capacity_tonnes))),
                created_by=created_by
            )
            
            # Add realistic performance data for completed routes
            if day == 0:  # Today's route
                route.actual_distance = route.total_distance * Decimal(random.uniform(0.95, 1.15))
                route.actual_duration = int(route.estimated_duration * random.uniform(0.9, 1.2))
                route.fuel_consumed = route.actual_distance * Decimal('0.35')  # 35L/100km
                route.co2_emissions = route.fuel_consumed * Decimal('2.31')  # CO2 factor
                route.km_per_tonne = route.actual_distance / route.total_capacity_used
                route.save()
            
            routes.append(route)
            
            # Create delivery
            delivery = Delivery.objects.create(
                driver=driver,
                vehicle=vehicle,
                route=route,
                status='in_progress' if day == 0 else 'assigned',
                total_quantity_delivered=route.total_capacity_used,
                actual_distance_km=route.actual_distance,
                actual_duration_minutes=route.actual_duration,
                co2_emissions_kg=route.co2_emissions
            )
            
        self.stdout.write(f'Created {len(routes)} routes with KPI tracking')
        return routes
    
    def create_kpi_metrics(self):
        """Create KPI metrics for different product types"""
        kpi_types = ['km_per_tonne_trituro_44', 'km_per_tonne_dairy_trituro', 'km_per_tonne_oil']
        
        for kpi_type in kpi_types:
            # Weekly metrics
            KPIMetrics.objects.create(
                metric_type=kpi_type,
                period_type='weekly',
                period_start=timezone.now().date() - timedelta(days=7),
                period_end=timezone.now().date(),
                metric_value=Decimal(random.uniform(8.5, 15.2)),
                target_value=Decimal('12.0'),
                total_distance_km=Decimal(random.randint(1200, 2800)),
                total_tonnes_delivered=Decimal(random.randint(150, 350)),
                number_of_deliveries=random.randint(15, 35),
                trend_direction='improving'
            )
            
            # Monthly metrics
            KPIMetrics.objects.create(
                metric_type=kpi_type,
                period_type='monthly',
                period_start=timezone.now().date().replace(day=1),
                period_end=timezone.now().date(),
                metric_value=Decimal(random.uniform(9.2, 14.8)),
                target_value=Decimal('11.5'),
                total_distance_km=Decimal(random.randint(4500, 8500)),
                total_tonnes_delivered=Decimal(random.randint(600, 1200)),
                number_of_deliveries=random.randint(60, 120),
                trend_direction=random.choice(['improving', 'stable', 'declining'])
            )
        
        self.stdout.write('Created KPI metrics for all product types')

    def print_summary(self):
        """Print summary of created Soya Excel data"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write('SOYA EXCEL MOCK DATA SUMMARY')
        self.stdout.write('='*60)
        self.stdout.write(f'Managers: {Manager.objects.count()}')
        self.stdout.write(f'Farmers (Clients): {Farmer.objects.count()}')
        self.stdout.write(f'  - Quebec: {Farmer.objects.filter(province="QC").count()}')
        self.stdout.write(f'  - Ontario: {Farmer.objects.filter(province="ON").count()}')
        self.stdout.write(f'  - USA: {Farmer.objects.filter(province="USD").count()}')
        self.stdout.write(f'  - Other: {Farmer.objects.exclude(province__in=["QC", "ON", "USD"]).count()}')
        self.stdout.write(f'Vehicles: {Vehicle.objects.count()}')
        self.stdout.write(f'Drivers: {Driver.objects.count()}')
        self.stdout.write(f'Soybean Products: {SoybeanMealProduct.objects.count()}')
        self.stdout.write(f'Supply Inventory: {SupplyInventory.objects.count()}')
        self.stdout.write(f'Orders: {Order.objects.count()}')
        self.stdout.write(f'Routes: {Route.objects.count()}')
        self.stdout.write(f'Weekly Plans: {WeeklyDistributionPlan.objects.count()}')
        self.stdout.write(f'KPI Metrics: {KPIMetrics.objects.count()}')
        self.stdout.write('='*60)
        
        self.stdout.write('\nLogin Credentials:')
        self.stdout.write('Manager: soya_manager')
        self.stdout.write('Drivers: driver_martin_bulk, driver_sophie_tank, etc.')
        self.stdout.write('Password for all: SoyaExcel_2024')
        self.stdout.write('\nKey Features:')
        self.stdout.write('• Real Canadian province distribution')
        self.stdout.write('• Soybean meal products (not generic feed)')
        self.stdout.write('• Realistic vehicle fleet (bulk trucks, tank trucks)')
        self.stdout.write('• BinConnect sensor integration')
        self.stdout.write('• Weekly planning cycles (Tuesday-Friday)')
        self.stdout.write('• KM/TM KPI tracking by product type')
        self.stdout.write('• Emergency alert system (1 tm or 80%)')
        self.stdout.write('• Integration points for ZOHO CRM and ALIX')
        
    def create_farmers(self):
        """Create farmers representing Soya Excel's client distribution"""
        farmers = []
        
        # Real distribution: 151 QC, 13 ON, 7 USD, 2 NB, 1 BC, 1 Spain
        farmer_data = [
            # Quebec clients (dairy trituro priority)
            {'name': 'Ferme Laitière Beauce', 'address': '123 Route Rurale, Beauce, QC', 'province': 'QC', 'client_type': 'dairy_trituro', 'lat': 46.2382, 'lng': -70.9492, 'capacity': 25.0, 'monthly_usage': 15.5},
            {'name': 'Producteurs Laitiers St-Jean', 'address': '456 Chemin des Fermes, St-Jean, QC', 'province': 'QC', 'client_type': 'dairy_trituro', 'lat': 45.3077, 'lng': -73.2627, 'capacity': 40.0, 'monthly_usage': 22.3},
            {'name': 'Ferme Avicole Montérégie', 'address': '789 Avenue Agricole, Montérégie, QC', 'province': 'QC', 'client_type': 'trituro_44', 'lat': 45.4442, 'lng': -73.2498, 'capacity': 60.0, 'monthly_usage': 35.2},
            
            # Ontario clients 
            {'name': 'Ontario Dairy Cooperative', 'address': '321 Farm Road, London, ON', 'province': 'ON', 'client_type': 'dairy_trituro', 'lat': 42.9849, 'lng': -81.2453, 'capacity': 80.0, 'monthly_usage': 45.8},
            {'name': 'Southwestern Feed Mill', 'address': '654 Agricultural Dr, Windsor, ON', 'province': 'ON', 'client_type': 'trituro_44', 'lat': 42.3149, 'lng': -83.0364, 'capacity': 35.0, 'monthly_usage': 28.1},
            
            # US clients
            {'name': 'Vermont Premium Dairy', 'address': '987 Dairy Lane, Burlington, VT', 'province': 'USD', 'client_type': 'dairy_trituro', 'lat': 44.4759, 'lng': -73.2121, 'capacity': 50.0, 'monthly_usage': 32.5},
            {'name': 'Northeast Feed Solutions', 'address': '147 Industrial Ave, Albany, NY', 'province': 'USD', 'client_type': 'oil', 'lat': 42.6526, 'lng': -73.7562, 'capacity': 45.0, 'monthly_usage': 18.7},
            
            # New Brunswick
            {'name': 'Maritime Dairy Farms', 'address': '258 Coastal Road, Moncton, NB', 'province': 'NB', 'client_type': 'dairy_trituro', 'lat': 46.0878, 'lng': -64.7782, 'capacity': 30.0, 'monthly_usage': 19.2},
            
            # British Columbia
            {'name': 'Pacific Coast Feed Co', 'address': '369 Valley View, Vancouver, BC', 'province': 'BC', 'client_type': 'oil', 'lat': 49.2827, 'lng': -123.1207, 'capacity': 55.0, 'monthly_usage': 25.6},
            
            # Spain
            {'name': 'Cooperativa Ganadera Española', 'address': 'Calle Agricultura 123, Barcelona, Spain', 'province': 'SPAIN', 'client_type': 'trituro_44', 'lat': 41.3851, 'lng': 2.1734, 'capacity': 75.0, 'monthly_usage': 42.3},
        ]
        
        for i, data in enumerate(farmer_data):
            farmer, created = Farmer.objects.get_or_create(
                name=data['name'],
                defaults={
                    'phone_number': f'+1{random.randint(4000000000, 9999999999)}' if data['province'] != 'SPAIN' else f'+34{random.randint(600000000, 799999999)}',
                    'email': f"{data['name'].lower().replace(' ', '_').replace('é', 'e').replace('ñ', 'n')}@farm.com",
                    'address': data['address'],
                    'latitude': data['lat'],
                    'longitude': data['lng'],
                    'province': data['province'],
                    'client_type': data['client_type'],
                    'priority': 'high' if data['client_type'] == 'dairy_trituro' else 'medium',
                    'has_contract': random.choice([True, False]),
                    'historical_monthly_usage': Decimal(str(data['monthly_usage'])),
                    'is_active': True
                }
            )
            farmers.append(farmer)
            
            # Create realistic silo storage (3-80 tm range)
            feed_storage, created = FeedStorage.objects.get_or_create(
                farmer=farmer,
                defaults={
                    'capacity': Decimal(str(data['capacity'])),
                    'current_quantity': Decimal(str(random.uniform(0.5, data['capacity'] * 0.8))),
                    'sensor_type': 'binconnect',
                    'sensor_id': f'BINCONNECT{i+1:03d}',
                    'low_stock_threshold_tonnes': Decimal('1.0'),
                    'low_stock_threshold_percentage': Decimal('80.0'),
                    'reporting_frequency': 60,  # BinConnect reports hourly
                    'is_connected': True
                }
            )
            
            if created:
                self.stdout.write(f'Created farmer: {farmer.name} ({farmer.province}) - {data["capacity"]} tm silo')
        
        return farmers

    def create_vehicles_and_drivers(self):
        """Create Soya Excel's specific fleet"""
        # Create vehicles first
        vehicles = []
        vehicle_data = [
            {'number': 'SE-BULK-001', 'type': 'bulk_truck', 'capacity': 38.0, 'fuel_efficiency': 35.0},
            {'number': 'SE-BULK-002', 'type': 'bulk_truck', 'capacity': 38.0, 'fuel_efficiency': 33.5},
            {'number': 'SE-TANK-OIL-001', 'type': 'tank_oil', 'capacity': 28.0, 'fuel_efficiency': 30.0},
            {'number': 'SE-TANK-OIL-002', 'type': 'tank_oil', 'capacity': 28.0, 'fuel_efficiency': 31.2},
            {'number': 'SE-TANK-BLOWER-001', 'type': 'tank_blower', 'capacity': 25.0, 'fuel_efficiency': 32.1},
            {'number': 'SE-BOX-001', 'type': 'box_truck', 'capacity': 5.0, 'fuel_efficiency': 12.5},  # For tote bags
        ]
        
        for data in vehicle_data:
            vehicle, created = Vehicle.objects.get_or_create(
                vehicle_number=data['number'],
                defaults={
                    'vehicle_type': data['type'],
                    'capacity_tonnes': Decimal(str(data['capacity'])),
                    'fuel_efficiency_l_per_100km': Decimal(str(data['fuel_efficiency'])),
                    'has_gps_tracking': True,
                    'electronic_log_device': f"ELD_{data['number'][-3:]}",
                    'status': 'active'
                }
            )
            vehicles.append(vehicle)
            if created:
                self.stdout.write(f'Created vehicle: {vehicle.vehicle_number} ({vehicle.get_vehicle_type_display()})')
        
        # Create drivers
        drivers = []
        driver_data = [
            {'username': 'driver_martin_bulk', 'full_name': 'Martin Tremblay', 'staff_id': 'SE-DRV001', 'vehicle_types': ['bulk_truck']},
            {'username': 'driver_sophie_tank', 'full_name': 'Sophie Dubois', 'staff_id': 'SE-DRV002', 'vehicle_types': ['tank_oil', 'tank_blower']},
            {'username': 'driver_jean_multi', 'full_name': 'Jean-Claude Morin', 'staff_id': 'SE-DRV003', 'vehicle_types': ['bulk_truck', 'tank_oil']},
            {'username': 'driver_marie_box', 'full_name': 'Marie Blanchard', 'staff_id': 'SE-DRV004', 'vehicle_types': ['box_truck', 'tank_blower']},
        ]
        
        for data in driver_data:
            try:
                user = User.objects.get(username=data['username'])
            except User.DoesNotExist:
                user = User.objects.create_user(
                    username=data['username'],
                    password='SoyaExcel_2024',
                    email=f"{data['username']}@soyaexcel.com",
                    first_name=data['full_name'].split()[0],
                    last_name=' '.join(data['full_name'].split()[1:])
                )
            
            # Find suitable vehicle for driver
            suitable_vehicle = None
            for vehicle in vehicles:
                if vehicle.vehicle_type in data['vehicle_types'] and not vehicle.assigned_drivers.exists():
                    suitable_vehicle = vehicle
                    break
            
            driver, created = Driver.objects.get_or_create(
                user=user,
                defaults={
                    'staff_id': data['staff_id'],
                    'full_name': data['full_name'],
                    'phone_number': f'+1{random.randint(4000000000, 9999999999)}',
                    'license_number': f'QC{random.randint(1000000, 9999999)}',
                    'assigned_vehicle': suitable_vehicle,
                    'can_drive_vehicle_types': data['vehicle_types']
                }
            )
            drivers.append(driver)
            if created:
                self.stdout.write(f'Created driver: {driver.full_name} - {driver.assigned_vehicle}')
        
        return vehicles, drivers

    def create_soybean_products(self):
        """Create Soya Excel's soybean meal products"""
        products = []
        product_data = [
            {'name': 'Soybean Meal 44% - Canadian', 'code': 'SBM44-CA', 'type': 'soybean_meal_44', 'protein': 44.0, 'origin': 'canada', 'price': 485.00},
            {'name': 'Soybean Meal 48% - US Premium', 'code': 'SBM48-US', 'type': 'soybean_meal_48', 'protein': 48.0, 'origin': 'usa', 'price': 525.00},
            {'name': 'Soybean Hulls - Premium Grade', 'code': 'SBH-PG', 'type': 'soybean_hulls', 'protein': 12.0, 'origin': 'canada', 'price': 285.00},
            {'name': 'Soybean Oil - Refined', 'code': 'SBO-REF', 'type': 'soybean_oil', 'protein': 0.0, 'origin': 'canada', 'price': 1250.00},
            {'name': 'Dairy Trituro Blend', 'code': 'DTB-SPEC', 'type': 'specialty_blend', 'protein': 46.0, 'origin': 'canada', 'price': 510.00},
        ]
        
        for data in product_data:
            product, created = SoybeanMealProduct.objects.get_or_create(
                product_code=data['code'],
                defaults={
                    'product_name': data['name'],
                    'product_type': data['type'],
                    'protein_percentage': Decimal(str(data['protein'])),
                    'primary_origin': data['origin'],
                    'base_price_per_tonne': Decimal(str(data['price'])),
                    'sustainability_certified': random.choice([True, False]),
                    'is_active': True
                }
            )
            products.append(product)
            if created:
                self.stdout.write(f'Created product: {product.product_name}')
        
        return products

    def create_realistic_orders(self, farmers, products, manager):
        """Create orders with realistic Soya Excel patterns"""
        orders = []
        
        # Contract deliveries (planned in advance)
        contract_farmers = [f for f in farmers if f.has_contract]
        for farmer in contract_farmers[:5]:  # First 5 contract farmers
            for week_offset in range(4):  # Next 4 weeks
                order = Order.objects.create(
                    farmer=farmer,
                    order_number=f'ORD{timezone.now().year}{len(orders)+1:05d}',
                    quantity=Decimal(str(random.uniform(15.0, float(farmer.historical_monthly_usage)))),
                    delivery_method='bulk_38tm' if farmer.client_type != 'oil' else 'tank_compartment',
                    order_type='contract',
                    status='confirmed',
                    planning_week=f'{timezone.now().year}-W{timezone.now().isocalendar()[1] + week_offset}',
                    forecast_based=True,
                    expected_delivery_date=timezone.now() + timedelta(weeks=week_offset, days=random.randint(1, 5)),
                    created_by=manager.user
                )
                orders.append(order)
        
        # Emergency/low stock orders
        low_stock_farmers = [f for f in farmers if hasattr(f, 'feed_storage') and f.feed_storage.is_emergency_level]
        for farmer in low_stock_farmers[:3]:
            order = Order.objects.create(
                farmer=farmer,
                order_number=f'ORD{timezone.now().year}{len(orders)+1:05d}',
                quantity=Decimal(str(min(38.0, float(farmer.feed_storage.capacity) * 0.8))),
                delivery_method='bulk_38tm',
                order_type='emergency',
                status='pending',
                expected_delivery_date=timezone.now() + timedelta(days=1),
                created_by=manager.user
            )
            orders.append(order)
        
        self.stdout.write(f'Created {len(orders)} realistic orders')
        return orders 