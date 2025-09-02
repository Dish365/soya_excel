from django.core.management.base import BaseCommand
from clients.models import FeedStorage
from decimal import Decimal


class Command(BaseCommand):
    help = 'Update existing FeedStorage records to use 20% threshold instead of 80%'

    def handle(self, *args, **options):
        # Find records that still have the old 80% threshold
        old_threshold_records = FeedStorage.objects.filter(
            low_stock_threshold_percentage=Decimal('80.0')
        )
        
        if old_threshold_records.exists():
            self.stdout.write(
                self.style.WARNING(
                    f'Found {old_threshold_records.count()} records with old 80% threshold'
                )
            )
            
            # Update them to 20%
            updated_count = old_threshold_records.update(
                low_stock_threshold_percentage=Decimal('20.0')
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully updated {updated_count} records to use 20% threshold'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('No records found with old 80% threshold')
            )
