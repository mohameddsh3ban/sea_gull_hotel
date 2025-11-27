// =================================================================================
// File: hotel-reservation/src/app/features/admin/admin-settings/admin-settings.ts
// =================================================================================

import { Component, OnInit, signal, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService } from '../../../core/services/config.service';
import { RestaurantService } from '../../../core/services/restaurant.service'; // Import
import { ToastrService } from 'ngx-toastr';
import { RestaurantConfig } from '../../../core/models/reservation.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinner],
  templateUrl: './admin-settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush, 
})
export class AdminSettings implements OnInit {
  loading = signal(true);
  saving = signal<string | null>(null);
  
  configs: { [key: string]: RestaurantConfig } = {};
  restaurantNames: string[] = []; // Dynamic array
  
  defaultConfig: RestaurantConfig = {
    restaurantId: '', // Added as per backend model
    isActive: true,
    openingTime: '18:00',
    closingTime: '22:00',
    intervalMinutes: 30
  };

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private configService: ConfigService, 
    private restaurantService: RestaurantService, // Inject
    private toast: ToastrService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    
    // Load Restaurants AND Configs
    this.restaurantService.getAll().subscribe({
        next: (rests) => {
            this.restaurantNames = rests.map(r => r.id);
            
            this.configService.getAll().subscribe({
                next: (data) => {
                    this.configs = data || {};
                    
                    // Initialize defaults for any restaurant missing a config
                    this.restaurantNames.forEach(r => {
                        if (!this.configs[r]) {
                            this.configs[r] = { ...this.defaultConfig, restaurantId: r, isActive: false }; 
                        }
                    });
                    
                    this.loading.set(false);
                    this.cdr.markForCheck();
                },
                error: () => this.handleError()
            });
        },
        error: () => this.handleError()
    });
  }

  handleError() {
    this.loading.set(false);
    this.toast.error('Failed to load settings.');
    this.cdr.markForCheck();
  }

  toggleActive(name: string) {
    if (this.configs[name]) {
      this.configs[name].isActive = !this.configs[name].isActive;
    }
  }

  saveSettings(name: string) {
    this.saving.set(name);
    const configToSave = this.configs[name];
    
    // Ensure the ID is attached
    const payload = { ...configToSave, restaurantId: name };

    this.configService.update(name, payload).subscribe({
      next: () => {
        this.toast.success(`${name} settings saved!`);
        this.saving.set(null);
      },
      error: (err: any) => {
        this.toast.error(err.error?.detail || 'Save failed');
        this.saving.set(null);
      }
    });
  }
}
