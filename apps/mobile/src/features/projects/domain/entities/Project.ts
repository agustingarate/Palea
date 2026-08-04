export interface Project {
  readonly id: string;
  readonly name: string;
  readonly company: string;
  readonly status: 'active' | 'archived';
  readonly updatedAt: Date;
}
