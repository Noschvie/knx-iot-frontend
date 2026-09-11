export interface Raffstore {
  id: string;
  label: string;
  floor: 'EG' | 'OG';
  orientation?: string;
  heightStep: number;    // 0–3 (Auf, 1/3, 2/3, Zu)
  angleStep: number;     // 0–2 (Offen, Schräg, Zu)
  isMoving?: boolean;
  autoMode?: boolean;
}

export type HeightLabel = 'Auf' | '1/3' | '2/3' | 'Zu';
export type AngleLabel = 'Offen' | 'Schräg' | 'Zu';

export const HEIGHT_STEPS: Record<number, HeightLabel> = {
  0: 'Auf',
  1: '1/3',
  2: '2/3',
  3: 'Zu'
};

export const ANGLE_STEPS: Record<number, AngleLabel> = {
  0: 'Offen',
  1: 'Schräg',
  2: 'Zu'
};
