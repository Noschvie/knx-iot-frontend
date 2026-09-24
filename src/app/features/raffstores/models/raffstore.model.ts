/**
 * Raffstore Model – UI-focused
 */
export interface Raffstore {
  id: string;
  name: string;
  floor: 'EG' | 'OG';
  orientation: 'NORD' | 'OST' | 'SUED' | 'WEST';
  heightStep: number;    // 0–3 (Auf, 1/3, 2/3, Zu)
  angleStep: number;     // 0–2 (Offen, Schräg, Zu)
  isMoving?: boolean;
  autoMode?: boolean;
}

export const HEIGHT_STEPS: Record<number, string> = {
  0: 'Auf',
  1: '1/3',
  2: '2/3',
  3: 'Zu'
} as const;

export const ANGLE_STEPS: Record<number, string> = {
  0: 'Offen',
  1: 'Schräg',
  2: 'Zu'
} as const;

export const HEIGHT_STEP_UP = 0;
export const HEIGHT_STEP_DOWN = 3;

export interface Favorite {
  label: string;
  heightStep: number;
  angleStep: number;
}
