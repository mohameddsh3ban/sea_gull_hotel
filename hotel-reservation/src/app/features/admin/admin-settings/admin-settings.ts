import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService } from '../../../core/services/config.service';
import { ToastrService } from 'ngx-toastr';
import { RestaurantConfig } from '../../../core/models/reservation.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinner],
  templateUrl: './admin-settings.html',
})
export class AdminSettings implements OnInit {
  loading = signal(true);
  saving = signal<string | null>(null);
  
  configs: { [key: string]: RestaurantConfig } = {};
  restaurants = ['Oriental', 'Chinese', 'Italian', 'Indian'];
  
  defaultConfig: RestaurantConfig = {
    isActive: true,
    openingTime: '18:00',
    closingTime: '22:00',
    intervalMinutes: 30
  };

  constructor(private configService: ConfigService, private toast: ToastrService) {}

  ngOnInit() {
    this.loadConfigs();
  }

  loadConfigs() {
    this.configService.getAll().subscribe({
      next: (data: { [key: string]: RestaurantConfig }) => {
        this.configs = data || {};
        this.restaurants.forEach(r => {
          if (!this.configs[r]) {
            this.configs[r] = { ...this.defaultConfig };
          }
        });
        this.loading.set(false);
      },
      error: (err: any) => {
        this.toast.error('Failed to load settings');
        this.loading.set(false);
      }
    });
  }

  toggleActive(name: string) {
    if (this.configs[name]) {
      this.configs[name].isActive = !this.configs[name].isActive;
    }
  }

  saveSettings(name: string) {
    this.saving.set(name);
    const configToSave = this.configs[name];
    const payload = { ...configToSave, restaurantId: name };

    this.configService.update(name, payload).subscribe({
      next: () => {
        this.toast.success(`${name} settings saved!`);
        this.saving.set(null);
      },
      error: (err: any) => {
        this.toast.error(err.message || 'Save failed');
        this.saving.set(null);
      }
    });
  }
}
