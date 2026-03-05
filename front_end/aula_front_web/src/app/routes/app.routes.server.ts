/*import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];*/



import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {path: '',renderMode: RenderMode.Server},
  {path: 'books',renderMode: RenderMode.Server},
  {path: 'add-book',  renderMode: RenderMode.Client},
  {path: 'edit-book/:id', renderMode: RenderMode.Client},
];