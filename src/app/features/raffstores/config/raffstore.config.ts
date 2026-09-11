/**
 * Raffstore Konfiguration - Maps Raffstores zu KNX Datapoint-GAs
 *
 * Basierend auf dem bash-Script-Beispiel:
 * - Bewegen (up/down): DPST-1-8 (gaMove: 2/1/24)
 * - Stopp: DPST-1-7 (gaStep: 2/2/24)
 * - Position Höhe: DPST-5-1 (gaHeight: 2/3/24, 0-100)
 * - Lamellenwinkel: DPST-5-1 (gaAngle: 2/5/24, 0-100)
 */

/**
 * DPT 1.008 (Boolean) Werte für Raffstore-Bewegung
 */
export const RAFFSTORE_COMMANDS = {
  MOVE_UP: 0,      // Bewegung nach oben (DPST-1-8)
  MOVE_DOWN: 1,    // Bewegung nach unten (DPST-1-8)
  STOP: 1          // Stop-Befehl (DPST-1-7)
} as const;

/**
 * Datapoint Schlüssel - sprechende Namen für Konfig-Zugriff
 */
export const RAFFSTORE_DATAPOINT_KEYS = {
  MOVE: 'gaMove',                   // Auf/Ab Befehl (DPST-1-8)
  STEP: 'gaStep',                   // Stopp Befehl (DPST-1-7)
  HEIGHT: 'gaHeight',               // Position Höhe (Befehl)
  STATUS_HEIGHT: 'gaStatusHeight',  // Position Höhe (Status/Feedback)
  ANGLE: 'gaAngle',                 // Lamellenwinkel (Befehl)
  STATUS_ANGLE: 'gaStatusAngle'     // Lamellenwinkel (Status/Feedback)
} as const;

export interface RaffstoreDatapoints {
  id: string;
  label: string;
  floor: 'EG' | 'OG';
  orientation?: string;
  // Befehls-Datapoints
  gaMove: string;           // 2/1/24 - up/down
  gaStep: string;           // 2/2/24 - stop
  gaHeight: string;         // 2/3/24 - Position Höhe (Befehl)
  gaAngle: string;          // 2/5/24 - Lamellenwinkel (Befehl)
  // Status/Feedback-Datapoints
  gaStatusHeight: string;   // 2/4/24 - Position Höhe (Status)
  gaStatusAngle: string;    // 2/6/24 - Lamellenwinkel (Status)
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
    gaAngle: '2/5/24',
    gaStatusHeight: '2/4/24',
    gaStatusAngle: '2/6/24'
  }
  // Weitere Raffstores hinzufügen...
];

/**
 * Mapping: Discrete Stufen → KNX-Werte (0-100)
 * Höhe: 0-3 → 0-100 (inverted: 0=oben, 100=unten)
 * Lamellen: 0-2 → 0-100 (0=offen, 100=zu)
 */
export const STEP_TO_KNX = {
  height: {
    0: 0,      // Oben
    1: 33,     // 1/3
    2: 66,     // 2/3
    3: 100     // Unten
  },
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
