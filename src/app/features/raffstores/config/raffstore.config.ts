/**
 * Raffstore Configuration
 * 18 Raffstores (9 EG, 8 OG) mit KNX Group Addresses
 * GA-Schema: 2/<Funktion>/<Raffstore-Index>
 */

export interface RaffstoreDatapoints {
  id: string;
  name: string;
  floor: 'EG' | 'OG';
  orientation: 'NORD' | 'OST' | 'SUED' | 'WEST';
  gaMove: string;        // 2/1/x - DPT 1.008 (Auf/Ab)
  gaStep: string;        // 2/2/x - DPT 1.007 (Schritt/Stop)
  gaPositionSet: string; // 2/3/x - DPT 5.001 (Position Sollwert %)
  gaLamellasSet: string; // 2/4/x - DPT 5.001 (Lamellen Sollwert %)
  gaStatusPosition: string; // 2/5/x - DPT 5.001 (Status Position %)
  gaStatusLamellus: string; // 2/6/x - DPT 5.001 (Status Lamellen %)
  gaLock: string;        // 2/7/x - DPT 1.001 (Sperre)
  gaEndTop: string;      // 2/8/x - DPT 1.001 (Endlage Oben)
  gaEndBottom: string;   // 2/9/x - DPT 1.001 (Endlage Unten)
}

