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
  DueTickets
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
  
  mockUsers: UserResponse[] = [
    { id: 10, username: 'juan.perez', email: 'juan.perez@empresa.com', first_name: 'Juan', last_name: 'Pérez' },
    { id: 11, username: 'ana.lopez', email: 'ana.lopez@empresa.com', first_name: 'Ana', last_name: 'López' },
    { id: 12, username: 'carlos.martinez', email: 'carlos.martinez@empresa.com', first_name: 'Carlos', last_name: 'Martínez' },
    { id: 13, username: 'maria.garcia', email: 'maria.garcia@empresa.com', first_name: 'María', last_name: 'García' },
    { id: 14, username: 'luis.rodriguez', email: 'luis.rodriguez@empresa.com', first_name: 'Luis', last_name: 'Rodríguez' }
  ];

  currentUserEmail = '';

  mockStatuses: StatusResponse[] = [
    { id: 1, name: 'Por hacer', created_by: {} as UserResponse, order: 1, is_active: true, project: 1 },
    { id: 2, name: 'En progreso', created_by: {} as UserResponse, order: 2, is_active: true, project: 1 },
    { id: 3, name: 'En revisión', created_by: {} as UserResponse, order: 3, is_active: true, project: 1 },
    { id: 4, name: 'Completado', created_by: {} as UserResponse, order: 4, is_active: true, project: 1 }
  ];

  mockTickets: TicketResponse[] = [
    {
      id: 1, project: 1, key: 'PROJ-1', title: 'Implementar autenticación con JWT',
      description: 'Implementar sistema de autenticación usando JWT tokens', category: 'Desarrollo',
      summary: 'Auth JWT', suggested_solution: 'Usar angular-jwt', status: this.mockStatuses[0],
      priority: 'high', type: 'task', reporter: { id: 1, username: 'juan.perez', email: 'juan.perez@empresa.com', first_name: 'Juan', last_name: 'Pérez' },
      assigned_to: { id: 2, username: 'ana.lopez', email: 'ana.lopez@empresa.com', first_name: 'Ana', last_name: 'López' },
      sprint: 1, labels: [], created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 2, project: 1, key: 'PROJ-2', title: 'Corregir bug en el formulario de login',
      description: 'El formulario de login no valida correctamente el email', category: 'Bug',
      summary: 'Bug login', suggested_solution: 'Revisar validación', status: this.mockStatuses[1],
      priority: 'urgent', type: 'bug', reporter: { id: 3, username: 'carlos.martinez', email: 'carlos.martinez@empresa.com', first_name: 'Carlos', last_name: 'Martínez' },
      assigned_to: { id: 1, username: 'juan.perez', email: 'juan.perez@empresa.com', first_name: 'Juan', last_name: 'Pérez' },
      sprint: 1, labels: [], created_at: '2024-01-14T09:00:00Z', updated_at: '2024-01-14T09:00:00Z'
    },
    {
      id: 3, project: 1, key: 'PROJ-3', title: ' Diseñar dashboard principal',
      description: 'Crear mockups para el dashboard del proyecto', category: 'Diseño',
      summary: 'UI Dashboard', suggested_solution: 'Figma', status: this.mockStatuses[2],
      priority: 'medium', type: 'story', reporter: { id: 1, username: 'juan.perez', email: 'juan.perez@empresa.com', first_name: 'Juan', last_name: 'Pérez' },
      assigned_to: { id: 4, username: 'maria.garcia', email: 'maria.garcia@empresa.com', first_name: 'María', last_name: 'García' },
      sprint: 1, labels: [], created_at: '2024-01-13T14:00:00Z', updated_at: '2024-01-13T14:00:00Z'
    },
    {
      id: 4, project: 1, key: 'PROJ-4', title: 'Configurar pipeline de CI/CD',
      description: 'Setup GitHub Actions para build y deploy automático', category: 'DevOps',
      summary: 'CI/CD', suggested_solution: 'GitHub Actions', status: this.mockStatuses[3],
      priority: 'high', type: 'task', reporter: { id: 2, username: 'ana.lopez', email: 'ana.lopez@empresa.com', first_name: 'Ana', last_name: 'López' },
      assigned_to: { id: 5, username: 'luis.rodriguez', email: 'luis.rodriguez@empresa.com', first_name: 'Luis', last_name: 'Rodríguez' },
      sprint: 1, labels: [], created_at: '2024-01-12T11:00:00Z', updated_at: '2024-01-12T11:00:00Z'
    },
    {
      id: 5, project: 1, key: 'PROJ-5', title: 'Optimizar consultas de base de datos',
      description: 'Las queries del dashboard están lentas', category: 'Backend',
      summary: 'Performance DB', suggested_solution: 'Agregar índices', status: this.mockStatuses[0],
      priority: 'medium', type: 'improvement', reporter: { id: 3, username: 'carlos.martinez', email: 'carlos.martinez@empresa.com', first_name: 'Carlos', last_name: 'Martínez' },
      sprint: 2, labels: [], created_at: '2024-01-11T16:00:00Z', updated_at: '2024-01-11T16:00:00Z'
    },
    {
      id: 6, project: 1, key: 'PROJ-6', title: 'Agregar validación de formularios',
      description: 'Implementar validación reactiva en todos los forms', category: 'Desarrollo',
      summary: 'Form validation', suggested_solution: 'Angular Forms', status: this.mockStatuses[1],
      priority: 'medium', type: 'task', reporter: { id: 1, username: 'juan.perez', email: 'juan.perez@empresa.com', first_name: 'Juan', last_name: 'Pérez' },
      assigned_to: { id: 2, username: 'ana.lopez', email: 'ana.lopez@empresa.com', first_name: 'Ana', last_name: 'López' },
      sprint: 2, labels: [], created_at: '2024-01-10T08:00:00Z', updated_at: '2024-01-10T08:00:00Z'
    },
    {
      id: 7, project: 1, key: 'PROJ-7', title: 'Bug: Error 500 en API de usuarios',
      description: 'El endpoint de usuarios devuelve 500', category: 'Bug',
      summary: 'API 500', suggested_solution: 'Fix null pointer', status: this.mockStatuses[0],
      priority: 'urgent', type: 'bug', reporter: { id: 4, username: 'maria.garcia', email: 'maria.garcia@empresa.com', first_name: 'María', last_name: 'García' },
      labels: [], created_at: '2024-01-09T12:00:00Z', updated_at: '2024-01-09T12:00:00Z'
    },
    {
      id: 8, project: 1, key: 'PROJ-8', title: 'Documentar API REST',
      description: 'Crear documentación con Swagger', category: 'Documentación',
      summary: 'API Docs', suggested_solution: 'Swagger', status: this.mockStatuses[2],
      priority: 'low', type: 'task', reporter: { id: 5, username: 'luis.rodriguez', email: 'luis.rodriguez@empresa.com', first_name: 'Luis', last_name: 'Rodríguez' },
      assigned_to: { id: 3, username: 'carlos.martinez', email: 'carlos.martinez@empresa.com', first_name: 'Carlos', last_name: 'Martínez' },
      sprint: 2, labels: [], created_at: '2024-01-08T15:00:00Z', updated_at: '2024-01-08T15:00:00Z'
    },
    {
      id: 9, project: 1, key: 'PROJ-9', title: 'Implementar notificaciones push',
      description: 'Agregar soporte para notificaciones en tiempo real', category: 'Desarrollo',
      summary: 'Push notifications', suggested_solution: 'Firebase', status: this.mockStatuses[0],
      priority: 'medium', type: 'story', reporter: { id: 1, username: 'juan.perez', email: 'juan.perez@empresa.com', first_name: 'Juan', last_name: 'Pérez' },
      labels: [], created_at: '2024-01-07T10:00:00Z', updated_at: '2024-01-07T10:00:00Z'
    },
    {
      id: 10, project: 1, key: 'PROJ-10', title: 'Refactorizar código del componente proyectos',
      description: 'Limpiar código y aplicar mejores prácticas', category: 'Refactoring',
      summary: 'Refactor', suggested_solution: 'Clean code', status: this.mockStatuses[3],
      priority: 'low', type: 'improvement', reporter: { id: 2, username: 'ana.lopez', email: 'ana.lopez@empresa.com', first_name: 'Ana', last_name: 'López' },
      assigned_to: { id: 1, username: 'juan.perez', email: 'juan.perez@empresa.com', first_name: 'Juan', last_name: 'Pérez' },
      sprint: 1, labels: [], created_at: '2024-01-06T09:00:00Z', updated_at: '2024-01-06T09:00:00Z'
    }
  ];

  get filteredUsers(): UserResponse[] {
    if (!this.memberSearch || this.memberSearch.length < 2 || this.selectedUserForAdd) return [];
    const search = this.memberSearch.toLowerCase();
    return this.mockUsers.filter(user =>
      (user.email.toLowerCase().includes(search) || 
       user.first_name.toLowerCase().includes(search) ||
       user.last_name.toLowerCase().includes(search)) &&
      !this.members.some(m => m.id === user.id)
    );
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProjectData(+id);
    }
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    const userStr = localStorage.getItem('user_data');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserEmail = user.email;
    }
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
        this.projectStatus = data.projectStatus || { id, tickets: 0, sprints: 0, statuses: [] };
        this.recentActivity = data.recentActivity || [];
        this.isLoading = false;
        this.loadDueTickets(id);
        this.loadMembers(id);
      },
      error: (err) => {
        console.error('Error loading project data:', err);
        this.loadMockDataForDemo(id);
        this.isLoading = false;
      }
    });
  }

  loadMockDataForDemo(id: number): void {
    this.project = {
      id: id,
      name: 'Proyecto Demo',
      description: 'Proyecto de demostración',
      key: 'DEMO',
      created_by: { id: 1, username: 'admin', email: 'admin@test.com', first_name: 'Admin', last_name: 'User' },
      created_at: new Date().toISOString(),
      members: [],
      members_count: 0
    };
    this.projectStatus = { id, tickets: 10, sprints: 2, statuses: [] };
    this.recentActivity = [];
    this.loadDueTickets(id);
    this.loadMembers(id);
  }

  loadDueTickets(projectId: number): void {
    this.projectService.getDueTickets(projectId).subscribe({
      next: (data) => {
        this.dueTickets = data && data.length > 0 ? data : this.getMockDueTickets();
      },
      error: (err) => {
        console.error('Error loading due tickets:', err);
        this.dueTickets = this.getMockDueTickets();
      }
    });
  }

  getMockDueTickets(): DueTickets[] {
    return [
      { key: 'DEMO-1', title: 'Implementar login con JWT', message: 'Vence hoy' },
      { key: 'DEMO-2', title: 'Crear dashboard', message: 'Vence mañana' },
      { key: 'DEMO-3', title: 'Configurar CI/CD', message: 'Vence en 3 días' }
    ];
  }

  loadMembers(projectId: number): void {
    this.projectService.getMembers(projectId).subscribe({
      next: (data: ProjectMemberWithUser[]) => {
        this.projectMembers = data && data.length > 0 ? data : this.getMockMembers();
        this.membersData = this.projectMembers;
        this.members = this.projectMembers.map(m => m.user);
      },
      error: (err) => {
        console.error('Error loading members:', err);
        this.projectMembers = this.getMockMembers();
        this.membersData = this.projectMembers;
        this.members = this.projectMembers.map(m => m.user);
      }
    });
  }

  getMockMembers(): ProjectMemberWithUser[] {
    return [
      { id: 1, role: 'admin' as const, user: { id: 1, username: 'juan.perez', email: 'juan.perez@empresa.com', first_name: 'Juan', last_name: 'Pérez' }, project: '1' },
      { id: 2, role: 'developer' as const, user: { id: 2, username: 'ana.lopez', email: 'ana.lopez@empresa.com', first_name: 'Ana', last_name: 'López' }, project: '1' },
      { id: 3, role: 'developer' as const, user: { id: 3, username: 'carlos.martinez', email: 'carlos.martinez@empresa.com', first_name: 'Carlos', last_name: 'Martínez' }, project: '1' },
      { id: 4, role: 'qa' as const, user: { id: 4, username: 'maria.garcia', email: 'maria.garcia@empresa.com', first_name: 'María', last_name: 'García' }, project: '1' }
    ];
  }

  getMemberColor(userId: number): string {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e', '#0ea5e9'];
    return colors[userId % colors.length];
  }

  getInitials(user: UserResponse | any): string {
    if (!user) return '';
    if (user.avatar) return user.avatar;
    return (user.first_name?.[0] || '') + (user.last_name?.[0] || '');
  }

  updateMemberRole(userId: number, newRole: string): void {
    if (!this.project) return;
    const member = this.membersData.find(m => m.user.id === userId);
    if (!member) return;
    
    this.projectService.updateMemberRole(this.project.id, member.id, { role: newRole as any }).subscribe({
      next: () => {
        const index = this.membersData.findIndex(m => m.user.id === userId);
        if (index >= 0) {
          this.membersData[index].role = newRole as any;
        }
      },
      error: (err) => {
        console.error('Error updating role:', err);
      }
    });
  }

  confirmDeleteMember(userId: number): void {
    this.memberToDelete = userId;
    this.showDeleteMemberModal = true;
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
    if ((tab === 'backlog' || tab === 'board') && this.tickets.length === 0) {
      this.loadTicketsAndStatuses();
    }
  }

  loadTicketsAndStatuses(): void {
    if (!this.project) return;
    this.isLoading = true;
    forkJoin({
      tickets: this.ticketService.getTicketsByProject(this.project.id),
      statuses: this.ticketService.getStatusesByProject(this.project.id),
      sprints: this.ticketService.getSprints(this.project.id)
    }).subscribe({
      next: (data) => {
        this.tickets = data.tickets && data.tickets.length > 0 ? data.tickets : this.mockTickets;
        this.statuses = data.statuses && data.statuses.length > 0 ? data.statuses : this.mockStatuses;
        this.sprints = data.sprints || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading tickets:', err);
        this.tickets = this.mockTickets;
        this.statuses = this.mockStatuses;
        this.sprints = [];
        this.isLoading = false;
      }
    });
  }

  createSprint(): void {
    if (!this.project || !this.newSprint.name) return;
    const sprintData: CreateSprint = {
      project: this.project.id,
      ...this.newSprint
    };
    this.ticketService.createSprint(sprintData).subscribe({
      next: (sprint) => {
        this.sprints = [...this.sprints, sprint];
        this.showSprintModal = false;
        this.resetNewSprint();
      },
      error: (err) => console.error('Error creating sprint:', err)
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

  resetNewSprint(): void {
    this.newSprint = { name: '', start_date: '', end_date: '', status: 'planificado', is_active: false };
  }

  createStatus(): void {
    if (!this.project || !this.newStatus.name) return;
    const statusData: CreateStatus = {
      name: this.newStatus.name,
      order: this.statuses.length + 1,
      project: this.project.id
    };
    this.ticketService.createStatus(statusData).subscribe({
      next: (status) => {
        this.statuses = [...this.statuses, status];
        this.showStatusModal = false;
        this.newStatus = { name: '', order: 0 };
      },
      error: (err) => console.error('Error creating status:', err)
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
    this.ticketService.moveTicketToSprint(ticketId, sprintId).subscribe({
      next: () => {
        this.tickets = this.tickets.map(t => t.id === ticketId ? { ...t, sprint: sprintId ?? undefined } : t);
      },
      error: (err) => console.error('Error moving ticket to sprint:', err)
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

  get backlogTickets(): TicketResponse[] {
    let tickets = this.tickets.filter(t => !t.sprint);
    if (this.backlogFilter) {
      const filter = this.backlogFilter.toLowerCase();
      tickets = tickets.filter(t => 
        t.key.toLowerCase().includes(filter) || 
        t.title.toLowerCase().includes(filter)
      );
    }
    return tickets.sort((a, b) => this.getPriorityOrder(a.priority) - this.getPriorityOrder(b.priority));
  }

  getTicketsBySprint(sprintId: number): TicketResponse[] {
    return this.tickets.filter(t => t.sprint === sprintId);
  }

  getPriorityOrder(priority: string): number {
    const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3, 'very low': 4 };
    return order[priority] ?? 5;
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'urgent': return 'text-danger';
      case 'high': return 'text-warning';
      case 'medium': return 'text-primary';
      default: return 'text-muted';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'urgent': return 'bg-danger-subtle text-danger';
      case 'high': return 'bg-warning-subtle text-warning';
      case 'medium': return 'bg-primary-subtle text-primary';
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
      this.resetNewSprint();
    }
    this.showSprintModal = !this.showSprintModal;
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

  onDragStart(event: DragEvent, ticket: TicketResponse): void {
    this.draggedTicket = ticket;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDrop(event: DragEvent, statusId: number): void {
    event.preventDefault();
    if (this.draggedTicket) {
      this.moveTicketToStatus(this.draggedTicket.id, statusId);
      this.draggedTicket = null;
    }
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
      },
      error: (err: any) => {
        console.error('Error adding member:', err);
        this.showAddMemberForm = false;
        this.memberSearch = '';
        this.selectedUserForAdd = null;
      }
    });
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
  }

  editTicket(ticket: TicketResponse): void {
    this.editingTicket = ticket;
    this.showTicketModal = true;
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

  getJiraPriorityStyle(priority: string): string {
    const styles: Record<string, string> = {
      highest: 'background: #ffebe6; color: #bf2600; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; text-transform: uppercase;',
      critical: 'background: #ffebe6; color: #bf2600; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600;',
      urgent: 'background: #ffebe6; color: #de350b; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600;',
      high: 'background: #fff0b3; color: #172b4d; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600;',
      medium: 'background: #eae6ff; color: #403294; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600;',
      low: 'background: #ebecf0; color: #42526e; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600;',
      'very low': 'background: #ebecf0; color: #42526e; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600;'
    };
    const key = priority?.toLowerCase() || '';
    return styles[key] || styles['medium'];
  }

  getJiraStatusStyle(statusName: string): string {
    const name = statusName?.toLowerCase() || '';
    if (name.includes('done') || name.includes('completado')) {
      return 'background: #e3fcef; color: #006644; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600;';
    }
    if (name.includes('progress') || name.includes('progreso')) {
      return 'background: #deebff; color: #0052cc; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600;';
    }
    if (name.includes('review') || name.includes('revisión')) {
      return 'background: #fff0b3; color: #172b4d; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600;';
    }
    return 'background: #ebecf0; color: #42526e; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600;';
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