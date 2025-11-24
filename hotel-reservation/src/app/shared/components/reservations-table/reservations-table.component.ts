// =================================================================================
// File: hotel-reservation/src/app/shared/components/reservations-table/reservations-table.component.ts
// =================================================================================

import { Component, Input, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../../core/services/reservation.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ToastrService } from 'ngx-toastr';
import { Reservation, ReservationResponse } from '../../../core/models/reservation.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-reservations-table',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush, // ✅ Performance Boost
  template: `
    <!-- Template remains largely the same -->
    <div class="space-y-4">
      <div class="bg-white shadow-md rounded-lg p-4">
        <div class="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div class="md:col-span-2">
            <input type="text" [(ngModel)]="search" (keyup)="applyFilters()" placeholder="Search guest name, room..." class="w-full border p-2 rounded" />
          </div>
          <select [(ngModel)]="restaurantFilter" (change)="loadData()" class="border p-2 rounded">
            <option value="all">All Restaurants</option>
            <option value="Italian">Italian</option>
            <option value="Chinese">Chinese</option>
            <option value="Indian">Indian</option>
          </select>
          <input type="date" [(ngModel)]="dateFilter" (change)="loadData()" class="border p-2 rounded" />
          
          <button (click)="exportPdf()" class="bg-green-600 text-white rounded px-4 hover:bg-green-700">PDF</button>
           <button (click)="exportCsv()" class="bg-blue-600 text-white rounded px-4 hover:bg-blue-700">CSV</button>
        </div>
      </div>

      <div class="overflow-x-auto bg-white shadow-lg rounded-xl max-h-[70vh]">
        <table class="w-full text-sm text-left">
          <thead class="bg-gray-100 text-gray-700 uppercase sticky top-0 z-10">
            <tr>
              <th class="p-3">Guest</th>
              <th class="p-3">Room</th>
              <th class="p-3">Date</th>
              <th class="p-3">Time</th>
              <th class="p-3">Pax</th>
              <th class="p-3">Restaurant</th>
              <th class="p-3">Main Courses</th>
              <th class="p-3">Extras</th>
              <th class="p-3">Status</th>
              @if (userRole === 'admin') { <th class="p-3">Actions</th> }
            </tr>
          </thead>
          
          @if (loading()) {
             <tbody><tr><td colspan="10"><app-loading-spinner /></td></tr></tbody>
          } @else {
            <tbody>
              @for (res of filteredReservations(); track res.id) {
                <tr class="border-t hover:bg-gray-50 transition" [class.bg-yellow-50]="res.is_vip">
                  <td class="p-3 font-medium">
                    {{ res.first_name }} {{ res.last_name }}
                    @if(res.is_vip) { <span class="text-xs bg-yellow-200 px-1 rounded ml-1">VIP</span> }
                  </td>
                  <td class="p-3">{{ res.room }}</td>
                  <td class="p-3">{{ res.date }}</td>
                  <td class="p-3">{{ res.time }}</td>
                  <td class="p-3">{{ res.guests }}</td>
                  <td class="p-3">{{ res.restaurant }}</td>
                  <td class="p-3 text-xs">{{ res.main_courses.join(', ') || '-' }}</td>
                  <td class="p-3 text-xs">
                    @for (item of getUpsellKeys(res.upsell_items); track item) {
                       <div>{{ item }} x{{ res.upsell_items![item] }}</div>
                    }
                  </td>
                  <td class="p-3">
                    <span [class]="res.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="px-2 py-1 rounded-full text-xs">
                      {{ res.status }}
                    </span>
                  </td>
                  @if (userRole === 'admin') {
                    <td class="p-3">
                      <button (click)="cancelReservation(res.id!)" class="text-red-600 hover:underline">Cancel</button>
                    </td>
                  }
                </tr>
              }
              @empty {
                <tr><td colspan="10" class="p-8 text-center text-gray-500">No reservations found</td></tr>
              }
            </tbody>
          }
        </table>
      </div>
    </div>
  `
})
export class ReservationsTableComponent implements OnInit {
  @Input() userRole: string = 'guest';

  reservations = signal<Reservation[]>([]);
  filteredReservations = signal<Reservation[]>([]);
  loading = signal(false);

  search = '';
  restaurantFilter = 'all';
  dateFilter = '';

  constructor(private reservationService: ReservationService, private toast: ToastrService) {}

  ngOnInit() {
    this.dateFilter = new Date().toISOString().split('T')[0];
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.reservationService.getAll(
        this.restaurantFilter !== 'all' ? this.restaurantFilter : undefined,
        this.dateFilter ? this.dateFilter : undefined
    ).subscribe({
      next: (res: ReservationResponse) => {
        // ✅ Fix: Correctly handle backend PaginatedReservations structure
        const data = res.items || [];
        this.reservations.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilters() {
    let data = this.reservations();
    if (this.search) {
      const term = this.search.toLowerCase();
      data = data.filter(r => 
        r.first_name.toLowerCase().includes(term) || 
        r.last_name.toLowerCase().includes(term) ||
        r.room.toString().includes(term)
      );
    }
    this.filteredReservations.set(data);
  }

  getUpsellKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  cancelReservation(id: string) {
    if(!confirm('Cancel this reservation?')) return;
    this.reservationService.cancel(id).subscribe(() => {
      this.toast.success('Cancelled');
      this.loadData();
    });
  }

  exportPdf() {
    const doc = new jsPDF();
    doc.text('Reservation Report', 14, 15);
    doc.text(`Date: ${this.dateFilter || 'All'}`, 14, 22);
    
    const data = this.filteredReservations().map(r => [
       `${r.first_name} ${r.last_name}`,
       r.room,
       r.time,
       r.guests,
       r.restaurant,
       r.main_courses.join(', ') || ''
    ]);

    autoTable(doc, {
      head: [['Name', 'Room', 'Time', 'Pax', 'Restaurant', 'Courses']],
      body: data,
      startY: 30
    });

    doc.save('reservations.pdf');
  }

  exportCsv() {
     const data = this.filteredReservations();
     const headers = ['Name', 'Room', 'Date', 'Time', 'Guests', 'Restaurant'];
     const rows = data.map(r => [
       `"${r.first_name} ${r.last_name}"`,
       r.room,
       r.date,
       r.time,
       r.guests,
       r.restaurant
     ]);
     
     const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
     const blob = new Blob([csvContent], { type: 'text/csv' });
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = 'reservations.csv';
     a.click();
  }
}
