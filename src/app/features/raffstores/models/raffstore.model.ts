/**
 * Raffstore Model – UI-focused
 */
export interface Raffstore {
  id: string;
  name: string;
  floor: 'EG' | 'OG';
  orientation: 'NORD' | 'OST' | 'SUED' | 'WEST';
  heightStep: number;             // 0–3 (Up, 1/3, 2/3, Down)
  angleStep: number;              // 0–2 (Open, Tilted, Closed)
  isMoving?: boolean;
  autoMode?: boolean;
  statusPositionPercent?: number; // Position feedback 0–100 % (100 % = down/closed)
  statusLamellaPercent?: number;  // Lamella feedback 0–100 %
  isEndTop?: boolean;             // Top end position reached
  isEndBottom?: boolean;          // Bottom end position reached
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
