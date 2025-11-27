import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, ArrowLeft, Trash2, Plus } from 'lucide-angular';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { Restaurant } from '../../../core/models/restaurant.model';

@Component({
  selector: 'app-restaurant-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, LoadingSpinner, RouterLink],
  templateUrl: './restaurant-editor.component.html'
})
export class RestaurantEditorComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  loading = signal(false);
  restaurantId: string | null = null;
  activeTab = 'info'; // 'info', 'menu', 'upsells', 'config'

  // Expose icons to template
  readonly icons = { ArrowLeft, Trash2, Plus };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private restaurantService: RestaurantService,
    private toast: ToastrService
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.restaurantId = this.route.snapshot.paramMap.get('id');
    if (this.restaurantId && this.restaurantId !== 'new') {
      this.isEditMode = true;
      this.loadData(this.restaurantId);
    }
  }

  initForm() {
    this.form = this.fb.group({
      id: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9_-]+$')]],
      name: ['', Validators.required],
      description: ['', Validators.required],
      isActive: [true],
      order: [1],
      media: this.fb.group({
        cardImage: [''],
        coverImage: [''],
        menuPdfUrl: ['']
      }),
      config: this.fb.group({
        openingTime: ['18:00', Validators.required],
        closingTime: ['22:00', Validators.required],
        timeSlotInterval: [30, Validators.required],
        maxGuestsPerBooking: [8, Validators.required]
      }),
      menuConfig: this.fb.group({
        hasMainCourseSelection: [true],
        mainCourseLabel: ['Select your Main Course'],
        mainCourses: this.fb.array([]),
        hasUpsells: [false],
        upsellLabel: ['Add Extras'],
        upsellItems: this.fb.array([])
      })
    });
  }

  // Helper for Arrays
  get mainCourses() {
    return (this.form.get('menuConfig.mainCourses') as FormArray);
  }

  get upsellItems() {
    return (this.form.get('menuConfig.upsellItems') as FormArray);
  }

  addMainCourse() {
    const courseGroup = this.fb.group({
      id: ['', Validators.required],
      label: ['', Validators.required],
      available: [true]
    });
    this.mainCourses.push(courseGroup);
  }

  removeMainCourse(index: number) {
    this.mainCourses.removeAt(index);
  }

  addUpsellItem() {
    const upsellGroup = this.fb.group({
      id: ['', Validators.required],
      label: ['', Validators.required],
      price: [0, Validators.required],
      category: ['General']
    });
    this.upsellItems.push(upsellGroup);
  }

  removeUpsellItem(index: number) {
    this.upsellItems.removeAt(index);
  }

  loadData(id: string) {
    this.loading.set(true);
    this.restaurantService.getById(id).subscribe({
      next: (data: Restaurant) => {
        // Patch simple fields
        this.form.patchValue({
          id: data.id,
          name: data.name,
          description: data.description,
          isActive: data.isActive,
          order: data.order,
          media: data.media,
          config: data.config,
          menuConfig: {
            hasMainCourseSelection: data.menuConfig.hasMainCourseSelection,
            mainCourseLabel: data.menuConfig.mainCourseLabel,
            hasUpsells: data.menuConfig.hasUpsells,
            upsellLabel: data.menuConfig.upsellLabel
          }
        });

        if (this.isEditMode) {
          this.form.get('id')?.disable();
        }

        // Populate FormArrays
        data.menuConfig.mainCourses.forEach((item: { id: string, label: string, available: boolean }) => {
          this.mainCourses.push(this.fb.group({
            id: [item.id, Validators.required],
            label: [item.label, Validators.required],
            available: [item.available]
          }));
        });

        data.menuConfig.upsellItems.forEach((item: { id: string, label: string, price: number, category: string }) => {
          this.upsellItems.push(this.fb.group({
            id: [item.id, Validators.required],
            label: [item.label, Validators.required],
            price: [item.price, Validators.required],
            category: [item.category]
          }));
        });

        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Could not load restaurant');
        this.router.navigate(['/admin/restaurants']);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.toast.warning('Please check the form for errors');
      return;
    }

    const payload: Restaurant = this.form.getRawValue();

    if (this.isEditMode) {
      this.restaurantService.update(payload.id, payload).subscribe({
        next: () => {
          this.toast.success('Saved successfully');
          this.router.navigate(['/admin/restaurants']);
        },
        error: () => this.toast.error('Update failed')
      });
    } else {
      this.restaurantService.create(payload).subscribe({
        next: () => {
          this.toast.success('Restaurant created');
          this.router.navigate(['/admin/restaurants']);
        },
        error: () => this.toast.error('Creation failed')
      });
    }
  }
}
