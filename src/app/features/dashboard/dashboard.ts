import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { TicketService } from '../../core/services/ticket.service';
import { ProjectResponse, TicketResponse, DashboardCards } from '../../core/models/entities';
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
    this.projectService.getDashboardCards().subscribe({
      next: (cards) => {
        this.stats.project_count = cards.project_count;
        this.stats.my_tickets_count = cards.my_tickets_count;
        this.stats.tickets_count = cards.tickets_count;
        this.stats.unassigned_tickets_count = cards.unassigned_tickets_count;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard cards', err);
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
}