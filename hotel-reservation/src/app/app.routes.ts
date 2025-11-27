// =================================================================================
// File: hotel-reservation/src/app/app.routes.ts
// =================================================================================

import { Routes } from '@angular/router';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { GuestLayoutComponent } from './layouts/guest-layout/guest-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // 1. Auth Routes (Moved to /auth to prevent Home hijacking)
  {
    path: 'auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ],
  },
  
  // Shortcut: /login -> /auth/login
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },

  // 2. Admin Routes (Protected)
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
      { 
        path: 'restaurants', 
        loadComponent: () => import('./features/admin/manage-restaurants/manage-restaurants.component').then(m => m.ManageRestaurantsComponent) 
      },
      { 
        path: 'restaurants/edit/:id', 
        loadComponent: () => import('./features/admin/restaurant-editor/restaurant-editor.component').then(m => m.RestaurantEditorComponent) 
      },
      { 
        path: 'restaurants/new', 
        loadComponent: () => import('./features/admin/restaurant-editor/restaurant-editor.component').then(m => m.RestaurantEditorComponent) 
      },
    ]
  },
  
  // 3. Staff Dashboards
  {
    path: 'reception/dashboard',
    canActivate: [roleGuard(['reception', 'admin'])],
    loadComponent: () => import('./features/reception/dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: 'kitchen/dashboard',
    canActivate: [roleGuard(['kitchen', 'admin'])],
    loadComponent: () => import('./features/kitchen/dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: 'accounting/dashboard',
    canActivate: [roleGuard(['accounting', 'admin'])],
    loadComponent: () => import('./features/accounting/dashboard/dashboard').then(m => m.Dashboard)
  },

  // 4. Guest Routes (Public Landing Page)
  // This matches the root path '' and loads the Home component
  {
    path: '',
    component: GuestLayoutComponent,
    children: [
      { 
        path: '', 
        loadComponent: () => import('./features/guest/home/home.component').then(m => m.HomeComponent),
        pathMatch: 'full' 
      },
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
