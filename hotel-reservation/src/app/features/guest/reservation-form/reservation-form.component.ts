// =================================================================================
// File: hotel-reservation/src/app/features/guest/reservation-form/reservation-form.component.ts
// =================================================================================

import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ReservationService } from '../../../core/services/reservation.service';
import { RestaurantService } from '../../../core/services/restaurant.service'; 
import { CapacityService } from '../../../core/services/capacity.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Restaurant } from '../../../core/models/restaurant.model'; 
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LoadingSpinner,
    LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reservation-form.component.html',
})
export class ReservationFormComponent implements OnInit {
  form!: FormGroup;
  restaurantId = signal<string | null>(null);
  restaurant = signal<Restaurant | null>(null);
  loadingConfig = signal(true);
  submitting = signal(false);

  availableDates = signal<any[]>([]);
  availableTimeSlots = signal<string[]>([]);
  spotsLeft = signal<number | null>(null);
  showSushiModal = signal(false);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private reservationService: ReservationService,
    private restaurantService: RestaurantService,
    private capacityService: CapacityService,
    private toast: ToastrService,
    private sanitizer: DomSanitizer
  ) {
    this.initForm();

    this.form
      .get('date')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((date) => {
        if (date) this.checkCapacity(date);
      });
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('restaurantId');
      if (id) {
        this.restaurantId.set(id);
        this.loadRestaurantData(id);
      }
    });
  }

  initForm() {
    this.form = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required],
      guests: [2, Validators.required],
      room: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      comments: [''],
      main_courses: this.fb.array([]),
      upsell_items: this.fb.group({}),
    });
    this.onGuestsChange();
  }

  get mainCoursesArray() {
    return this.form.get('main_courses') as FormArray;
  }
  get upsellForm() {
    return this.form.get('upsell_items') as FormGroup;
  }

  onGuestsChange() {
    const currentCount = this.mainCoursesArray.length;
    const newCount = Number(this.form.get('guests')?.value || 0);

    if (newCount > currentCount) {
      for (let i = currentCount; i < newCount; i++) {
        this.mainCoursesArray.push(this.fb.control('', Validators.required)); 
      }
    } else if (newCount < currentCount) {
      for (let i = currentCount; i > newCount; i--) {
        this.mainCoursesArray.removeAt(i - 1);
      }
    }
  }

  loadRestaurantData(id: string) {
    this.loadingConfig.set(true);

    this.restaurantService.getById(id).subscribe({
      next: async (data) => {
        this.restaurant.set(data);

        this.generateTimeSlots(
          data.config.openingTime,
          data.config.closingTime,
          data.config.timeSlotInterval
        );

        const upsellGroup = this.form.get('upsell_items') as FormGroup;
        Object.keys(upsellGroup.controls).forEach((key) => upsellGroup.removeControl(key));

        if (data.menuConfig.hasUpsells) {
          data.menuConfig.upsellItems.forEach((item) => {
            upsellGroup.addControl(item.id, this.fb.control(0));
          });
        }

        if (!data.menuConfig.hasMainCourseSelection) {
          this.mainCoursesArray.controls.forEach((c) => c.clearValidators());
          this.mainCoursesArray.updateValueAndValidity();
        }

        const caps = await firstValueFrom(this.capacityService.getAll());
        this.buildDateOptions(caps || {});

        this.loadingConfig.set(false);
      },
      error: () => {
        this.toast.error('Restaurant not found');
        this.router.navigate(['/']);
      },
    });
  }

  buildDateOptions(capacities: any) {
    const dates = [];
    const today = new Date();
    
    // Relaxed constraint: Block today only if it's past 9 PM (21:00) instead of 11 AM
    const isTodayBlocked = today.getHours() >= 21; 

    for (let i = 0; i < 7; i++) { // Increased to 7 days
      const d = new Date();
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const key = `${this.restaurantId()}_${iso}`;

      const capData = capacities[key];
      
      // FIX: If no data exists, assume default capacity of 50 instead of 0
      const capacity = capData ? capData.capacity : 50; 
      const reserved = capData ? capData.reserved_guests : 0;
      const available = capacity - reserved;

      const disabled = (i === 0 && isTodayBlocked) || available <= 0;

      dates.push({
        iso,
        label: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        disabled,
      });
    }
    this.availableDates.set(dates);
  }

  checkCapacity(date: string) {
    const rest = this.restaurantId();
    if (!rest) return;

    // Ensure we get the latest data
    this.capacityService.getAll().subscribe((allCaps) => {
      const key = `${rest}_${date}`;
      const capData = allCaps[key];
      
      // FIX: Same default logic here for the UI warning
      const capacity = capData ? capData.capacity : 50;
      const reserved = capData ? capData.reserved_guests : 0;
      
      this.spotsLeft.set(Math.max(0, capacity - reserved));
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

  incrementSushi(id: string) {
    const ctrl = this.upsellForm.get(id);
    if (ctrl) ctrl.setValue(ctrl.value + 1);
  }

  decrementSushi(id: string) {
    const ctrl = this.upsellForm.get(id);
    if (ctrl && ctrl.value > 0) ctrl.setValue(ctrl.value - 1);
  }

  hasSelectedSushi() {
    const vals = this.upsellForm.value;
    return Object.values(vals).some((v: any) => v > 0);
  }

  calculateSushiTotal() {
    let total = 0;
    const vals = this.upsellForm.value;
    const items = this.restaurant()?.menuConfig.upsellItems || [];

    items.forEach((item) => {
      total += (vals[item.id] || 0) * item.price;
    });
    return total;
  }

  closeSushiModal() {
    this.showSushiModal.set(false);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.toast.warning('Please fill in all required fields');
      return;
    }
    if (this.restaurant()?.menuConfig.hasUpsells) {
      this.showSushiModal.set(true);
    } else {
      this.finalizeReservation();
    }
  }

  submitWithSushi() {
    this.showSushiModal.set(false);
    this.finalizeReservation();
  }

  submitWithoutSushi() {
    this.upsellForm.reset();
    this.showSushiModal.set(false);
    this.finalizeReservation();
  }

  finalizeReservation() {
    this.submitting.set(true);
    const formData = this.form.value;

    const upsellPayload: any = {};
    const items = this.restaurant()?.menuConfig.upsellItems || [];

    Object.keys(formData.upsell_items).forEach((key) => {
      const count = formData.upsell_items[key];
      if (count > 0) {
        const item = items.find((i) => i.id === key);
        if (item) upsellPayload[item.label] = count; 
      }
    });

    const payload: any = {
      ...formData,
      restaurant: this.restaurantId(),
      upsell_total_price: this.calculateSushiTotal(),
      upsell_items: upsellPayload,
    };

    this.reservationService.create(payload).subscribe({
      next: () => {
        this.toast.success('Reservation Confirmed! 🎉');
        this.router.navigate(['/confirmation']);
      },
      error: (err) => {
        console.error(err);
        this.toast.error(err.error?.detail || 'Booking failed');
        this.submitting.set(false);
      },
    });
  }

  menuUrl() {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.restaurant()?.media.menuPdfUrl || '');
  }
}
