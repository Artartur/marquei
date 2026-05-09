import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription, interval } from 'rxjs';
import { switchMap, takeUntil, startWith } from 'rxjs/operators';
import { ImportService } from '../../services/import.service';
import { ImportError, ImportJob, ImportType } from '../../interfaces/import-job.interface';
import { ToastService } from '../../services/toast.service';

type ActiveImport = ImportJob & { polling?: Subscription };

@Component({
  selector: 'app-import-page',
  standalone: false,
  templateUrl: './import-page.component.html',
})
export class ImportPageComponent implements OnInit, OnDestroy {
  public jobs: ImportJob[] = [];
  public selectedType: ImportType = 'CLIENTS';
  public selectedFile: File | null = null;
  public uploading = false;
  public isDragging = false;

  public activeJob: ActiveImport | null = null;
  public errorModalJob: ImportJob | null = null;
  public errors: ImportError[] = [];
  public loadingErrors = false;

  private pollingMap = new Map<string, Subscription>();
  private destroy$ = new Subject<void>();
  private refresh$ = new Subject<void>();

  constructor(
    private importService: ImportService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.pollingMap.forEach((sub) => sub.unsubscribe());
  }

  private startPolling(jobId: string): void {
    if (this.pollingMap.has(jobId)) return;

    const sub = interval(2000)
      .pipe(
        startWith(0),
        switchMap(() => this.importService.getJob(jobId)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (updated) => {
          this.jobs = this.jobs.map((j) => (j.id === jobId ? updated : j));
          if (updated.status === 'DONE' || updated.status === 'DONE_WITH_ERRORS') {
            this.stopPolling(jobId);
            if (updated.status === 'DONE') {
              this.toast.success(
                `Importação concluída: ${updated.processed} registros importados.`,
              );
            } else {
              this.toast.warning(
                `Importação concluída com falhas: ${updated.processed} importados, ${updated.failed} com erro.`,
              );
            }
          }
        },
      });

    this.pollingMap.set(jobId, sub);
  }

  private stopPolling(jobId: string): void {
    this.pollingMap.get(jobId)?.unsubscribe();
    this.pollingMap.delete(jobId);
  }

  public loadJobs(): void {
    this.importService.getJobs().subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        jobs.forEach((job) => {
          if (job.status === 'QUEUED' || job.status === 'PROCESSING') {
            this.startPolling(job.id);
          }
        });
      },
      error: () => this.toast.error('Erro ao carregar histórico de importações.'),
    });
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.selectedFile = input.files[0];
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  public onDragLeave(): void {
    this.isDragging = false;
  }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.selectedFile = file;
  }

  public clearFile(): void {
    this.selectedFile = null;
  }

  public upload(): void {
    if (!this.selectedFile || this.uploading) return;
    this.uploading = true;
    this.importService.upload(this.selectedFile, this.selectedType).subscribe({
      next: (job) => {
        this.uploading = false;
        this.selectedFile = null;
        this.jobs = [job, ...this.jobs];
        this.toast.success('Arquivo enviado! Processamento iniciado.');
        this.startPolling(job.id);
      },
      error: () => {
        this.uploading = false;
        this.toast.error('Erro ao enviar arquivo. Verifique o formato e tente novamente.');
      },
    });
  }

  public openErrors(job: ImportJob): void {
    this.errorModalJob = job;
    this.errors = [];
    this.loadingErrors = true;
    this.importService.getErrors(job.id).subscribe({
      next: (errs) => {
        this.errors = errs;
        this.loadingErrors = false;
      },
      error: () => {
        this.loadingErrors = false;
        this.toast.error('Erro ao carregar detalhes dos erros.');
      },
    });
  }

  public closeErrors(): void {
    this.errorModalJob = null;
    this.errors = [];
  }

  public progress(job: ImportJob): number {
    if (!job.totalRows) return 0;
    return Math.round(((job.processed + job.failed) / job.totalRows) * 100);
  }

  public statusLabel(status: string): string {
    const map: Record<string, string> = {
      QUEUED: 'Na fila',
      PROCESSING: 'Processando',
      DONE: 'Concluído',
      DONE_WITH_ERRORS: 'Concluído com falhas',
    };
    return map[status] ?? status;
  }

  public statusClass(status: string): string {
    const map: Record<string, string> = {
      QUEUED: 'bg-[#EBF4FD] text-[#185FA5]',
      PROCESSING: 'bg-amber-50 text-amber-700',
      DONE: 'bg-green-50 text-green-700',
      DONE_WITH_ERRORS: 'bg-red-50 text-red-700',
    };
    return map[status] ?? '';
  }

  public typeLabel(type: string): string {
    return type === 'CLIENTS' ? 'Clientes' : 'Agendamentos';
  }

  public rawDataEntries(raw: Record<string, string>): { key: string; value: string }[] {
    return Object.entries(raw).map(([key, value]) => ({ key, value }));
  }
}
