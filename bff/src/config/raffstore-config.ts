/**
 * Default Raffstore Configuration
 * 17 Raffstores (8 EG, 9 OG) mit KNX Group Addresses
 * GA-Schema: 2/<Funktion>/<Raffstore-Index>
 */

export const DEFAULT_RAFFSTORE_CONFIG = [
  // Erdgeschoss (9 Raffstores)
  {
    id: 'rs-1',
    name: 'Wohnbereich',
    floor: 'EG' as const,
    orientation: 'SUED' as const,
    gaMove: '2/1/1',
    gaStep: '2/2/1',
    gaPositionSet: '2/3/1',
    gaLamellasSet: '2/5/1',
    gaStatusPosition: '2/4/1',
    gaStatusLamellas: '2/6/1',
    gaLock: '2/7/1',
    gaEndTop: '2/4/31',
    gaEndBottom: '2/4/51'
  },
  {
    id: 'rs-2',
    name: 'Esszimmer',
    floor: 'EG' as const,
    orientation: 'SUED' as const,
    gaMove: '2/1/2',
    gaStep: '2/2/2',
    gaPositionSet: '2/3/2',
    gaLamellasSet: '2/5/2',
    gaStatusPosition: '2/4/2',
    gaStatusLamellas: '2/6/2',
    gaLock: '2/7/2',
    gaEndTop: '2/4/32',
    gaEndBottom: '2/4/52'
  },
  {
    id: 'rs-3',
    name: 'Küche',
    floor: 'EG' as const,
    orientation: 'OST' as const,
    gaMove: '2/1/3',
    gaStep: '2/2/3',
    gaPositionSet: '2/3/3',
    gaLamellasSet: '2/5/3',
    gaStatusPosition: '2/4/3',
    gaStatusLamellas: '2/6/3',
    gaLock: '2/7/3',
    gaEndTop: '2/4/33',
    gaEndBottom: '2/4/53'
  },
  {
    id: 'rs-4',
    name: 'Schlafzimmer',
    floor: 'EG' as const,
    orientation: 'NORD' as const,
    gaMove: '2/1/4',
    gaStep: '2/2/4',
    gaPositionSet: '2/3/4',
    gaLamellasSet: '2/5/4',
    gaStatusPosition: '2/4/4',
    gaStatusLamellas: '2/6/4',
    gaLock: '2/7/4',
    gaEndTop: '2/4/34',
    gaEndBottom: '2/4/54'
  },
  {
    id: 'rs-5',
    name: 'Badezimmer',
    floor: 'EG' as const,
    orientation: 'NORD' as const,
    gaMove: '2/1/5',
    gaStep: '2/2/5',
    gaPositionSet: '2/3/5',
    gaLamellasSet: '2/5/5',
    gaStatusPosition: '2/4/5',
    gaStatusLamellas: '2/6/5',
    gaLock: '2/7/5',
    gaEndTop: '2/4/35',
    gaEndBottom: '2/4/55'
  },
  // Obergeschoss (9 Raffstores)
  {
    id: 'rs-6',
    name: 'Kinderzimmer 1',
    floor: 'OG' as const,
    orientation: 'OST' as const,
    gaMove: '2/1/6',
    gaStep: '2/2/6',
    gaPositionSet: '2/3/6',
    gaLamellasSet: '2/5/6',
    gaStatusPosition: '2/4/6',
    gaStatusLamellas: '2/6/6',
    gaLock: '2/7/6',
    gaEndTop: '2/4/36',
    gaEndBottom: '2/4/56'
  },
  {
    id: 'rs-7',
    name: 'Kinderzimmer 2',
    floor: 'OG' as const,
    orientation: 'SUED' as const,
    gaMove: '2/1/7',
    gaStep: '2/2/7',
    gaPositionSet: '2/3/7',
    gaLamellasSet: '2/5/7',
    gaStatusPosition: '2/4/7',
    gaStatusLamellas: '2/6/7',
    gaLock: '2/7/7',
    gaEndTop: '2/4/37',
    gaEndBottom: '2/4/57'
  },
  {
    id: 'rs-8',
    name: 'Elternschlafzimmer',
    floor: 'OG' as const,
    orientation: 'WEST' as const,
    gaMove: '2/1/8',
    gaStep: '2/2/8',
    gaPositionSet: '2/3/8',
    gaLamellasSet: '2/5/8',
    gaStatusPosition: '2/4/8',
    gaStatusLamellas: '2/6/8',
    gaLock: '2/7/8',
    gaEndTop: '2/4/38',
    gaEndBottom: '2/4/58'
  },
  {
    id: 'rs-9',
    name: 'Büro',
    floor: 'OG' as const,
    orientation: 'NORD' as const,
    gaMove: '2/1/9',
    gaStep: '2/2/9',
    gaPositionSet: '2/3/9',
    gaLamellasSet: '2/5/9',
    gaStatusPosition: '2/4/9',
    gaStatusLamellas: '2/6/9',
    gaLock: '2/7/9',
    gaEndTop: '2/4/39',
    gaEndBottom: '2/4/59'
  }
];
