import { Route } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { DynamicPublicComponent } from './pages/dynamic/dynamic-public.component';

export const appRoutes: Route[] = [
	{ path: 'admin', loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES) },
		{
			path: '',
			loadComponent: () => import('./layout/site-layout.component').then(m => m.SiteLayoutComponent),
			children: [
			{ path: '', component: HomeComponent },
			// Wildcard público al final dentro del layout
			{ path: '**', component: DynamicPublicComponent },
		]
	},
];
