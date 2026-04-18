export interface UserResponse {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
}

export interface ProjectMemberWithUser {
  id: number;
  role: 'admin' | 'developer' | 'qa' | 'viewer';
  user: UserResponse;
  project: string;
}

export interface Statuses{
  id: number;
  name: string;
  total_tickets: number;
}
export interface StatusProject{
  id: number;
  tickets: number;
  sprints: number;
  statuses: Statuses[];
}

export interface ActivityProject{
  message: string;
  user: string;
  created_at: string;
  time_ago: string;
}

export interface DueTickets{
  key: string;
  title: string;
  message: string;
}


export interface CreateUser {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password?: string;
}

export interface UpdateUser {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: UserResponse;
}

export interface CreateAuth {
  username: string;
  password: string;
}

export interface ProjectResponse {
  id: number;
  name: string;
  description: string;
  key: string;
  created_by: UserResponse;
  created_at: string;
  members: UserResponse[];
  members_count: number;
}

export interface CreateProject {
  name: string;
  description: string;
  key: string;
}

export interface UpdateProject {
  name?: string;
  description?: string;
  key?: string;
}

export interface ProjectMemberResponse {
  id: number;
  project: number;
  user: UserResponse;
  role: 'admin' | 'developer' | 'qa' | 'viewer';
}

export interface CreateProjectMember {
  project: number;
  user: number;
  role: 'admin' | 'developer' | 'qa' | 'viewer';
}

export interface UpdateProjectMember {
  role?: 'admin' | 'developer' | 'qa' | 'viewer';
}

export interface SprintResponse {
  id: number;
  project: number;
  name: string;
  start_date: string;
  end_date: string;
  status: 'planificado' | 'activo' | 'completado';
  is_active: boolean;
}

export interface CreateSprint {
  project: number;
  name: string;
  start_date: string;
  end_date: string;
  status: 'planificado' | 'activo' | 'completado';
  is_active: boolean;
}

export interface UpdateSprint {
  project?: number;
  name?: string;
  start_date?: string;
  end_date?: string;
  status?: 'planificado' | 'activo' | 'completado';
  is_active?: boolean;
}

export interface StatusResponse {
  id: number;
  name: string;
  created_by: UserResponse;
  order: number;
  is_active: boolean;
  project: number;
}

export interface CreateStatus {
  name: string;
  order: number;
  project: number;
}

export interface UpdateStatus {
  name?: string;
  order?: number;
}

export interface LabelResponse {
  id: number;
  name: string;
  color: string;
}

export interface CreateLabel {
  name: string;
  color: string;
}

export interface UpdateLabel {
  name?: string;
  color?: string;
}

export interface TicketResponse {
  id: number;
  project: number;
  key: string;
  title: string;
  description: string;
  category: string;
  summary: string;
  suggested_solution: string;
  status: StatusResponse;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'bug' | 'task' | 'story' | 'improvement';
  reporter: UserResponse;
  assigned_to?: UserResponse;
  sprint?: number;
  labels: LabelResponse[];
  created_at: string;
  updated_at: string;
}

export interface CreateTicket {
  project: number;
  title: string;
  description: string;
  category: string;
  summary: string;
  suggested_solution: string;
  status: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'bug' | 'task' | 'story' | 'improvement';
  assigned_to?: number;
  sprint?: number;
  labels: number[];
}

export interface UpdateTicket {
  project?: number;
  title?: string;
  description?: string;
  category?: string;
  summary?: string;
  suggested_solution?: string;
  status?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  type?: 'bug' | 'task' | 'story' | 'improvement';
  assigned_to?: number | null;
  sprint?: number | null;
  labels?: number[];
}

export interface CommentResponse {
  id: number;
  ticket: number;
  user: UserResponse;
  content: string;
  created_at: string;
}

export interface CreateComment {
  ticket: number;
  content: string;
}

export interface UpdateComment {
  content?: string;
}

export interface TicketHistoryResponse {
  id: number;
  ticket: number;
  user: UserResponse;
  field: string;
  old_value: string;
  new_value: string;
  created_at: string;
}

export interface CreateTicketHistory {
  ticket: number;
  field: string;
  old_value: string;
  new_value: string;
}

export interface UpdateTicketHistory {
  field?: string;
  old_value?: string;
  new_value?: string;
}

export interface AISuggestionResponse {
  id: number;
  ticket: number;
  suggestion_type: string;
  content: string;
  created_at: string;
}

export interface CreateAISuggestion {
  ticket: number;
  suggestion_type: string;
  content: string;
}

export interface UpdateAISuggestion {
  suggestion_type?: string;
  content?: string;
}

