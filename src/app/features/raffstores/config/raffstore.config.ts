/**
 * Raffstore Configuration
 * 17 Raffstores (8 EG, 9 OG) mit KNX Group Addresses
 * GA-Schema: 2/<Funktion>/<Raffstore-Index>
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

export const RAFFSTORE_CONFIG: RaffstoreDatapoints[] = [
  // Erdgeschoss (9 Raffstores, Index 1-9)
  {
    "id": "rs-1",
    "name": "Wohnbereich",
    "floor": "EG",
    "orientation": "SUED",
    "gaMove": "2/1/1",
    "gaStep": "2/2/1",
    "gaPositionSet": "2/3/1",
    "gaLamellasSet": "2/5/1",
    "gaStatusPosition": "2/4/1",
    "gaStatusLamellas": "2/6/1",
    "gaLock": "2/7/1",
    "gaEndTop": "2/4/31",
    "gaEndBottom": "2/4/51"
  }
];
