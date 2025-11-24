import { Component } from '@angular/core';
import { ReservationsTableComponent } from '../../../shared/components/reservations-table/reservations-table.component';

@Component({
  selector: 'app-accounting-dashboard',
  standalone: true,
  imports: [ReservationsTableComponent],
  template: `
    <div class="max-w-7xl mx-auto p-8 pt-24">
      <header class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Accounting Dashboard</h1>
        <p class="text-gray-600 mt-2">Review reservation revenue and upsells.</p>
      </header>
      <app-reservations-table userRole="accounting" />
    </div>
  `
})
export class Dashboard {}
