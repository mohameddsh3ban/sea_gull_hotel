// =================================================================================
// File: hotel-reservation/src/app/features/guest/reservation-form/reservation-form.component.ts
// =================================================================================

import { Component, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { ReservationService } from '../../../core/services/reservation.service';
import { ConfigService } from '../../../core/services/config.service';
import { CapacityService } from '../../../core/services/capacity.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    LoadingSpinner,
    LucideAngularModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush, // ✅ Performance Boost
  template: `
    <!-- Template remains exactly the same as previous iteration -->
    <div class="max-w-6xl mx-auto pt-24 md:pt-28 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 mb-12">
      <!-- ... (content omitted for brevity, same as before) ... -->
      <!-- Left Side -->
      <div class="bg-white shadow rounded-2xl p-6 flex flex-col items-center h-fit">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">{{ 'restaurant_menu' | translate }}</h3>
        <div class="w-full h-[500px] border rounded bg-gray-100 overflow-hidden relative">
            <iframe [src]="menuUrl()" class="w-full h-full" title="Restaurant Menu"></iframe>
        </div>
        <a [href]="menuUrl()" target="_blank" rel="noopener noreferrer" class="mt-4 bg-[#006494] text-white px-4 py-2 rounded hover:bg-[#005377] transition">
          {{ 'menu_button' | translate }}
        </a>
      </div>

      <!-- Right Side -->
      <div class="bg-white shadow rounded-2xl p-4 sm:p-8">
        @if (loadingConfig()) {
          <app-loading-spinner />
        } @else if (!isRestaurantActive()) {
           <div class="text-center py-10">
             <div class="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
               <h2 class="text-2xl font-bold mb-2">Restaurant Closed</h2>
               <p>The {{ restaurantId() }} restaurant is currently not accepting reservations.</p>
               <button (click)="router.navigate(['/'])" class="mt-4 text-blue-600 underline">Back to Home</button>
             </div>
           </div>
        } @else {
          <h2 class="text-2xl font-bold mb-6 text-gray-800">{{ 'book_table' | translate }}</h2>
          
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
             <!-- Fields -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ 'select_date' | translate }}</label>
              <select formControlName="date" class="w-full border p-3 rounded-md focus:ring-2 focus:ring-blue-500">
                <option value="">{{ 'select_date' | translate }}</option>
                @for (day of availableDates(); track day.iso) {
                  <option [value]="day.iso" [disabled]="day.disabled">
                    {{ day.label }} {{ day.disabled ? '(Unavailable)' : '' }}
                  </option>
                }
              </select>
              @if (spotsLeft() !== null && spotsLeft()! <= 4 && spotsLeft()! > 0) {
                <div class="text-yellow-600 text-sm mt-1 flex items-center gap-1">
                  <lucide-icon name="info" class="w-4 h-4"></lucide-icon> Only {{ spotsLeft() }} spots left!
                </div>
              }
              @if (spotsLeft() === 0) {
                <div class="text-red-600 text-sm mt-1">❌ Fully booked</div>
              }
            </div>

             <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <select formControlName="time" class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500">
                @for (t of availableTimeSlots(); track t) {
                  <option [value]="t">{{ t }}</option>
                }
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ 'number_of_guests' | translate }}</label>
              <select formControlName="guests" (change)="onGuestsChange()" class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500">
                @for (n of [1,2,3,4]; track n) {
                  <option [value]="n">{{ n }}</option>
                }
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <input type="number" formControlName="room" [placeholder]="'room_number' | translate" class="w-full border p-2 rounded" />
              <input type="email" formControlName="email" [placeholder]="'email' | translate" class="w-full border p-2 rounded" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <input type="text" formControlName="first_name" [placeholder]="'first_name' | translate" class="w-full border p-2 rounded" />
              <input type="text" formControlName="last_name" [placeholder]="'last_name' | translate" class="w-full border p-2 rounded" />
            </div>

            @if (['Chinese', 'Indian', 'Italian'].includes(restaurantId() || '')) {
              <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label class="block text-gray-700 font-medium mb-3">
                  {{ 'select_main_course' | translate }} (Per Guest)
                </label>
                
                <div formArrayName="main_courses" class="space-y-3">
                  @for (control of mainCoursesArray.controls; track $index) {
                    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                      <span class="text-sm font-medium text-gray-500 w-16">Guest {{ $index + 1 }}:</span>
                      
                      @if (restaurantId() === 'Italian') {
                         <div class="flex flex-wrap gap-2">
                           @for (opt of italianOptions; track opt.val) {
                             <button type="button" 
                               [class.bg-yellow-100]="control.value === opt.val"
                               [class.border-yellow-400]="control.value === opt.val"
                               [class.text-yellow-800]="control.value === opt.val"
                               class="px-3 py-2 text-sm border rounded hover:bg-gray-50 transition"
                               (click)="control.setValue(opt.val)">
                               {{ opt.label | translate }}
                             </button>
                           }
                         </div>
                      } @else {
                        <div class="flex gap-2">
                          <button type="button" 
                             [class.bg-yellow-100]="control.value === 'chicken'"
                             class="px-4 py-2 border rounded hover:bg-gray-50"
                             (click)="control.setValue('chicken')">
                             {{ 'chicken' | translate }}
                          </button>
                          <button type="button" 
                             [class.bg-yellow-100]="control.value === 'meat'"
                             class="px-4 py-2 border rounded hover:bg-gray-50"
                             (click)="control.setValue('meat')">
                             {{ 'meat' | translate }}
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            @if (restaurantId() === 'Chinese' && hasSelectedSushi()) {
               <div class="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800">
                 <strong>🍣 Sushi Added:</strong> \${{ calculateSushiTotal() }} (Extra Charge)
               </div>
            }

            <textarea formControlName="comments" rows="3" [placeholder]="'comments_placeholder' | translate" class="w-full border p-2 rounded"></textarea>

            <button type="submit" [disabled]="form.invalid || submitting()" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-400 transition">
              {{ submitting() ? ('sending' | translate) : ('confirm_reservation' | translate) }}
            </button>
          </form>
        }
      </div>
    </div>
    <!-- ... (Sushi Modal omitted, same as before) ... -->
  `
})
export class ReservationFormComponent implements OnInit {
  form!: FormGroup;
  restaurantId = signal<string | null>(null);
  loadingConfig = signal(true);
  submitting = signal(false);
  isRestaurantActive = signal(true);
  
