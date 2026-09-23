/**
 * Raffstore Models and Types for BFF
 */

export interface RaffstoreDatapoints {
  id: string;
  name: string;
  floor: 'EG' | 'OG';
  orientation: 'NORD' | 'OST' | 'SUED' | 'WEST';
  gaMove: string;           // 2/1/x - DPT 1.008 (Auf/Ab)
  gaStep: string;           // 2/2/x - DPT 1.007 (Schritt/Stop)
  gaPositionSet: string;    // 2/3/x - DPT 5.001 (Position Sollwert %)
  gaLamellasSet: string;    // 2/4/x - DPT 5.001 (Lamellen Sollwert %)
  gaStatusPosition: string; // 2/5/x - DPT 5.001 (Status Position %)
  gaStatusLamellas: string; // 2/6/x - DPT 5.001 (Status Lamellen %)
  gaLock: string;           // 2/7/x - DPT 1.001 (Sperre)
  gaEndTop: string;         // 2/8/x - DPT 1.001 (Endlage Oben)
  gaEndBottom: string;      // 2/9/x - DPT 1.001 (Endlage Unten)
}

export interface Raffstore {
  id: string;
  name: string;
  floor: 'EG' | 'OG';
  orientation?: 'NORD' | 'OST' | 'SUED' | 'WEST';
  heightStep: number;      // 0–3 (Auf, 1/3, 2/3, Zu)
  angleStep: number;       // 0–2 (Offen, Schräg, Zu)
  isMoving?: boolean;
  autoMode?: boolean;
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
