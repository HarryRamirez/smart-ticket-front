import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { ProjectResponse } from '../../core/models/entities';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './projects.html',
  styleUrl: './projects.scss'
})
export class ProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  
  projects: ProjectResponse[] = [];
  isLoading = true;

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.isLoading = true;
    this.projectService.getProjects().subscribe({
      next: (data) => {
        console.log('Projects response:', data);
        console.log('Projects results:', data.results);
        this.projects = data.results;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading projects:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        this.isLoading = false;
      }
    });
  }
}