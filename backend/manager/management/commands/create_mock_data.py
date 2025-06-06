from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime, timedelta
import random
from decimal import Decimal

from manager.models import Manager, SupplyInventory, SupplyTransaction, DistributionPlan
from clients.models import Farmer, FeedStorage, Order
from driver.models import Driver, Delivery, DeliveryItem
from route.models import Route, RouteStop


class Command(BaseCommand):
    help = 'Creates mock data for testing the application'

    def handle(self, *args, **options):
        self.stdout.write('Creating mock data...\n')
        
        # Create users and managers
        managers = self.create_managers()
        
        # Create farmers with feed storage
        farmers = self.create_farmers()
        
        # Create drivers
        drivers = self.create_drivers()
        
        # Create supply inventory
        self.create_supply_inventory()
        
        # Create orders
        orders = self.create_orders(farmers, managers[0].user)
        
        # Create routes
        routes = self.create_routes(managers[0].user, farmers, orders)
        
        # Create deliveries
        self.create_deliveries(drivers, routes, orders)
        
        # Create distribution plans
        self.create_distribution_plans(managers[0])
        
        self.stdout.write(self.style.SUCCESS('\nMock data created successfully!'))
        self.print_summary()

    def create_managers(self):
        """Create manager users"""
        managers = []
        
        # Create test manager if not exists
        try:
            user = User.objects.get(username='testmanager')
            manager = Manager.objects.get(user=user)
            managers.append(manager)
            self.stdout.write(f'Using existing manager: {manager.full_name}')
        except (User.DoesNotExist, Manager.DoesNotExist):
            pass
        
        # Create additional managers
        manager_data = [
            {'username': 'johndoe', 'full_name': 'John Doe', 'employee_id': 'EMP002'},
            {'username': 'janesmith', 'full_name': 'Jane Smith', 'employee_id': 'EMP003'},
        ]
        
        for data in manager_data:
            try:
                user = User.objects.get(username=data['username'])
            except User.DoesNotExist:
                user = User.objects.create_user(
                    username=data['username'],
                    password='Pass_1234',
                    email=f"{data['username']}@soyaexcel.com",
                    first_name=data['full_name'].split()[0],
                    last_name=data['full_name'].split()[1]
                )
            
            manager, created = Manager.objects.get_or_create(
                user=user,
                defaults={
                    'employee_id': data['employee_id'],
                    'full_name': data['full_name'],
                    'phone_number': f'+123456789{random.randint(0, 9)}',
                    'email': user.email
                }
            )
            managers.append(manager)
            if created:
                self.stdout.write(f'Created manager: {manager.full_name}')
        
        return managers

    def create_farmers(self):
        """Create farmers with feed storage"""
        farmers = []
        
        farmer_data = [
            {'name': 'Green Valley Farm', 'address': '123 Rural Road, Countryside', 'lat': -1.2921, 'lng': 36.8219},
            {'name': 'Sunrise Poultry', 'address': '456 Farm Lane, Hillside', 'lat': -1.3021, 'lng': 36.8319},
            {'name': 'Happy Chickens Ltd', 'address': '789 Country Path, Valley View', 'lat': -1.2721, 'lng': 36.8119},
            {'name': 'Fresh Eggs Farm', 'address': '321 Agricultural Ave, Farmtown', 'lat': -1.3121, 'lng': 36.8419},
            {'name': 'Golden Harvest', 'address': '654 Harvest Road, Greenfields', 'lat': -1.2821, 'lng': 36.8019},
            {'name': 'Blue Sky Ranch', 'address': '987 Ranch Drive, Highlands', 'lat': -1.3221, 'lng': 36.8519},
            {'name': 'Meadow Fresh Farm', 'address': '147 Meadow Lane, Riverside', 'lat': -1.2621, 'lng': 36.7919},
            {'name': 'Valley View Poultry', 'address': '258 Valley Road, Hillcrest', 'lat': -1.3321, 'lng': 36.8619},
            {'name': 'Organic Acres', 'address': '369 Organic Way, Greenville', 'lat': -1.2521, 'lng': 36.7819},
            {'name': 'Country Pride Farm', 'address': '741 Pride Avenue, Farmville', 'lat': -1.3421, 'lng': 36.8719},
        ]
        
        for i, data in enumerate(farmer_data):
            farmer, created = Farmer.objects.get_or_create(
                name=data['name'],
                defaults={
                    'phone_number': f'+2547{random.randint(10000000, 99999999)}',
                    'email': f"{data['name'].lower().replace(' ', '_')}@farm.com",
                    'address': data['address'],
                    'latitude': data['lat'],
                    'longitude': data['lng'],
                    'is_active': True
                }
            )
            farmers.append(farmer)
            
            # Create feed storage
            feed_storage, created = FeedStorage.objects.get_or_create(
                farmer=farmer,
                defaults={
                    'capacity': Decimal(random.randint(500, 2000)),
                    'current_quantity': Decimal(random.randint(50, 400)),
                    'sensor_id': f'SENSOR{i+1:03d}',
                    'low_stock_threshold': Decimal('20.0')
                }
            )
            
            if created:
                self.stdout.write(f'Created farmer: {farmer.name} with feed storage')
        
        return farmers

    def create_drivers(self):
        """Create drivers"""
        drivers = []
        
        driver_data = [
            {'username': 'driver1', 'full_name': 'Michael Johnson', 'staff_id': 'DRV001'},
            {'username': 'driver2', 'full_name': 'Sarah Williams', 'staff_id': 'DRV002'},
            {'username': 'driver3', 'full_name': 'David Brown', 'staff_id': 'DRV003'},
            {'username': 'driver4', 'full_name': 'Emma Davis', 'staff_id': 'DRV004'},
            {'username': 'driver5', 'full_name': 'James Wilson', 'staff_id': 'DRV005'},
        ]
        
        for data in driver_data:
            try:
                user = User.objects.get(username=data['username'])
            except User.DoesNotExist:
                user = User.objects.create_user(
                    username=data['username'],
                    password='Pass_1234',
                    email=f"{data['username']}@soyaexcel.com",
                    first_name=data['full_name'].split()[0],
                    last_name=data['full_name'].split()[1]
                )
            
            driver, created = Driver.objects.get_or_create(
                user=user,
                defaults={
                    'staff_id': data['staff_id'],
                    'full_name': data['full_name'],
                    'phone_number': f'+2547{random.randint(10000000, 99999999)}',
                    'license_number': f'DL{random.randint(100000, 999999)}',
                    'vehicle_number': f'KCA {random.randint(100, 999)}{random.choice(["A", "B", "C", "D"])}',
                    'is_available': random.choice([True, True, True, False])  # 75% available
                }
            )
            drivers.append(driver)
            if created:
                self.stdout.write(f'Created driver: {driver.full_name}')
        
        return drivers

    def create_supply_inventory(self):
        """Create supply inventory items"""
        products = [
            {'name': 'Layer Feed - Starter', 'code': 'LFS001', 'price': 45.50},
            {'name': 'Layer Feed - Grower', 'code': 'LFG001', 'price': 42.00},
            {'name': 'Layer Feed - Finisher', 'code': 'LFF001', 'price': 40.00},
            {'name': 'Broiler Feed - Starter', 'code': 'BFS001', 'price': 48.00},
            {'name': 'Broiler Feed - Finisher', 'code': 'BFF001', 'price': 44.00},
            {'name': 'Chick Mash', 'code': 'CM001', 'price': 50.00},
            {'name': 'Growers Mash', 'code': 'GM001', 'price': 38.00},
            {'name': 'Layers Mash', 'code': 'LM001', 'price': 36.00},
        ]
        
        for product in products:
            inventory, created = SupplyInventory.objects.get_or_create(
                product_code=product['code'],
                defaults={
                    'product_name': product['name'],
                    'current_stock': Decimal(random.randint(1000, 5000)),
                    'minimum_stock': Decimal(500),
                    'maximum_stock': Decimal(10000),
                    'unit_price': Decimal(str(product['price'])),
                    'last_restocked': timezone.now() - timedelta(days=random.randint(1, 30))
                }
            )
            if created:
                self.stdout.write(f'Created inventory item: {inventory.product_name}')

    def create_orders(self, farmers, created_by):
        """Create orders for farmers"""
        orders = []
        statuses = ['pending', 'confirmed', 'in_transit', 'delivered', 'pending', 'confirmed']
        
        for i in range(30):  # Create 30 orders
            farmer = random.choice(farmers)
            order_date = timezone.now() - timedelta(days=random.randint(0, 30))
            
            order = Order.objects.create(
                farmer=farmer,
                order_number=f'ORD{timezone.now().year}{i+1:05d}',
                quantity=Decimal(random.randint(100, 1000)),
                status=random.choice(statuses),
                order_date=order_date,
                expected_delivery_date=order_date + timedelta(days=random.randint(1, 7)),
                notes=f'Order for {farmer.name}',
                created_by=created_by
            )
            
            # Set actual delivery date for delivered orders
            if order.status == 'delivered':
                order.actual_delivery_date = order.expected_delivery_date
                order.save()
            
            orders.append(order)
        
        self.stdout.write(f'Created {len(orders)} orders')
        return orders

    def create_routes(self, created_by, farmers, orders):
        """Create delivery routes"""
        routes = []
        
        # Create routes for the next 7 days
        for day in range(7):
            route_date = timezone.now().date() + timedelta(days=day)
            
            route = Route.objects.create(
                name=f'Route {route_date.strftime("%Y-%m-%d")}',
                date=route_date,
                status='planned' if day > 0 else 'active',
                created_by=created_by,
                total_distance=Decimal(random.randint(50, 200)),
                estimated_duration=random.randint(120, 480),
            )
            
            # Add stops to the route
            route_orders = random.sample([o for o in orders if o.status in ['confirmed', 'in_transit']], 
                                       min(random.randint(3, 8), len([o for o in orders if o.status in ['confirmed', 'in_transit']])))
            
            for seq, order in enumerate(route_orders, 1):
                RouteStop.objects.create(
                    route=route,
                    farmer=order.farmer,
                    order=order,
                    sequence_number=seq,
                    estimated_arrival_time=datetime.combine(route_date, datetime.min.time()) + timedelta(hours=8 + seq),
                    distance_from_previous=Decimal(random.randint(5, 30)) if seq > 1 else Decimal(0),
                    duration_from_previous=random.randint(10, 45) if seq > 1 else 0,
                )
            
            routes.append(route)
        
        self.stdout.write(f'Created {len(routes)} routes')
        return routes

    def create_deliveries(self, drivers, routes, orders):
        """Create deliveries for routes"""
        deliveries = []
        
        for route in routes:
            if route.status == 'active' and route.stops.exists():
                driver = random.choice([d for d in drivers if d.is_available])
                
                delivery = Delivery.objects.create(
                    driver=driver,
                    route=route,
                    status='in_progress' if route.date == timezone.now().date() else 'assigned',
                    start_time=timezone.now() if route.date == timezone.now().date() else None,
                )
                
                # Create delivery items for each stop
                for stop in route.stops.all():
                    DeliveryItem.objects.create(
                        delivery=delivery,
                        order=stop.order,
                        farmer=stop.farmer,
                        quantity=stop.order.quantity,
                        delivered_quantity=stop.order.quantity if delivery.status == 'completed' else None,
                    )
                
                deliveries.append(delivery)
        
        self.stdout.write(f'Created {len(deliveries)} deliveries')
        return deliveries

    def create_distribution_plans(self, manager):
        """Create distribution plans"""
        plans = []
        
        plan_data = [
            {
                'name': 'Weekly Distribution Plan - Week 1',
                'description': 'Distribution plan for the first week of the month',
                'days': 7,
                'status': 'approved'
            },
            {
                'name': 'Weekly Distribution Plan - Week 2',
                'description': 'Distribution plan for the second week of the month',
                'days': 7,
                'status': 'draft'
            },
            {
                'name': 'Monthly Distribution Plan',
                'description': 'Overall distribution plan for the current month',
                'days': 30,
                'status': 'approved'
            }
        ]
        
        for data in plan_data:
            plan = DistributionPlan.objects.create(
                name=data['name'],
                description=data['description'],
                start_date=timezone.now().date(),
                end_date=timezone.now().date() + timedelta(days=data['days']),
                status=data['status'],
                total_quantity_planned=Decimal(random.randint(5000, 20000)),
                created_by=manager,
                approved_by=manager if data['status'] == 'approved' else None,
                approved_date=timezone.now() if data['status'] == 'approved' else None
            )
            plans.append(plan)
        
        self.stdout.write(f'Created {len(plans)} distribution plans')
        return plans

    def print_summary(self):
        """Print summary of created data"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write('MOCK DATA SUMMARY')
        self.stdout.write('='*50)
        self.stdout.write(f'Managers: {Manager.objects.count()}')
        self.stdout.write(f'Farmers: {Farmer.objects.count()}')
        self.stdout.write(f'Drivers: {Driver.objects.count()}')
        self.stdout.write(f'Orders: {Order.objects.count()}')
        self.stdout.write(f'Routes: {Route.objects.count()}')
        self.stdout.write(f'Deliveries: {Delivery.objects.count()}')
        self.stdout.write(f'Supply Inventory Items: {SupplyInventory.objects.count()}')
        self.stdout.write(f'Distribution Plans: {DistributionPlan.objects.count()}')
        self.stdout.write('='*50)
        
        self.stdout.write('\nLogin Credentials:')
        self.stdout.write('Managers: testmanager, johndoe, janesmith')
        self.stdout.write('Drivers: driver1, driver2, driver3, driver4, driver5')
        self.stdout.write('Password for all: Pass_1234') 