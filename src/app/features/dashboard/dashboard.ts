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
      activeProjects: this.projectService.getActiveProjects()
    }).subscribe({
      next: (data) => {
        this.stats.project_count = data.cards.project_count;
        this.stats.my_tickets_count = data.cards.my_tickets_count;
        this.stats.tickets_count = data.cards.tickets_count;
        this.stats.unassigned_tickets_count = data.cards.unassigned_tickets_count;
        this.activeProjects = data.activeProjects;
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

  getStatusBadgeClass(statusName: string): string {
    switch (statusName.toLowerCase()) {
      case 'done':
      case 'completado':
        return 'bg-success text-white';
      case 'in progress':
      case 'en progreso':
        return 'bg-primary text-white';
      case 'to do':
      case 'por hacer':
        return 'bg-secondary text-white';
      default:
        return 'bg-light text-dark';
    }
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