export const RAFFSTORE_CONFIG: RaffstoreDatapoints[] = [
  // Erdgeschoss (9 Raffstores, Index 1-9)
  {
    id: 'rs-1',
    name: 'Wohnbereich links',
    floor: 'EG',
    orientation: 'SUED',
    gaMove: '2/1/1',
    gaStep: '2/2/1',
    gaPositionSet: '2/3/1',
    gaLamellasSet: '2/4/1',
    gaStatusPosition: '2/5/1',
    gaStatusLamellus: '2/6/1',
    gaLock: '2/7/1',
    gaEndTop: '2/8/1',
    gaEndBottom: '2/9/1'
  },
  {
    id: 'rs-2',
    name: 'Wohnbereich Mitte',
    floor: 'EG',
    orientation: 'SUED',
    gaMove: '2/1/2',
    gaStep: '2/2/2',
    gaPositionSet: '2/3/2',
    gaLamellasSet: '2/4/2',
    gaStatusPosition: '2/5/2',
    gaStatusLamellus: '2/6/2',
    gaLock: '2/7/2',
    gaEndTop: '2/8/2',
    gaEndBottom: '2/9/2'
  },
  {
    id: 'rs-3',
    name: 'Wohnbereich Rechts',
    floor: 'EG',
    orientation: 'WEST',
    gaMove: '2/1/3',
    gaStep: '2/2/3',
    gaPositionSet: '2/3/3',
    gaLamellasSet: '2/4/3',
    gaStatusPosition: '2/5/3',
    gaStatusLamellus: '2/6/3',
    gaLock: '2/7/3',
    gaEndTop: '2/8/3',
    gaEndBottom: '2/9/3'
  },
  {
    id: 'rs-4',
    name: 'Wohnbereich Türe',
    floor: 'EG',
    orientation: 'WEST',
    gaMove: '2/1/4',
    gaStep: '2/2/4',
    gaPositionSet: '2/3/4',
    gaLamellasSet: '2/4/4',
    gaStatusPosition: '2/5/4',
    gaStatusLamellus: '2/6/4',
    gaLock: '2/7/4',
    gaEndTop: '2/8/4',
    gaEndBottom: '2/9/4'
  },
  {
    id: 'rs-5',
    name: 'Essbereich Schiebetüre',
    floor: 'EG',
    orientation: 'WEST',
    gaMove: '2/1/5',
    gaStep: '2/2/5',
    gaPositionSet: '2/3/5',
    gaLamellasSet: '2/4/5',
    gaStatusPosition: '2/5/5',
    gaStatusLamellus: '2/6/5',
    gaLock: '2/7/5',
    gaEndTop: '2/8/5',
    gaEndBottom: '2/9/5'
  },
  {
    id: 'rs-6',
    name: 'Küche links',
    floor: 'EG',
    orientation: 'WEST',
    gaMove: '2/1/6',
    gaStep: '2/2/6',
    gaPositionSet: '2/3/6',
    gaLamellasSet: '2/4/6',
    gaStatusPosition: '2/5/6',
    gaStatusLamellus: '2/6/6',
    gaLock: '2/7/6',
    gaEndTop: '2/8/6',
    gaEndBottom: '2/9/6'
  },
  {
    id: 'rs-7',
    name: 'Küche rechts',
    floor: 'EG',
    orientation: 'WEST',
    gaMove: '2/1/7',
    gaStep: '2/2/7',
    gaPositionSet: '2/3/7',
    gaLamellasSet: '2/4/7',
    gaStatusPosition: '2/5/7',
    gaStatusLamellus: '2/6/7',
    gaLock: '2/7/7',
    gaEndTop: '2/8/7',
    gaEndBottom: '2/9/7'
  },
  {
    id: 'rs-8',
    name: 'Gästezimmer',
    floor: 'EG',
    orientation: 'SUED',
    gaMove: '2/1/8',
    gaStep: '2/2/8',
    gaPositionSet: '2/3/8',
    gaLamellasSet: '2/4/8',
    gaStatusPosition: '2/5/8',
    gaStatusLamellus: '2/6/8',
    gaLock: '2/7/8',
    gaEndTop: '2/8/8',
    gaEndBottom: '2/9/8'
  },

  // Obergeschoss (9 Raffstores, Index 9-17)
  {
    id: 'rs-9',
    name: 'Treppe',
    floor: 'OG',
    orientation: 'OST',
    gaMove: '2/1/9',
    gaStep: '2/2/9',
    gaPositionSet: '2/3/9',
    gaLamellasSet: '2/4/9',
    gaStatusPosition: '2/5/9',
    gaStatusLamellus: '2/6/9',
    gaLock: '2/7/9',
    gaEndTop: '2/8/9',
    gaEndBottom: '2/9/9'
  },
  {
    id: 'rs-10',
    name: 'Treppe Fixteil',
    floor: 'OG',
    orientation: 'OST',
    gaMove: '2/1/10',
    gaStep: '2/2/10',
    gaPositionSet: '2/3/10',
    gaLamellasSet: '2/4/10',
    gaStatusPosition: '2/5/10',
    gaStatusLamellus: '2/6/10',
    gaLock: '2/7/10',
    gaEndTop: '2/8/10',
    gaEndBottom: '2/9/10'
  },
  {
    id: 'rs-11',
    name: 'Galerie linkes',
    floor: 'OG',
    orientation: 'SUED',
    gaMove: '2/1/11',
    gaStep: '2/2/11',
    gaPositionSet: '2/3/11',
    gaLamellasSet: '2/4/11',
    gaStatusPosition: '2/5/11',
    gaStatusLamellus: '2/6/11',
    gaLock: '2/7/11',
    gaEndTop: '2/8/11',
    gaEndBottom: '2/9/11'
  },
  {
    id: 'rs-12',
    name: 'Galerie Luftraum',
    floor: 'OG',
    orientation: 'WEST',
    gaMove: '2/1/12',
    gaStep: '2/2/12',
    gaPositionSet: '2/3/12',
    gaLamellasSet: '2/4/12',
    gaStatusPosition: '2/5/12',
    gaStatusLamellus: '2/6/12',
    gaLock: '2/7/12',
    gaEndTop: '2/8/12',
    gaEndBottom: '2/9/12'
  },
  {
    id: 'rs-13',
    name: 'Büro N',
    floor: 'OG',
    orientation: 'WEST',
    gaMove: '2/1/13',
    gaStep: '2/2/13',
    gaPositionSet: '2/3/13',
    gaLamellasSet: '2/4/13',
    gaStatusPosition: '2/5/13',
    gaStatusLamellus: '2/6/13',
    gaLock: '2/7/13',
    gaEndTop: '2/8/13',
    gaEndBottom: '2/9/13'
  },
  {
    id: 'rs-14',
    name: 'Büro L',
    floor: 'OG',
    orientation: 'WEST',
    gaMove: '2/1/14',
    gaStep: '2/2/14',
    gaPositionSet: '2/3/14',
    gaLamellasSet: '2/4/14',
    gaStatusPosition: '2/5/14',
    gaStatusLamellus: '2/6/14',
    gaLock: '2/7/14',
    gaEndTop: '2/8/14',
    gaEndBottom: '2/9/14'
  },
  {
    id: 'rs-15',
    name: 'Badezimmer',
    floor: 'OG',
    orientation: 'WEST',
    gaMove: '2/1/15',
    gaStep: '2/2/15',
    gaPositionSet: '2/3/15',
    gaLamellasSet: '2/4/15',
    gaStatusPosition: '2/5/15',
    gaStatusLamellus: '2/6/15',
    gaLock: '2/7/15',
    gaEndTop: '2/8/15',
    gaEndBottom: '2/9/15'
  },
  {
    id: 'rs-16',
    name: 'Schlafzimmer',
    floor: 'OG',
    orientation: 'WEST',
    gaMove: '2/1/16',
    gaStep: '2/2/16',
    gaPositionSet: '2/3/16',
    gaLamellasSet: '2/4/16',
    gaStatusPosition: '2/5/16',
    gaStatusLamellus: '2/6/16',
    gaLock: '2/7/16',
    gaEndTop: '2/8/16',
    gaEndBottom: '2/9/16'
  },
  {
    id: 'rs-17',
    name: 'Schlafzimmer Ankleide',
    floor: 'OG',
    orientation: 'NORD',
    gaMove: '2/1/17',
    gaStep: '2/2/17',
    gaPositionSet: '2/3/17',
    gaLamellasSet: '2/4/17',
    gaStatusPosition: '2/5/17',
    gaStatusLamellus: '2/6/17',
    gaLock: '2/7/17',
    gaEndTop: '2/8/17',
    gaEndBottom: '2/9/17'
  }
];

/**
 * Hilfsfunktion: GA aus Index generieren
 * Verwendung: generateGA(1, 3) -> "2/1/3"
 */
export function generateGA(mittelgruppe: number, index: number): string {
  return `2/${mittelgruppe}/${index}`;
}
