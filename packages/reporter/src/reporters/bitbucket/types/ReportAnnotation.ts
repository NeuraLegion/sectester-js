export type AnnotationType = 'VULNERABILITY' | 'CODE_SMELL' | 'BUG';

export type AnnotationResult = 'PASSED' | 'FAILED' | 'SKIPPED' | 'IGNORED';

export type AnnotationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ReportAnnotation {
  external_id: string;
  title?: string;
  annotation_type?: AnnotationType;
  summary?: string;
  details?: string;
  result?: AnnotationResult;
  severity?: AnnotationSeverity;
  path?: string;
  line?: number;
  link?: string;
}
