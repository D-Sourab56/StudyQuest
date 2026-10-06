export type StudyTimerStatus =
  | "running"
  | "paused";

export interface ActiveStudyTimer {
  subjectId: string;

  startedAt: string;

  status: StudyTimerStatus;

  totalPausedMs: number;

  pausedAt?: string;
}

export interface CompletedTimerPreview {
  subjectId: string;

  startedAt: string;

  endedAt: string;

  durationMs: number;
}