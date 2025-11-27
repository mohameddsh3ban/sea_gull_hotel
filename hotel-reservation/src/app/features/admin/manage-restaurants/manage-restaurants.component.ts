import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { Restaurant } from '../../../core/models/restaurant.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, Plus, Trash2 } from 'lucide-angular';

@Component({
  selector: 'app-manage-restaurants',
  standalone: true,
  imports: [CommonModule, LoadingSpinner, LucideAngularModule],
  template: `
    <div class="max-w-7xl mx-auto p-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">Restaurant Menus</h1>
          <p class="text-gray-500 mt-1">Manage content, menus, and media.</p>
        </div>
        <button
          (click)="createNew()"
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <lucide-icon [img]="icons.Plus" class="w-4 h-4"></lucide-icon> Add Restaurant
        </button>
      </div>

      @if (loading()) {
      <app-loading-spinner />
      } @else {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (rest of restaurants(); track rest.id) {
        <div
          class="bg-white rounded-xl shadow border border-gray-100 overflow-hidden flex flex-col h-full"
        >
          <!-- Cover Image Preview -->
          <div class="h-32 bg-gray-200 relative">
            <img
              [src]="rest.media.cardImage"
              class="w-full h-full object-cover"
        
            />
            <div
              class="absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold"
              [class]="rest.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
            >
              {{ rest.isActive ? 'Active' : 'Hidden' }}
            </div>
          </div>

          <div class="p-5 flex-1 flex flex-col">
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-xl font-bold text-gray-800">{{ rest.name }}</h3>
              <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                >ID: {{ rest.id }}</span
              >
            </div>

            <p class="text-sm text-gray-500 line-clamp-2 mb-4">{{ rest.description }}</p>

            <div class="mt-auto pt-4 border-t border-gray-50 flex gap-2">
              <button
                (click)="edit(rest.id)"
                class="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg font-medium text-sm transition"
              >
                Edit Menu & Info
              </button>
              <button
                (click)="delete(rest.id)"
                class="px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
              >
                <lucide-icon [img]="icons.Trash2" class="w-4 h-4"></lucide-icon>
              </button>
            </div>
          </div>
        </div>
        }
      </div>
      }
    </div>
  `,
})
export class ManageRestaurantsComponent implements OnInit {
  restaurants = signal<Restaurant[]>([]);
  loading = signal(true);

  // Icons
  readonly icons = { Plus, Trash2 };

  constructor(
    private restaurantService: RestaurantService,
    private router: Router,
    private toast: ToastrService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.restaurantService.getAll().subscribe({
      next: (data: Restaurant[]) => {
        this.restaurants.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load restaurants');
        this.loading.set(false);
      },
    });
  }

  createNew() {
    this.router.navigate(['/admin/restaurants/new']);
  }

  edit(id: string) {
    this.router.navigate(['/admin/restaurants/edit', id]);
  }

  delete(id: string) {
    if (confirm(`Are you sure you want to delete ${id}? This cannot be undone.`)) {
      this.restaurantService.delete(id).subscribe({
        next: () => {
          this.toast.success('Restaurant deleted');
          this.loadData();
        },
        error: () => this.toast.error('Delete failed'),
      });
    }
  }
}
