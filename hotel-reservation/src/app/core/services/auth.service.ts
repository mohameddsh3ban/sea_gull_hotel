import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, from, of, throwError, timer, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
// Remove RequestHandlerService from imports if not used elsewhere, or keep if used for register
import { catchError, filter, finalize, map, switchMap, take, tap } from 'rxjs/operators';
import { LoginDto } from '../models/dto/login.dto';
import { IRegisterPayload } from '../models/dto/register.dto';
import { NotificationService } from './notification.service';
import { RequestHandlerService } from './request-handler.service';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from './user.service';

export interface IAuthUser {
  uid: string;
  email: string | null;
  name: string | null;
  role?: string;
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private afAuth = inject(AngularFireAuth);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private requestHandler = inject(RequestHandlerService);
  private userService = inject(UserService);
  
  // ... (Keep Subjects and Signals as they were) ...
  private currentUserSubject = new BehaviorSubject<IAuthUser | null>(null);
  public readonly user$ = this.currentUserSubject.asObservable();
  
  private isLoadingSubject = new BehaviorSubject<boolean>(true);
  public readonly isLoading$ = this.isLoadingSubject.asObservable();

  private _loginLoadingSubject = new BehaviorSubject<boolean>(false);
  public readonly loginLoading$ = this._loginLoadingSubject.asObservable();

  public readonly user: Signal<IAuthUser | null>;
  public readonly isAuthenticated: Signal<boolean>;

  constructor() {
    this.user = toSignal(this.user$, { initialValue: null });
    this.isAuthenticated = computed(() => !!this.user());

    // Subscribe to Firebase Auth State
    this.afAuth.authState.pipe(
      switchMap(async (firebaseUser) => {
        if (firebaseUser) {
          // Get the ID Token Result to find the Custom Claim 'role'
          const tokenResult = await firebaseUser.getIdTokenResult();
          const role = (tokenResult.claims['role'] as string) || 'guest';
          
          const user: IAuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            photoUrl: firebaseUser.photoURL || undefined,
            role: role, // ✅ Actually get the role from Firebase
          };
          return user;
        } else {
          return null;
        }
      })
    ).subscribe((user) => {
      console.log('Auth State Changed:', user?.email || 'Logged Out', 'Role:', user?.role);
      this.currentUserSubject.next(user);
      this.isLoadingSubject.next(false);
    });
    
    // ... (Keep session check timer) ...
  }

  // ... (Keep waitForAuthReady) ...

  // ✅ REFACTORED LOGIN
  // We no longer call the backend here. We just sign in with Firebase.
  // The authState subscription above handles setting the user state.
  login(credentials: LoginDto): Observable<any> {
    this._loginLoadingSubject.next(true);

    return from(
      this.afAuth.signInWithEmailAndPassword(credentials.email, credentials.password)
    ).pipe(
      tap(() => {
        this.notificationService.showSuccess('Welcome Back!', 'You have successfully logged in.');
      }),
      catchError((err) => {
        console.error(err);
        // Map Firebase errors to user-friendly messages
        let msg = 'Login failed';
        if (err.code === 'auth/user-not-found') msg = 'User not found';
        if (err.code === 'auth/wrong-password') msg = 'Invalid password';
        if (err.code === 'auth/invalid-credential') msg = 'Invalid credentials';
        return throwError(() => new Error(msg));
      }),
      finalize(() => {
        this._loginLoadingSubject.next(false);
      })
    );
  }

  logout() {
    this._loginLoadingSubject.next(true);
    // Just sign out of Firebase. No need to tell backend unless you do server-side session cookies.
    this.afAuth.signOut().then(() => {
      this._loginLoadingSubject.next(false);
      this.router.navigate(['/auth/login']);
      this.notificationService.showSuccess('Logged Out', 'You have been successfully logged out.');
    });
  }

  // ... (Keep register and other methods) ...
  
  register(payload: IRegisterPayload): Observable<any> {
    // Registration might still need to go to backend to set custom claims (roles)
    // OR verify the user exists in your SQL/Mongo DB. 
    // Keep this as is if your backend handles user creation logic.
    return this.requestHandler
      .requestBuilder('POST', 'auth/register') // Ensure this endpoint exists in backend!
      .withoutAuth()
      .setBody(payload)
      .execute();
  }
}
