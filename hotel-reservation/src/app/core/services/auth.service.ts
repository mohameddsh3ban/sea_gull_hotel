import { Injectable, inject, signal, computed, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, from, BehaviorSubject, of, throwError } from 'rxjs';
import { switchMap, tap, map, catchError, finalize } from 'rxjs/operators';
import { LoginDto } from '../models/dto/login.dto';
import { NotificationService } from './notification.service';
import { toSignal } from '@angular/core/rxjs-interop';

export interface IAuthUser {
  uid: string;
  email: string | null;
  name: string | null;
  role: string; // Made required
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private afAuth = inject(AngularFireAuth);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  // BehaviorSubject to manage state imperatively
  private currentUserSubject = new BehaviorSubject<IAuthUser | null>(null);
  
  // Expose as Observable and Signal
  public readonly user$ = this.currentUserSubject.asObservable();
  public readonly user = toSignal(this.user$, { initialValue: null });
  
  // Loading state for initial auth check
  private isLoadingSubject = new BehaviorSubject<boolean>(true);
  public readonly isLoading$ = this.isLoadingSubject.asObservable();

  // Computeds
  public readonly isAuthenticated = computed(() => !!this.user());
  public readonly isAdmin = computed(() => this.user()?.role === 'admin');

  constructor() {
    // 1. Listen to Firebase Auth State (Handles Page Refresh)
    this.afAuth.authState.pipe(
      switchMap(async (firebaseUser) => {
        if (!firebaseUser) return null;

        // Force refresh token to ensure we get latest Custom Claims (Roles)
        const tokenResult = await firebaseUser.getIdTokenResult(true);
        const role = (tokenResult.claims['role'] as string) || 'guest';

        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photoUrl: firebaseUser.photoURL || undefined,
          role: role,
        } as IAuthUser;
      })
    ).subscribe({
      next: (user) => {
        this.currentUserSubject.next(user);
        this.isLoadingSubject.next(false);
      },
      error: (err) => {
        console.error('Auth State Error', err);
        this.isLoadingSubject.next(false);
      }
    });
  }

  /**
   * Login with Email/Password
   * Returns the mapped User object so the component can redirect immediately.
   */
  login(credentials: LoginDto): Observable<IAuthUser> {
    return from(
      this.afAuth.signInWithEmailAndPassword(credentials.email, credentials.password)
    ).pipe(
      // Wait for the User Credential, then fetch the Token Result immediately
      switchMap(async (userCredential) => {
        if (!userCredential.user) throw new Error('No user found');
        
        // Force token refresh to get fresh claims
        const tokenResult = await userCredential.user.getIdTokenResult(true);
        const role = (tokenResult.claims['role'] as string) || 'guest';
        
        return {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName,
          photoUrl: userCredential.user.photoURL,
          role: role
        } as IAuthUser;
      }),
      tap((user) => {
        // Update state immediately (don't wait for authState listener)
        this.currentUserSubject.next(user);
        this.notificationService.showSuccess('Welcome Back!', `Logged in as ${user.role}`);
      }),
      catchError((err) => {
        return throwError(() => this.handleFirebaseError(err));
      })
    );
  }

  logout() {
    return from(this.afAuth.signOut()).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        this.router.navigate(['/auth/login']);
        this.notificationService.showSuccess('Logged Out', 'See you soon!');
      })
    );
  }

  private handleFirebaseError(err: any): Error {
    console.error(err);
    let msg = 'An unknown error occurred';
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      msg = 'Invalid email or password';
    } else if (err.code === 'auth/too-many-requests') {
      msg = 'Too many failed attempts. Please try again later.';
    } else if (err.code === 'auth/user-disabled') {
      msg = 'This account has been disabled.';
    }
    return new Error(msg);
  }
}
