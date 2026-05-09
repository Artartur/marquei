export type ImportStatus = 'QUEUED' | 'PROCESSING' | 'DONE' | 'DONE_WITH_ERRORS';
export type ImportType = 'CLIENTS' | 'APPOINTMENTS';

export interface ImportJob {
  id: string;
  status: ImportStatus;
  importType: ImportType;
  fileName: string;
  totalRows: number;
  processed: number;
  failed: number;
  createdAt: string;
}

export interface ImportError {
  id: string;
  row: number;
  reason: string;
  rawData: Record<string, string>;
}
