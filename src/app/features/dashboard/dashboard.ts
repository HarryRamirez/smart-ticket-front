import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { TicketService } from '../../core/services/ticket.service';
import { ProjectResponse, TicketResponse, DashboardCards, UserResponse } from '../../core/models/entities';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  private projectService = inject(ProjectService);
  private ticketService = inject(TicketService);

  projects: ProjectResponse[] = [];
  activeProjects: ProjectResponse[] = [];
  recentTickets: TicketResponse[] = [];
  allTickets: TicketResponse[] = [];
  showActivityModal = false;
  isLoading = true;
  
  stats = {
    project_count: 0,
    my_tickets_count: 0,
    tickets_count: 0,
    unassigned_tickets_count: 0
  };

  currentUserId: number | null = null;

  ngOnInit() {
    this.loadCurrentUser();
    this.loadDashboardData();
  }

  loadCurrentUser() {
    const userStr = localStorage.getItem('user_data');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserId = user.id;
    }
  }

  loadDashboardData() {
    this.isLoading = true;
    forkJoin({
      cards: this.projectService.getDashboardCards(),
      activeProjects: this.projectService.getActiveProjects(),
      recentTickets: this.projectService.getDashboardRecentTickets()
    }).subscribe({
      next: (data) => {
        this.stats.project_count = data.cards.project_count;
        this.stats.my_tickets_count = data.cards.my_tickets_count;
        this.stats.tickets_count = data.cards.tickets_count;
        this.stats.unassigned_tickets_count = data.cards.unassigned_tickets_count;
        this.activeProjects = data.activeProjects;
        this.recentTickets = data.recentTickets;
        this.allTickets = data.recentTickets;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard data', err);
        this.isLoading = false;
      }
    });
  }

  getPriorityClass(priority: string): string {
    const p = priority?.toLowerCase();
    switch (p) {
      case 'crítica':
      case 'urgent': return 'text-danger fw-bold';
      case 'alta':
      case 'high': return 'text-warning fw-bold';
      case 'media':
      case 'medium': return 'text-primary';
      default: return 'text-muted';
    }
  }

  getStatusName(status: any): string {
    if (!status) return '';
    if (typeof status === 'object' && status.name) return status.name;
    return String(status);
  }

  getRelativeTime(dateString: string): string {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHour < 24) return `Hace ${diffHour} h`;
    if (diffDay < 7) return `Hace ${diffDay} día${diffDay > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-ES');
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    if (this.showActivityModal) {
      this.closeActivityModal();
    }
  }

  openActivityModal() {
    this.showActivityModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeActivityModal() {
    this.showActivityModal = false;
    document.body.style.overflow = '';
  }

  getMemberColor(userId: number): string {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e', '#0ea5e9'];
    return colors[userId % colors.length];
  }

  getInitials(user: UserResponse | any): string {
    if (!user) return '';
    if (user.avatar) return user.avatar;
    const first = user.first_name || user.firstName || '';
    const last = user.last_name || user.lastName || '';
    return (first[0] || '') + (last[0] || '');
  }
}