import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { ConfigService } from '../../../core/services/config.service';
import { ToastrService } from 'ngx-toastr';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { Reservation } from '../../../core/models/reservation.model';

@Component({
  selector: 'app-edit-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinner],
  templateUrl: './edit-reservation.html',
})
export class EditReservation implements OnInit {
  form!: FormGroup;
  loading = signal(true);
  submitting = signal(false);
  reservationId: string | null = null;
  restaurantName = signal('');
  roomNumber = signal('');
  guestName = signal('');
  availableTimeSlots = signal<string[]>([]);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService,
    private configService: ConfigService,
    private toast: ToastrService
  ) {
    this.form = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required],
      guests: [2, [Validators.required, Validators.min(1), Validators.max(10)]],
    });
  }

  ngOnInit() {
    this.reservationId = this.route.snapshot.paramMap.get('id');
    if (this.reservationId) {
      this.loadReservation(this.reservationId);
    }
  }

  loadReservation(id: string) {
    this.reservationService.getById(id).subscribe({
      next: (res: Reservation) => {
        this.restaurantName.set(res.restaurant);
        this.roomNumber.set(res.room);
        this.guestName.set(`${res.first_name} ${res.last_name}`);
        
        this.form.patchValue({
          date: res.date,
          time: res.time,
          guests: res.guests
        });
        
        this.loadConfig(res.restaurant);
      },
      error: () => {
        this.toast.error('Reservation not found');
        this.router.navigate(['/admin/dashboard']);
      }
    });
  }

  loadConfig(restaurantId: string) {
    this.configService.getAll().subscribe({
      next: (configs: any) => {
        const config = configs[restaurantId];
        if (config) {
          this.generateTimeSlots(config.openingTime, config.closingTime, config.intervalMinutes);
        } else {
          this.generateTimeSlots('18:00', '22:00', 30);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  generateTimeSlots(start: string, end: string, interval: number) {
    const slots = [];
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    let current = new Date();
    current.setHours(startH, startM, 0, 0);
    const endTime = new Date();
    endTime.setHours(endH, endM, 0, 0);
    
    while (current <= endTime) {
      slots.push(current.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      current.setMinutes(current.getMinutes() + interval);
    }
    this.availableTimeSlots.set(slots);
  }

  onSubmit() {
    if (this.form.invalid || !this.reservationId) return;

    this.submitting.set(true);
    this.reservationService.update(this.reservationId, this.form.value).subscribe({
      next: () => {
        this.toast.success('Reservation updated & Guest notified! 📧');
        setTimeout(() => this.router.navigate(['/admin/dashboard']), 1500);
      },
      error: (err) => {
        this.toast.error(err.error?.detail || 'Update failed');
        this.submitting.set(false);
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/dashboard']);
  }
}
