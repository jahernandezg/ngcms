import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaxonomyService } from './taxonomy.service';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AlertComponent } from '../components/alert.component';
import { LoadingDirective } from '../directives/loading.directive';
import { SpinnerComponent } from '../components/spinner.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertComponent, LoadingDirective, SpinnerComponent],
  // styles moved to global styles
  templateUrl: './category-list.component.html'
})
export class CategoryListComponent implements OnInit {
  svc = inject(TaxonomyService);
  fb = inject(FormBuilder);

  categories = this.svc.categories;
  formVisible = signal(false);
  editingSlug = signal<string | null>(null);
  busy = signal(false);
  success = signal<string | null>(null);
  error = signal<string | null>(null);
  private successTimer: ReturnType<typeof setTimeout> | null = null;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    parentSlug: ['']
  });

  ngOnInit() { this.svc.loadCategories(); }

  parentName(id?: string | null) {
    if(!id) return '';
    const found = this.categories().find(c => c.id === id);
    return found? found.name : '';
  }

  openCreate(){
    this.form.reset();
    this.editingSlug.set(null);
    this.formVisible.set(true);
  }
  startEdit(id: string){
    const cat = this.categories().find(c => c.id===id);
    if(!cat) return;
    this.editingSlug.set(cat.slug);
    // Backend espera parentSlug (slug del padre) o '' para limpiar
    const parentSlug = cat.parentId ? (this.categories().find(c => c.id===cat.parentId)?.slug || '') : '';
    this.form.patchValue({ name: cat.name, parentSlug });
    this.formVisible.set(true);
  }
  close(){
    if(this.busy()) return;
    this.formVisible.set(false);
  }
  submit(){
    if(this.form.invalid) return;
    this.busy.set(true);
  this.error.set(null);
  this.success.set(null);
    const value = this.form.value as { name?: string; parentSlug?: string };
    const name = value.name as string | undefined;
    if(!name) { this.busy.set(false); return; }
    const editing = this.editingSlug();
    const parentSlugCtl = value.parentSlug;
    const payload = editing
      ? { name, parentSlug: parentSlugCtl === '' ? '' : (parentSlugCtl || undefined) }
      : { name, parentSlug: parentSlugCtl || undefined };
    const obs = editing ? this.svc.updateCategory(editing, payload) : this.svc.createCategory(payload);
    obs.subscribe({
      next: () => {
        this.svc.loadCategories();
        this.busy.set(false);
        this.formVisible.set(false);
  this.success.set(this.editingSlug() ? 'Categoría actualizado' : 'Categoría creada');
    this.startAutoHideSuccess();
      },
      error: err => {
    const msg = (err?.error?.message || '').toString();
    this.error.set(/slug|unique/i.test(msg) ? 'Nombre duplicado' : 'Error guardando');
        this.busy.set(false);
      }
    });
  }
  remove(id: string){
    if(!confirm('¿Eliminar categoría?')) return;
    const cat = this.categories().find(c=>c.id===id);
    const slug = cat?.slug;
    if(!slug) return;
    this.busy.set(true);
    this.svc.deleteCategory(slug).subscribe({
    next: () => { this.svc.loadCategories(); this.busy.set(false); this.success.set('Categoría eliminada'); this.startAutoHideSuccess(); },
    error: () => { this.error.set('Error eliminando'); this.busy.set(false); }
    });
  }

  private startAutoHideSuccess(){ if(this.successTimer) clearTimeout(this.successTimer); this.successTimer = setTimeout(()=> this.success.set(null), 4000); }
}
