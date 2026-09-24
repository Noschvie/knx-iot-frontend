/**
 * Raffstore Models and Types for BFF
 */

export interface RaffstoreDatapoints {
  id: string;
  name: string;
  floor: 'EG' | 'OG';
  orientation: 'NORD' | 'OST' | 'SUED' | 'WEST';
  gaMove: string;           // 2/1/x - DPT 1.008 (Up/Down)
  gaStep: string;           // 2/2/x - DPT 1.007 (Step/Stop)
  gaPositionSet: string;    // 2/3/x - DPT 5.001 (Position setpoint %)
  gaLamellasSet: string;    // 2/4/x - DPT 5.001 (Lamella setpoint %)
  gaStatusPosition: string; // 2/5/x - DPT 5.001 (Position status %)
  gaStatusLamellas: string; // 2/6/x - DPT 5.001 (Lamella status %)
  gaLock: string;           // 2/7/x - DPT 1.001 (Lock)
  gaEndTop: string;         // 2/8/x - DPT 1.001 (Top end position)
  gaEndBottom: string;      // 2/9/x - DPT 1.001 (Bottom end position)
}

export interface Raffstore {
  id: string;
  name: string;
  floor: 'EG' | 'OG';
  orientation?: 'NORD' | 'OST' | 'SUED' | 'WEST';
  heightStep: number;      // 0–3 (Up, 1/3, 2/3, Down)
  angleStep: number;       // 0–2 (Open, Tilted, Closed)
  isMoving?: boolean;
  autoMode?: boolean;
  statusPositionPercent?: number; // Position feedback 0–100 % (100 % = down/closed)
  statusLamellaPercent?: number;  // Lamella feedback 0–100 %
  isEndTop?: boolean;             // Top end position reached
  isEndBottom?: boolean;          // Bottom end position reached
  lastUpdate?: string;
}

export interface Favorite {
  label: string;
  heightStep: number;
  angleStep: number;
}

export interface Command {
  id?: string;
  type: 'move' | 'step' | 'setHeight' | 'setAngle' | 'setPosition' | 'applyFavorite' | 'toggleAutoMode' | 'groupCommand';
  raffstoreId?: string;
  floor?: 'EG' | 'OG';
  direction?: 'up' | 'down';
  heightStep?: number;
  angleStep?: number;
  favorite?: Favorite;
  timestamp: number;
}

export interface Event {
  type: 'raffstore_updated' | 'command_executed' | 'command_failed' | 'status_changed';
  raffstoreId?: string;
  raffstore?: Raffstore;
  command?: Command;
  error?: string;
  timestamp: number;
}

export interface BFFResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// Gateway-specific types
export interface GatewayDatapoint {
  id: string;
  groupAddress: string;
  name: string;
  type: string;
  value: string | number;
}

export interface GatewayCommand {
  data: Array<{
    type: 'datapoint';
    id: string;
    attributes: { value: string | number };
  }>;
}
