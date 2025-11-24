import { Component } from '@angular/core';
import { ReservationsTableComponent } from '../../../shared/components/reservations-table/reservations-table.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [ReservationsTableComponent],
  template: `
    <div class="max-w-7xl mx-auto p-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      <app-reservations-table userRole="admin" />
    </div>
  `,
})
export class DashboardComponent {}
