import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CapacityService } from '../../../core/services/capacity.service';
import { RestaurantService } from '../../../core/services/restaurant.service'; // Import
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-capacities-overview',
  standalone: true,
  imports: [CommonModule, LoadingSpinner],
  templateUrl: './capacities-overview.html',
})
export class CapacitiesOverview implements OnInit {
  loading = signal(true);
  overviewData: any[] = [];
  
  restaurantNames: string[] = []; // Dynamic
  days = [0, 1, 2, 3, 4, 5];
  today = new Date();

  constructor(
    private capacityService: CapacityService,
    private restaurantService: RestaurantService // Inject
  ) {}

  ngOnInit() {
    this.restaurantService.getAll().subscribe(rests => {
        this.restaurantNames = rests.map(r => r.id);
        
        this.capacityService.getOverview().subscribe({
          next: (data: any) => {
            this.overviewData = Array.isArray(data) ? data : [];
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
    });
  }

  getDateKey(dayOffset: number): string {
    const d = new Date(this.today);
    d.setDate(d.getDate() + dayOffset);
    return d.toISOString().split('T')[0];
  }

  getHeaderLabel(dayOffset: number): string {
    const d = new Date(this.today);
    d.setDate(d.getDate() + dayOffset);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  getCellData(restaurant: string, dayOffset: number) {
    const dateKey = this.getDateKey(dayOffset);
    return this.overviewData.find(item => item.restaurant === restaurant && item.date === dateKey);
  }

  getPercentage(reserved: number, capacity: number): number {
    if (!capacity) return 0;
    return Math.min(100, Math.round((reserved / capacity) * 100));
  }

  getStatusColor(remaining: number, capacity: number): string {
    if (!capacity) return 'bg-gray-50 border-gray-200';
    if (remaining <= 0) return 'bg-red-50 border-red-200 text-red-700';
    if (remaining <= 4) return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  }

  getBarColor(remaining: number, capacity: number): string {
    if (!capacity) return 'bg-gray-300';
    if (remaining <= 0) return 'bg-red-500';
    if (remaining <= 4) return 'bg-amber-500';
    return 'bg-emerald-500';
  }
}
