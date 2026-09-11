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

/**
 * Height Step Constants - Raffstore-Positionen
 * Hinweis: Inverted Scale (0=oben, 3=unten)
 */
export const RAFFSTORE_HEIGHT_STEP_UP = 3;      // Ganz auf (oben)
export const RAFFSTORE_HEIGHT_STEP_STOP = 1;    // Stop (Mittelposition)
export const RAFFSTORE_HEIGHT_STEP_DOWN = 0;    // Ganz zu (unten)

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
