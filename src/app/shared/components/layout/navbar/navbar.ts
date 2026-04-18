import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  private authService = inject(AuthService);

  user = this.authService.user;
  
  userName = computed(() => {
    const u = this.user();
    return u ? `${u.first_name} ${u.last_name}` : 'Usuario';
  });

  userEmail = computed(() => this.user()?.email || '');

  userInitials = computed(() => {
    const u = this.user();
    if (!u) return 'U';
    return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase();
  });

  logout() {
    this.authService.logout();
  }

  toggleSidebar() {
    // Implementación de toggle si es necesario, 
    // usualmente vía un servicio de Layout
  }
}
