from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from manager.models import Manager


class Command(BaseCommand):
    help = 'Creates a test manager user'

    def handle(self, *args, **options):
        # Check if user already exists
        username = 'testmanager'
        password = 'Pass_1234'
        
        try:
            user = User.objects.get(username=username)
            self.stdout.write(self.style.WARNING(f'User {username} already exists'))
        except User.DoesNotExist:
            user = User.objects.create_user(
                username=username,
                password=password,
                email='testmanager@soyaexcel.com',
                first_name='Test',
                last_name='Manager'
            )
            self.stdout.write(self.style.SUCCESS(f'Created user {username}'))
        
        # Check if manager profile exists
        try:
            manager = Manager.objects.get(user=user)
            self.stdout.write(self.style.WARNING(f'Manager profile already exists for {username}'))
        except Manager.DoesNotExist:
            manager = Manager.objects.create(
                user=user,
                employee_id='EMP001',
                full_name='Test Manager',
                phone_number='+1234567890',
                email='testmanager@soyaexcel.com'
            )
            self.stdout.write(self.style.SUCCESS(f'Created manager profile for {username}'))
        
        self.stdout.write(self.style.SUCCESS(f'\nLogin credentials:'))
        self.stdout.write(f'Username: {username}')
        self.stdout.write(f'Password: {password}') 