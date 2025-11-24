import { Component } from '@angular/core';
import { ReservationsTableComponent } from '../../../shared/components/reservations-table/reservations-table.component';

@Component({
  selector: 'app-reception-dashboard',
  standalone: true,
  imports: [ReservationsTableComponent],
  template: `
    <div class="max-w-7xl mx-auto p-8 pt-24">
      <header class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Reception Dashboard</h1>
        <p class="text-gray-600 mt-2">Manage check-ins and payments.</p>
      </header>
      <app-reservations-table userRole="reception" />
    </div>
  `
})
export class Dashboard {}
