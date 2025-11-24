import { Injectable, signal, computed } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  User,
  getIdTokenResult,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface UserRole {
  role: 'admin' | 'reception' | 'kitchen' | 'accounting' | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  private userRoleSignal = signal<string | null>(null);

  currentUser = this.currentUserSignal.asReadonly();
  userRole = this.userRoleSignal.asReadonly();
  isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor(private auth: Auth, private router: Router) {
    // Listen to auth state changes
    this.auth.onAuthStateChanged(async (user) => {
      this.currentUserSignal.set(user);
      if (user) {
        const role = await this.getUserRole();
        this.userRoleSignal.set(role);
      } else {
        this.userRoleSignal.set(null);
      }
    });
  }

  /**
   * Login with email and password
   */
  login(email: string, password: string): Observable<{ user: User; role: string }> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(async (credential) => {
        const tokenResult = await getIdTokenResult(credential.user, true);
        const role = (tokenResult.claims['role'] as string) || '';
        this.userRoleSignal.set(role);
        return { user: credential.user, role };
      })
    );
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUserSignal.set(null);
    this.userRoleSignal.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Get user role from Firebase custom claims
   */
  async getUserRole(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (!user) return null;

    try {
      const tokenResult = await getIdTokenResult(user, true);
      return (tokenResult.claims['role'] as string) || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  /**
   * Get Firebase ID token
   */
  async getIdToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  }
}
