import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TaxonomyService } from './taxonomy.service';
import { AlertComponent } from '../components/alert.component';
import { LoadingDirective } from '../directives/loading.directive';
import { SpinnerComponent } from '../components/spinner.component';

@Component({
  selector: 'app-tag-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertComponent, LoadingDirective, SpinnerComponent],
  // styles moved to global styles
  templateUrl: './tag-list.component.html'
})
export class TagListComponent implements OnInit {
  svc = inject(TaxonomyService);
  fb = inject(FormBuilder);

  tags = this.svc.tags;
  formVisible = signal(false);
  editingSlug = signal<string | null>(null);
  busy = signal(false);
  success = signal<string | null>(null);
  error = signal<string | null>(null);
  private successTimer: ReturnType<typeof setTimeout> | null = null;

  form = this.fb.group({ name: ['', [Validators.required, Validators.minLength(2)]] });

  ngOnInit() { this.svc.loadTags(); }

  openCreate(){
    this.form.reset();
  this.editingSlug.set(null);
    this.formVisible.set(true);
  }
  startEdit(id: string){
    const t = this.tags().find(x=>x.id===id);
    if(!t) return;
    this.editingSlug.set(t.slug);
    this.form.patchValue({ name: t.name });
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
    const name = this.form.value.name as string | undefined;
    if(!name){ this.busy.set(false); return; }
  const editing = this.editingSlug();
  const obs = editing ? this.svc.updateTag(editing, { name }) : this.svc.createTag({ name });
    obs.subscribe({
      next: () => {
        this.svc.loadTags();
        this.busy.set(false);
        this.formVisible.set(false);
  this.success.set(this.editingSlug() ? 'Tag actualizado' : 'Tag creado');
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
    if(!confirm('¿Eliminar tag?')) return;
    this.busy.set(true);
    // id es interno; backend borra por slug
    const t = this.tags().find(x=>x.id===id); const slug = t?.slug; if(!slug){ this.busy.set(false); return; }
    this.svc.deleteTag(slug).subscribe({
    next: () => { this.svc.loadTags(); this.busy.set(false); this.success.set('Tag eliminado'); this.startAutoHideSuccess(); },
    error: () => { this.error.set('Error eliminando'); this.busy.set(false); }
    });
  }

  private startAutoHideSuccess(){ if(this.successTimer) clearTimeout(this.successTimer); this.successTimer = setTimeout(()=> this.success.set(null), 4000); }
}
