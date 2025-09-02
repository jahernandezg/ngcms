import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { loginRedirectGuard } from './guards/login-redirect.guard';

export const ADMIN_ROUTES: Routes = [
  { path: 'login', canActivate: [loginRedirectGuard], loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent) },
  { path: 'reset-password', canActivate: [loginRedirectGuard], loadComponent: () => import('./auth/reset-password.component').then(m => m.ResetPasswordComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
  { path: 'dashboard', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'posts', canActivate: [roleGuard], data: { roles: ['ADMIN','AUTHOR'] }, loadComponent: () => import('./posts/post-list.component').then(m => m.PostListComponent) },
  { path: 'posts/new', canActivate: [roleGuard], data: { roles: ['ADMIN','AUTHOR'] }, loadComponent: () => import('./posts/post-editor.component').then(m => m.PostEditorComponent) },
  { path: 'posts/:id', canActivate: [roleGuard], data: { roles: ['ADMIN','AUTHOR'] }, loadComponent: () => import('./posts/post-editor.component').then(m => m.PostEditorComponent) },
  { path: 'pages', canActivate: [roleGuard], data: { roles: ['ADMIN','AUTHOR'] }, loadComponent: () => import('./pages/page-list.component').then(m => m.PageListComponent) },
  { path: 'pages/new', canActivate: [roleGuard], data: { roles: ['ADMIN','AUTHOR'] }, loadComponent: () => import('./pages/page-editor.component').then(m => m.PageEditorComponent) },
  { path: 'pages/:id', canActivate: [roleGuard], data: { roles: ['ADMIN','AUTHOR'] }, loadComponent: () => import('./pages/page-editor.component').then(m => m.PageEditorComponent) },
  { path: 'menu', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./menu/menu-list.component').then(m => m.MenuListComponent) },
  { path: 'themes', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./themes/theme-list.component').then(m => m.ThemeListComponent) },
  { path: 'themes/customize', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./themes/theme-customizer.component').then(m => m.ThemeCustomizerComponent) },
  { path: 'settings/branding', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./settings/branding.component').then(m => m.BrandingComponent) },
  { path: 'categories', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./taxonomy/category-list.component').then(m => m.CategoryListComponent) },
  { path: 'tags', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./taxonomy/tag-list.component').then(m => m.TagListComponent) },
  { path: 'settings/site', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./settings/site-settings.component').then(m => m.SiteSettingsComponent) },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
    ]
  }
];
