/**
 * Raffstore Konfiguration - Maps Raffstores zu KNX Datapoint-GAs
 *
 * Basierend auf dem bash-Script-Beispiel:
 * - Bewegen (up/down): DPST-1-8
 * - Stopp: DPST-1-7
 * - Position Höhe: DPST-5-1 (0-100)
 * - Lamellenwinkel: DPST-5-1 (0-100)
 */

/**
 * DPT 1.008 (Boolean) Werte für Raffstore-Bewegung
 */
export const RAFFSTORE_COMMANDS = {
  MOVE_UP: 1,        // Bewegung nach oben
  MOVE_DOWN: 0,      // Bewegung nach unten
  STOP: 'stop'       // Stop-Befehl
} as const;

export interface RaffstoreDatapoints {
  id: string;
  label: string;
  floor: 'EG' | 'OG';
  orientation?: string;
  // Datapoint GAs (wird später zu UUIDs aufgelöst)
  gaMove: string;             // 2/1/24 - up/down
  gaStep: string;             // 2/2/24 - stop
  gaHeight: string;           // 2/3/24 - Position (0-100)
  gaStatusHeight: string;     // 2/4/24 - Status Position (0-100)
  gaAngle: string;            // 2/5/24 - Lamellenwinkel (0-100)
  gaStatusAngle: string;      // 2/6/24 - Statsu Lamellenwinkel (0-100)
}

export const RAFFSTORE_CONFIG: RaffstoreDatapoints[] = [
  {
    id: 'raffstore-1',
    label: 'Gang Fenster Osten',
    floor: 'OG',
    orientation: 'E',
    gaMove: '2/1/24',
    gaStep: '2/2/24',
    gaHeight: '2/3/24',
    gaStatusHeight: '2/4/24',
    gaAngle: '2/5/24',
    gaStatusAngle: '2/6/24',
  }
  // Weitere Raffstores hinzufügen...
];

/**
 * Mapping: Discrete Stufen → KNX-Werte (0-100)
 */
export const STEP_TO_KNX = {
  // Höhe: 0-3 → 0-100 (inverted: 0=oben, 100=unten)
  height: {
    0: 0,      // Auf (oben)
    1: 33,     // 1/3
    2: 66,     // 2/3
    3: 100     // Zu (unten)
  },
  // Lamellen: 0-2 → 0-100
  angle: {
    0: 0,      // Offen (0°)
    1: 50,     // Schräg (45°)
    2: 100     // Zu (90°)
  }
};

/**
 * Reverse Mapping: KNX-Werte → Discrete Stufen
 */
export const KNX_TO_STEP = {
  height: {
    0: 0,
    25: 0,
    33: 1,
    50: 1,
    66: 2,
    75: 2,
    100: 3
  },
  angle: {
    0: 0,
    25: 0,
    50: 1,
    75: 1,
    100: 2
  }
};
