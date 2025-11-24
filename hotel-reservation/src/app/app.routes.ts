import { Routes } from '@angular/router';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { GuestLayoutComponent } from './layouts/guest-layout/guest-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // 1. Auth Routes (Wrapped in AuthLayout)
  {
    path: '',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
    ],
  },

  // 2. Admin Routes (Protected, wrapped in AdminLayout)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [roleGuard(['admin'])],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'manage-capacities', loadComponent: () => import('./features/admin/manage-capacities/manage-capacities').then(m => m.ManageCapacities) },
      { path: 'capacity-overview', loadComponent: () => import('./features/admin/capacities-overview/capacities-overview').then(m => m.CapacitiesOverview) },
      { path: 'analytics', loadComponent: () => import('./features/admin/analytics/analytics').then(m => m.Analytics) },
      { path: 'settings', loadComponent: () => import('./features/admin/admin-settings/admin-settings').then(m => m.AdminSettings) },
      { path: 'reviews', loadComponent: () => import('./features/admin/reviews/reviews').then(m => m.Reviews) },
      { path: 'upload-guest-list', loadComponent: () => import('./features/admin/upload-guest-list/upload-guest-list').then(m => m.UploadGuestList) },
      { path: 'edit/:id', loadComponent: () => import('./features/admin/edit-reservation/edit-reservation').then(m => m.EditReservation) },
    ]
  },
  {
    path: '',
    component: GuestLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/guest/home/home.component').then(m => m.HomeComponent) },
      { path: 'reservation/:restaurantId', loadComponent: () => import('./features/guest/reservation-form/reservation-form.component').then(m => m.ReservationFormComponent) },
      { path: 'confirmation', loadComponent: () => import('./features/guest/confirmation/confirmation.component').then(m => m.ConfirmationComponent) },
      { path: 'cancel/:token', loadComponent: () => import('./features/guest/guest-cancel/guest-cancel').then(m => m.GuestCancel) },
      { path: 'review/:token', loadComponent: () => import('./features/guest/review-page/review-page').then(m => m.ReviewPage) },
      { path: 'modify/:token', loadComponent: () => import('./features/guest/modify-reservation/modify-reservation').then(m => m.ModifyReservation) },
      { path: 'about', loadComponent: () => import('./features/guest/about/about.component').then(m => m.AboutComponent) },
      { path: 'contact', loadComponent: () => import('./features/guest/contact/contact.component').then(m => m.ContactComponent) },
    ]
  },

  // Wildcard
  { path: '**', redirectTo: '' },
];
