import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CapacityService } from '../../../core/services/capacity.service';
import { ToastrService } from 'ngx-toastr';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-manage-capacities',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinner],
  templateUrl: './manage-capacities.html',
})
export class ManageCapacities implements OnInit {
  loading = signal(true);
  saving = signal(false);
  
  capacities: { [key: string]: number } = {};
  restaurants = ['Oriental', 'Chinese', 'Italian', 'Indian'];
  days = [0, 1, 2, 3, 4, 5];
  today = new Date();

  constructor(private capacityService: CapacityService, private toast: ToastrService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.capacityService.getAll().subscribe({
      next: (data: any) => {
        const flattened: { [key: string]: number } = {};
        Object.keys(data).forEach(key => {
          flattened[key] = data[key].capacity;
        });
        this.capacities = flattened;
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load capacities');
        this.loading.set(false);
      }
    });
  }

  getDateKey(restaurant: string, dayOffset: number): string {
    const d = new Date(this.today);
    d.setDate(d.getDate() + dayOffset);
    const isoDate = d.toISOString().split('T')[0];
    return `${restaurant}_${isoDate}`;
  }

  getHeaderLabel(dayOffset: number): string {
    const d = new Date(this.today);
    d.setDate(d.getDate() + dayOffset);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  save() {
    this.saving.set(true);
    this.capacityService.update(this.capacities as any).subscribe({
      next: () => {
        this.toast.success('Capacities saved successfully! 🎉');
        this.saving.set(false);
      },
      error: (err: any) => {
        this.toast.error(err.error?.detail || 'Save failed');
        this.saving.set(false);
      }
    });
  }
}
