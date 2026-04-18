import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserResponse } from '../models/entities';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  searchUsers(query: string): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrl}/search/?q=${query}`);
  }
}