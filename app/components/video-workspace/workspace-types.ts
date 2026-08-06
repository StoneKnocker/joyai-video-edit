export type GenerationTab =
  | "multi-reference"
  | "image-to-video"
  | "text-to-video";

export type WorkspaceTaskStatus =
  | "idle"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface WorkspaceTaskState {
  taskId?: string;
  status: WorkspaceTaskStatus;
  videoUrls: string[];
  imageUrls: string[];
  errorMessage?: string;
}