  availableDates = signal<any[]>([]);
  availableTimeSlots = signal<string[]>(['19:00']);
  spotsLeft = signal<number | null>(null);
  showSushiModal = signal(false);

  // Static Data
  italianOptions = [
    { val: 'quatro_formagi', label: 'quatro_formagi' },
    { val: 'chicken_pizza', label: 'chicken_pizza' },
    { val: 'petto_chicken', label: 'petto_chicken' }
  ];

  sushiCategories = [
    { key: 'hot_rolls', label: 'sushi_categories.hot_rolls', items: [
      { name: 'Hot Dynamites', price: 4 }, { name: 'Hot Crab', price: 4 }, { name: 'Hot Dragon', price: 4 }
    ]},
    { key: 'maki_rolls', label: 'sushi_categories.maki_rolls', items: [
      { name: 'Sake Maki', price: 3 }, { name: 'Seagull Roll', price: 5 }, { name: 'Kappa Roll', price: 2 }, { name: 'Kabi Maki', price: 4 }
    ]}
  ];

  allSushiItems = this.sushiCategories.flatMap(c => c.items);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private reservationService: ReservationService,
    private configService: ConfigService,
    private capacityService: CapacityService,
    private toast: ToastrService
  ) {
    this.initForm();
    
    // ✅ Fix: Prevent memory leak
    this.form.get('date')?.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(date => {
        if (date) this.checkCapacity(date);
      });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('restaurantId');
      if (id) {
        this.restaurantId.set(id);
        this.loadConfigAndDates(id);
      }
    });
  }

  initForm() {
    this.form = this.fb.group({
      date: ['', Validators.required],
      time: ['19:00', Validators.required],
      guests: [2, Validators.required],
      room: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      comments: [''],
      main_courses: this.fb.array([]),
      upsell_items: this.fb.group({})
    });

    const upsellGroup = this.form.get('upsell_items') as FormGroup;
    this.allSushiItems.forEach(item => {
      upsellGroup.addControl(item.name, this.fb.control(0));
    });

    // Initial setup for main courses
    this.onGuestsChange(); 
  }

  get mainCoursesArray() {
    return this.form.get('main_courses') as FormArray;
  }

  get upsellForm() {
    return this.form.get('upsell_items') as FormGroup;
  }

  // ✅ Fix: Preserve existing values when changing guest count
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

  async loadConfigAndDates(restaurant: string) {
    this.loadingConfig.set(true);
    try {
        const configs = await this.configService.getAll().toPromise();
        const myConfig = configs?.[restaurant];
        
        if (myConfig) {
            this.isRestaurantActive.set(myConfig.isActive);
            this.generateTimeSlots(myConfig.openingTime, myConfig.closingTime, myConfig.intervalMinutes);
        }

        const caps = await this.capacityService.getAll().toPromise();
        this.buildDateOptions(caps || {});
    } catch (e) {
        console.error(e);
        this.toast.error('Failed to load restaurant details');
    } finally {
        this.loadingConfig.set(false);
    }
  }

  buildDateOptions(capacities: any) {
    const dates = [];
    const today = new Date();
    const isTodayBlocked = today.getHours() >= 11;

    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        const iso = d.toISOString().split('T')[0];
        const key = `${this.restaurantId()}_${iso}`;
        
        const capData = capacities[key];
        const capacity = capData?.capacity || 0;
        const reserved = capData?.reserved_guests || 0;
        const available = capacity - reserved;
        
        const disabled = (i === 0 && isTodayBlocked) || (!capacity) || (available <= 0);

        dates.push({
            iso,
            label: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
            disabled
        });
    }
    this.availableDates.set(dates);
  }

  checkCapacity(date: string) {
     const rest = this.restaurantId();
     if (!rest) return;
     
     this.reservationService.getAll(rest, date).subscribe(res => {
         this.capacityService.getAll().subscribe(allCaps => {
             const key = `${rest}_${date}`;
             const cap = allCaps[key]?.capacity || 0;
             const reserved = allCaps[key]?.reserved_guests || 0;
             this.spotsLeft.set(Math.max(0, cap - reserved));
         });
     });
  }

  generateTimeSlots(start: string, end: string, interval: number) {
      const slots = [];
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      let current = new Date(); current.setHours(startH, startM, 0, 0);
      const endTime = new Date(); endTime.setHours(endH, endM, 0, 0);
      
      while (current <= endTime) {
          slots.push(current.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
          current.setMinutes(current.getMinutes() + interval);
      }
      this.availableTimeSlots.set(slots);
  }

  incrementSushi(name: string) {
    const ctrl = this.upsellForm.get(name);
    if (ctrl) {
      ctrl.setValue(ctrl.value + 1);
    }
  }
  
  decrementSushi(name: string) {
    const ctrl = this.upsellForm.get(name);
    if (ctrl && ctrl.value > 0) {
      ctrl.setValue(ctrl.value - 1);
    }
  }

  hasSelectedSushi() {
    const vals = this.upsellForm.value;
    return Object.values(vals).some((v: any) => v > 0);
  }

  calculateSushiTotal() {
     let total = 0;
     const vals = this.upsellForm.value;
     this.allSushiItems.forEach(item => {
        total += (vals[item.name] || 0) * item.price;
     });
     return total;
  }

  closeSushiModal() { this.showSushiModal.set(false); }

  onSubmit() {
    if (this.form.invalid) {
        this.toast.warning('Please fill in all required fields');
        return;
    }
    if (this.restaurantId() === 'Chinese') {
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
    
    const payload: any = {
        ...formData,
        restaurant: this.restaurantId(),
        upsell_total_price: this.calculateSushiTotal(),
        upsell_items: Object.fromEntries(
            Object.entries(formData.upsell_items).filter(([_, v]: any) => v > 0)
        )
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
        }
    });
  }

  menuUrl = () => `/menus/${this.restaurantId()}.pdf`;
}
