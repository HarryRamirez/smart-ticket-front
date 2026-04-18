import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../../../core/services/layout.service';
import { ProjectService } from '../../../../core/services/project.service';
import { ProjectResponse } from '../../../../core/models/entities';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent implements OnInit {
  layoutService = inject(LayoutService);
  projectService = inject(ProjectService);
  
  isCollapsed = this.layoutService.isSidebarCollapsed;
  recentProjects: ProjectResponse[] = [];
  isRecentProjectsOpen = true;

  ngOnInit() {
    this.loadRecentProjects();
  }

  loadRecentProjects() {
    this.projectService.getProjects({ paginate: false }).subscribe(response => {
      this.recentProjects = response.results.slice(0, 5);
    });
  }

  toggleCollapse() {
    this.layoutService.toggleSidebar();
  }

  toggleRecentProjects() {
    this.isRecentProjectsOpen = !this.isRecentProjectsOpen;
  }
}