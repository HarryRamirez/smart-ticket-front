import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { TicketService } from '../../../core/services/ticket.service';
import { UserService } from '../../../core/services/user.service';
import {
  ProjectResponse,
  TicketResponse,
  StatusResponse,
  ProjectMemberWithUser,
  UserResponse,
  CreateProjectMember,
  StatusProject,
  SprintResponse,
  CreateSprint,
  CreateStatus,
  ActivityProject,
  DueTickets,
  backlogTicketsResponse,
  StatusWithTickets
} from '../../../core/models/entities';
import { TicketCreateComponent } from '../../tickets/ticket-create/ticket-create';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TicketCreateComponent],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss'
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private ticketService = inject(TicketService);
  private userService = inject(UserService);

  project?: ProjectResponse;
  tickets: TicketResponse[] = [];
  statuses: StatusResponse[] = [];
  members: UserResponse[] = [];
  projectStatus?: StatusProject;
  sprints: SprintResponse[] = [];
  recentActivity: ActivityProject[] = [];
  dueTickets: DueTickets[] = [];
  projectMembers: ProjectMemberWithUser[] = [];
  membersData: ProjectMemberWithUser[] = [];
  isLoading = true;
  activeTab: 'summary' | 'backlog' | 'board' = 'summary';
  showTicketModal = false;
  showMembersModal = false;
  showAddMemberForm = false;
  
  showSprintModal = false;
  showStatusModal = false;
  showActivityModal = false;
  showDeleteMemberModal = false;
  memberToDelete: number | null = null;
  allActivity: ActivityProject[] = [];
  editingSprint: SprintResponse | null = null;
  editingStatus: StatusResponse | null = null;
  toastMessage = '';
  toastType: 'success' | 'error' | '' = '';

  newSprint = {
    name: '',
    start_date: '',
    end_date: '',
    status: 'planificado' as 'planificado' | 'activo' | 'completado',
    is_active: false
  };

  newStatus = {
    name: '',
    order: 0
  };

  backlogFilter = '';
  boardSearchTerm = '';
  selectedSprintId: number | null = null;
  showCreateTicketForStatus: number | null = null;
  initialStatusForNewTicket: number | null = null;
  selectedUserForAdd: UserResponse | null = null;
  editingTicket: TicketResponse | null = null;

  draggedTicket: TicketResponse | null = null;
  editingStatusId: number | null = null;
  editingStatusName = '';

  newMemberEmail = '';
  newMemberRole: 'admin' | 'developer' | 'qa' | 'viewer' = 'developer';
  availableRoles = ['admin', 'developer', 'qa', 'viewer'] as const;
  memberSearch = '';
  searchResults: UserResponse[] = [];
  showNoResults = false;
  private searchTimeout: any;


  backlogTickets: backlogTicketsResponse[] = [];
  backlogPage = 1;
  backlogPageSize = 10;
  backlogTotalCount = 0;
  backlogTotalPages = 1;
  backlogLoading = false;
  private backlogSearchTimeout: any;
  
  statusesWithTickets: StatusWithTickets[] = [];
  
  

  currentUserEmail = '';
  currentUserId: number | null = null;
  currentUserRole: 'admin' | 'developer' | 'qa' | 'viewer' | null = null;

  

  

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProjectData(+id);
      }
    });

    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    const userStr = localStorage.getItem('user_data');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserEmail = user.email;
      this.currentUserId = user.id;
    }
  }

  getCurrentUserRoleInProject(): 'admin' | 'developer' | 'qa' | 'viewer' | null {
    if (!this.currentUserId || !this.projectMembers.length) return null;
    const member = this.projectMembers.find(m => m.user.id === this.currentUserId);
    return member ? member.role : null;
  }

  canEditRole(): boolean {
    return this.getCurrentUserRoleInProject() === 'admin';
  }

  canDeleteMember(memberRole: string): boolean {
    const currentRole = this.getCurrentUserRoleInProject();
    if (currentRole === 'admin') return true;
    if (memberRole === 'admin') return false;
    return currentRole === null;
  }

  loadProjectData(id: number): void {
    this.isLoading = true;
    forkJoin({
      project: this.projectService.getProject(id),
      projectStatus: this.projectService.getProjectStatus(id),
      recentActivity: this.projectService.getRecentActivity(id)
    }).subscribe({
      next: (data) => {
        this.project = data.project;
        this.projectStatus = data.projectStatus || { id, tickets_count: 0, sprints_count: 0, statuses: [] };
        this.recentActivity = data.recentActivity || [];
        this.isLoading = false;
        this.loadDueTickets(id);
        this.loadMembers(id);
        this.loadTicketsAndStatuses();
      },
      error: (err) => {
        console.error('Error loading project data:', err);
        this.isLoading = false;
      }
    });
  }

  loadDueTickets(projectId: number): void {
    this.projectService.getDueTickets(projectId).subscribe({
      next: (data) => {
        this.dueTickets = data && data.length > 0 ? data : [];
      },
      error: (err) => {
        console.error('Error loading due tickets:', err);
        this.dueTickets = [];
      }
    });
  }

  loadMembers(projectId: number): void {
    this.projectService.getMembers(projectId).subscribe({
      next: (data: ProjectMemberWithUser[]) => {
        this.projectMembers = data && data.length > 0 ? data : [];
        this.membersData = this.projectMembers;
        this.members = this.projectMembers.map(m => m.user);
      },
      error: (err) => {
        console.error('Error loading members:', err);
        this.projectMembers = [];
        this.membersData = [];
        this.members = [];
      }
    });
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



  deleteMember(): void {
    if (!this.project || !this.memberToDelete) return;
    const member = this.membersData.find(m => m.user.id === this.memberToDelete);
    if (!member) return;
    
    this.projectService.removeMember(this.project!.id, member.id).subscribe({
      next: () => {
        this.membersData = this.membersData.filter(m => m.user.id !== this.memberToDelete);
        this.members = this.membersData.map(m => m.user);
        this.showDeleteMemberModal = false;
        this.memberToDelete = null;
      },
      error: (err) => {
        console.error('Error deleting member:', err);
      }
    });
  }

  getDueTicketClass(message?: string): string {
    if (!message) return 'border-danger';
    const lower = message.toLowerCase();
    if (lower.includes('hoy')) {
      return 'border-danger';
    } else if (lower.includes('mañana')) {
      return 'border-warning';
    }
    return 'border-danger';
  }

  setTab(tab: 'summary' | 'backlog' | 'board'): void {
    this.activeTab = tab;
    if (tab === 'backlog' && this.project) {
      this.loadBacklogTickets();
    }
    if (tab === 'board' && this.project) {
      this.loadTicketsByStatus(true, this.boardSearchTerm);
    }
  }

  loadTicketsAndStatuses(): void {
    if (!this.project) return;
    this.isLoading = true;
    this.ticketService.getSprints(this.project.id).subscribe({
      next: (sprints) => {
        this.sprints = sprints || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading sprints:', err);
        this.sprints = [];
        this.isLoading = false;
      }
    });
  }

  loadTicketsByStatus(paginated = true, searchTerm = ''): void {
    if (!this.project) return;
    this.isLoading = true;
    this.ticketService.getTicketsByStatus(this.project.id, {
      paginated,
      search_term: searchTerm || undefined
    }).subscribe({
      next: (response) => {
        this.statusesWithTickets = response.results && response.results.length > 0 ? response.results : [];
        this.statuses = this.statusesWithTickets.map(s => ({
          id: s.id,
          name: s.name,
          order: s.order,
          created_by: {} as UserResponse,
          is_active: true,
          project: this.project!.id
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading tickets by status:', err);
        this.statusesWithTickets = [];
        this.isLoading = false;
      }
    });
  }

  createSprint(): void {
    if (!this.project || !this.newSprint.name) return;

    if (this.newSprint.status === 'activo') {
      const activeSprint = this.sprints.find(s => s.status === 'activo');
      if (activeSprint) {
        this.showToast('Ya existe un sprint activo. Finalízalo primero antes de crear otro.', 'error');
        return;
      }
    }

    const sprintData = {
      name: this.newSprint.name,
      start_date: this.newSprint.start_date,
      end_date: this.newSprint.end_date,
      status: this.newSprint.status
    };

    this.ticketService.createSprint(this.project.id, sprintData).subscribe({
      next: (sprint) => {
        this.sprints = [...this.sprints, sprint];
        this.showSprintModal = false;
        this.resetNewSprint();
        this.showToast('Sprint creado correctamente', 'success');
      },
      error: (err) => {
        console.error('Error creating sprint:', err);
        this.showToast('Error al crear el sprint', 'error');
      }
    });
  }

  deleteSprint(sprintId: number): void {
    this.ticketService.deleteSprint(sprintId).subscribe({
      next: () => {
        this.sprints = this.sprints.filter(s => s.id !== sprintId);
        this.tickets = this.tickets.map(t => t.sprint === sprintId ? { ...t, sprint: undefined } : t);
      },
      error: (err) => console.error('Error deleting sprint:', err)
    });
  }

 

  createStatus(): void {
    if (!this.project || !this.newStatus.name) return;
    this.projectService.createStatusByProject(this.project.id, this.newStatus.name).subscribe({
      next: (status) => {
        this.statuses = [...this.statuses, status];
        this.showStatusModal = false;
        this.newStatus = { name: '', order: 0 };
        this.showToast('Estado creado correctamente', 'success');
      },
      error: (err) => {
        console.error('Error creating status:', err);
        this.showToast('Error al crear el estado', 'error');
      }
    });
  }

  updateStatusName(status: StatusResponse, newName: string): void {
    this.ticketService.updateStatus(status.id, { name: newName }).subscribe({
      next: (updated) => {
        status.name = updated.name;
      },
      error: (err) => console.error('Error updating status:', err)
    });
  }

  deleteStatus(statusId: number): void {
    const ticketsInStatus = this.tickets.filter(t => t.status.id === statusId);
    if (ticketsInStatus.length > 0) {
      alert('No se puede eliminar el estado porque tiene tickets asociados');
      return;
    }
    this.ticketService.deleteStatus(statusId).subscribe({
      next: () => {
        this.statuses = this.statuses.filter(s => s.id !== statusId);
      },
      error: (err) => console.error('Error deleting status:', err)
    });
  }

  moveTicketToSprint(ticketId: number, sprintId: number | null): void {
    if (!this.project) return;

    const sprintName = sprintId
      ? this.sprints.find(s => s.id === sprintId)?.name 
      : 'backlog';

    this.ticketService
      .assignTicketToSprint(ticketId, this.project.id, sprintId)
      .subscribe({
        next: () => {
          // 🔄 Recargar todo desde backend (estado real)
          this.loadTicketsAndStatuses();
          this.loadBacklogTickets();
          // Feedback al usuario
          this.showToast(
            `Ticket movido al ${sprintName || 'backlog'} correctamente`,
            'success'
          );
        },
        error: (err) => {
          console.error('Error moving ticket:', err?.error || err);

          this.showToast(
            err?.error?.detail || 'Error al mover el ticket',
            'error'
          );
        }
      });
  }

  moveTicketToStatus(ticketId: number, statusId: number): void {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    const status = this.statuses.find(s => s.id === statusId);
    if (!status) return;
    this.ticketService.moveTicketToStatus(ticketId, statusId).subscribe({
      next: () => {
        this.tickets = this.tickets.map(t => t.id === ticketId ? { ...t, status } : t);
      },
      error: (err) => console.error('Error moving ticket:', err)
    });
  }

  loadBacklogTickets(): void {
    if (!this.project) return;
    this.backlogLoading = true;
    this.ticketService.getBacklogTickets(this.project.id, {
      page: this.backlogPage,
      page_size: this.backlogPageSize,
      search_term: this.backlogFilter || undefined
    }).subscribe({
      next: (response) => {
        this.backlogTickets = response.results || [];
        this.backlogTotalCount = response.count || 0;
        this.backlogTotalPages = Math.ceil(this.backlogTotalCount / this.backlogPageSize) || 1;
        this.backlogLoading = false;
      },
      error: (err) => {
        console.error('Error loading backlog tickets:', err);
        this.backlogTickets = [];
        this.backlogLoading = false;
      }
    });
  }
  onBacklogSearchInput(): void {
    if (this.backlogSearchTimeout) {
      clearTimeout(this.backlogSearchTimeout);
    }
    this.backlogSearchTimeout = setTimeout(() => {
      this.backlogPage = 1;
      this.loadBacklogTickets();
    }, 300);
  }

  previousBacklogPage(): void {
    if (this.backlogPage > 1) {
      this.backlogPage--;
      this.loadBacklogTickets();
    }
  }

  nextBacklogPage(): void {
    if (this.backlogPage < this.backlogTotalPages) {
      this.backlogPage++;
      this.loadBacklogTickets();
    }
  }
  getTicketsBySprint(sprintId: number): TicketResponse[] {
    return this.tickets.filter(t => t.sprint === sprintId);
  }

  getPriorityOrder(priority: string): number {
    const p = priority?.toLowerCase();
    const order: Record<string, number> = {
      'crítica': 0, 'urgente': 0, urgent: 0,
      'alta': 1, high: 1,
      'media': 2, medium: 2,
      'baja': 3, low: 3,
      'muy_baja': 4, 'very low': 4
    };
    return order[p] ?? 5;
  }

  getPriorityClass(priority: string): string {
    const p = priority?.toLowerCase();
    switch (p) {
      case 'crítica':
      case 'urgente':
      case 'urgent': return 'text-danger';
      case 'alta':
      case 'high': return 'text-warning';
      case 'media':
      case 'medium': return 'text-primary';
      default: return 'text-muted';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    const p = priority?.toLowerCase();
    switch (p) {
      case 'crítica':
      case 'urgente':
      case 'urgent': return 'bg-danger-subtle text-danger';
      case 'alta':
      case 'high': return 'bg-warning-subtle text-warning';
      case 'media':
      case 'medium': return 'bg-primary-subtle text-primary';
      case 'baja':
      case 'low': return 'bg-secondary-subtle text-muted';
      default: return 'bg-light text-muted';
    }
  }

  toggleSprintModal(sprint?: SprintResponse): void {
    if (sprint) {
      this.editingSprint = sprint;
      this.newSprint = {
        name: sprint.name,
        start_date: sprint.start_date.split('T')[0],
        end_date: sprint.end_date.split('T')[0],
        status: sprint.status,
        is_active: sprint.is_active
      };
    } else {
      this.editingSprint = null;
      this.newSprint = { name: '', start_date: '', end_date: '', status: 'planificado', is_active: false };
    }
    this.showSprintModal = !this.showSprintModal;
  }

  resetNewSprint(): void {
    this.newSprint = { name: '', start_date: '', end_date: '', status: 'planificado', is_active: false };
  }

  toggleStatusModal(status?: StatusResponse): void {
    if (status) {
      this.editingStatus = status;
      this.newStatus = { name: status.name, order: status.order };
    } else {
      this.editingStatus = null;
      this.newStatus = { name: '', order: this.statuses.length + 1 };
    }
    this.showStatusModal = !this.showStatusModal;
  }

  startEditStatus(status: StatusResponse): void {
    this.editingStatusId = status.id;
    this.editingStatusName = status.name;
  }

  saveStatusName(status: StatusResponse): void {
    if (this.editingStatusName && this.editingStatusName !== status.name) {
      this.updateStatusName(status, this.editingStatusName);
    }
    this.editingStatusId = null;
    this.editingStatusName = '';
  }

  onDragStart(event: DragEvent, ticket: any) {
    event.dataTransfer?.setData('ticketId', ticket.id.toString());
  }
  

  openCreateTicketForStatus(statusId: number): void {
    this.initialStatusForNewTicket = statusId;
    this.showTicketModal = true;
  }

  toggleTicketModal(): void {
    this.showTicketModal = !this.showTicketModal;
    if (!this.showTicketModal) {
      this.editingTicket = null;
      this.initialStatusForNewTicket = null;
    }
  }

  toggleMembersModal(): void {
    this.showMembersModal = !this.showMembersModal;
    this.showAddMemberForm = false;
    this.newMemberEmail = '';
  }

  toggleAddMemberForm(): void {
    this.showAddMemberForm = !this.showAddMemberForm;
    this.newMemberEmail = '';
  }

  addMember(): void {
    if (!this.project || !this.selectedUserForAdd) return;

    const memberData = {
      user: this.selectedUserForAdd.id,
      role: this.newMemberRole
    };

    this.projectService.addMember(this.project.id, memberData).subscribe({
      next: (member) => {
        this.loadMembers(this.project!.id);
        this.showAddMemberForm = false;
        this.memberSearch = '';
        this.selectedUserForAdd = null;
        this.searchResults = [];
        this.showNoResults = false;
        this.showToast('Miembro agregado correctamente', 'success');
      },
      error: (err: any) => {
        console.error('Error adding member:', err);
        this.showAddMemberForm = false;
        this.memberSearch = '';
        this.selectedUserForAdd = null;
        this.showToast('Error al agregar miembro', 'error');
      }
    });
  }

  updateMemberRole(memberId: number, newRole: string): void {
    if (!this.project) return;
    
    const member = this.projectMembers.find(m => m.id === memberId);
    if (!member || member.role === newRole) return;

    this.projectService.updateMemberRole(this.project.id, memberId, { role: newRole }).subscribe({
      next: () => {
        const index = this.projectMembers.findIndex(m => m.id === memberId);
        if (index !== -1) {
          this.projectMembers[index] = { ...this.projectMembers[index], role: newRole as 'admin' | 'developer' | 'qa' | 'viewer' };
        }
        this.showToast('Rol actualizado correctamente', 'success');
      },
      error: (err) => {
        console.error('Error updating role:', err);
        this.showToast('Error al actualizar el rol', 'error');
      }
    });
  }

  confirmDeleteMember(memberId: number): void {
    if (!this.project) return;
    
    if (confirm('¿Estás seguro de que deseas eliminar este miembro del proyecto?')) {
      this.projectService.removeMember(this.project.id, memberId).subscribe({
        next: () => {
          this.projectMembers = this.projectMembers.filter(m => m.id !== memberId);
          this.showToast('Miembro eliminado correctamente', 'success');
        },
        error: (err) => {
          console.error('Error removing member:', err);
          this.showToast('Error al eliminar el miembro', 'error');
        }
      });
    }
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = '';
      this.toastType = '';
    }, 3000);
  }

  searchUsers(query: string): void {
    if (!this.project || query.length < 2) {
      this.searchResults = [];
      this.showNoResults = false;
      return;
    }
    this.userService.searchUsers(query, this.project.id).subscribe({
      next: (users) => {
        this.searchResults = users;
        this.showNoResults = users.length === 0;
      },
      error: () => {
        this.searchResults = [];
        this.showNoResults = false;
      }
    });
  }

  onSearchInput(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.searchUsers(this.memberSearch);
    }, 300);
  }

  selectUser(user: UserResponse): void {
    this.selectedUserForAdd = user;
    this.memberSearch = `${user.first_name} ${user.last_name} (${user.email})`;
    this.searchResults = [];
  }

  clearSelectedUser(): void {
    this.selectedUserForAdd = null;
    this.memberSearch = '';
    this.searchResults = [];
  }

  getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      admin: 'var(--primary)',
      developer: 'var(--success)',
      qa: 'var(--warning)',
      viewer: 'var(--ink-tertiary)'
    };
    return colors[role] || 'var(--ink-tertiary)';
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      developer: 'Desarrollador',
      qa: 'QA',
      viewer: 'Visor'
    };
    return labels[role] || role;
  }

  getTicketsByStatus(statusId: number): TicketResponse[] {
    const statusData = this.statusesWithTickets.find(s => s.id === statusId);
    if (statusData && statusData.tickets) {
      return statusData.tickets as unknown as TicketResponse[];
    }
    return this.tickets.filter(t => t.status.id === statusId);
  }

  onTicketCreated(newTicket: TicketResponse): void {
    if (this.initialStatusForNewTicket) {
      const status = this.statuses.find(s => s.id === this.initialStatusForNewTicket);
      if (status) {
        newTicket = { ...newTicket, status };
      }
    }
    this.tickets = [...this.tickets, newTicket];
    this.showTicketModal = false;
    this.initialStatusForNewTicket = null;
    this.showToast('Ticket creado correctamente', 'success');
    this.loadBacklogTickets();
    this.loadTicketsByStatus(true, this.boardSearchTerm);
  }

  editTicket(ticket: TicketResponse): void {
    this.editingTicket = ticket;
    this.showTicketModal = true;
  }

  formatSprintDates(startDate: string, endDate: string): string {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('es-ES', options)} - ${end.toLocaleDateString('es-ES', options)}`;
  }

  startSprint(sprint: SprintResponse): void {
    if (!this.project) return;
    this.ticketService.updateSprintStatus(sprint.id, this.project.id, 'activo').subscribe({
      next: () => {
        this.sprints = this.sprints.map(s => s.id === sprint.id ? { ...s, is_active: true, status: 'activo' } : s);
        this.loadTicketsAndStatuses();
        this.showToast('Sprint iniciado correctamente', 'success');
      },
      error: (err) => console.error('Error starting sprint:', err)
    });
  }

  onDropToSprint(event: DragEvent, sprintId: number): void {
    event.preventDefault();

    const ticketId = Number(event.dataTransfer?.getData('ticketId'));

    if (!ticketId) return;

    this.moveTicketToSprint(ticketId, sprintId);
  }

  onDropToBacklog(event: DragEvent): void {
    event.preventDefault();

    const ticketId = Number(event.dataTransfer?.getData('ticketId'));

    if (!ticketId) return;

    this.moveTicketToSprint(ticketId, null);
  }

  deleteTicket(ticketId: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este ticket?')) {
      this.ticketService.deleteTicket(ticketId).subscribe({
        next: () => {
          this.tickets = this.tickets.filter(t => t.id !== ticketId);
        },
        error: (err) => console.error('Error deleting ticket:', err)
      });
    }
  }

  onTicketUpdated(updatedTicket: TicketResponse): void {
    this.tickets = this.tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t);
    this.showTicketModal = false;
    this.editingTicket = null;
    this.initialStatusForNewTicket = null;
  }


  getPriorityColor(priority: string): string {
    const p = priority?.toLowerCase();
    const colors: Record<string, string> = {
      critical: '#DC2626',
      crítica: '#EA580C',
      alta: '#CA8A04',
      high: '#CA8A04',
      media: '#7C3AED',
      medium: '#7C3AED',
      baja: '#64748B',
      low: '#64748B',
      muy_baja: '#94A3B8',
      'very low': '#94A3B8'
    };
    return colors[p || ''] || '#64748B';
  }


  
  getTypeIcon(type: string): string {
    const t = type?.toLowerCase();
    const icons: Record<string, string> = {
      bug: 'bi-bug',
      tarea: 'bi-check2-square',
      historia: 'bi-book',
      mejora: 'bi-arrow-up-circle',
      épica: 'bi-lightning'
    };
    return icons[t || ''] || 'bi-circle';
  }
  

  formatActivityMessage(message: string): string {
    if (!message) return '';
    let formatted = message;
    formatted = formatted.replace(/^([^\s]+)/, '<strong class="text-dark fw-bold">$1</strong>');
    formatted = formatted.replace(/#[\w-]+/g, '<strong class="text-primary fw-bold">$&</strong>');
    formatted = formatted.replace(/'([^']+)'/g, '<strong class="text-dark fw-bold">\'$1\'</strong>');
    return formatted;
  }

  formatTimeAgo(timeAgo: string): string {
    if (!timeAgo) return '';
    
    const translations: { [key: string]: string } = {
      'hour ago': 'hace una hora',
      'hours ago': 'hace horas',
      'day ago': 'hace un día',
      'days ago': 'hace días',
      'minute ago': 'hace un minuto',
      'minutes ago': 'hace minutos',
      'second ago': 'hace un segundo',
      'seconds ago': 'hace segundos',
      'week ago': 'hace una semana',
      'weeks ago': 'hace semanas',
      'month ago': 'hace un mes',
      'months ago': 'hace meses'
    };

    const lower = timeAgo.toLowerCase();
    for (const [eng, esp] of Object.entries(translations)) {
      if (lower.includes(eng)) {
        return timeAgo.replace(new RegExp(eng, 'gi'), esp);
      }
    }
    return timeAgo;
  }

  openActivityModal(): void {
    this.allActivity = this.recentActivity;
    this.showActivityModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeActivityModal(): void {
    this.showActivityModal = false;
    document.body.style.overflow = '';
  }
}