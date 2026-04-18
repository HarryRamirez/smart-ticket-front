import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, throwError } from 'rxjs';
import { AuthResponse, UserResponse } from '../models/entities';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  private userSignal = signal<UserResponse | null>(this.getStoredUser());
  private tokenSignal = signal<string | null>(localStorage.getItem('access_token'));

  public user = this.userSignal.asReadonly();
  public isAuthenticated = computed(() => !!this.tokenSignal());

  login(credentials: { username: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/`, credentials).pipe(
      tap(response => this.handleAuthentication(response)),
      catchError(error => throwError(() => error))
    );
  }

  register(userData: { username: string; first_name: string; last_name: string; email: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register/`, userData).pipe(
      tap(response => this.handleAuthentication(response)),
      catchError(error => throwError(() => error))
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  private handleAuthentication(response: AuthResponse) {
    localStorage.setItem('access_token', response.access);
    localStorage.setItem('refresh_token', response.refresh);
    localStorage.setItem('user_data', JSON.stringify(response.user));
    
    this.tokenSignal.set(response.access);
    this.userSignal.set(response.user);
  }

  private getStoredUser(): UserResponse | null {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }
}