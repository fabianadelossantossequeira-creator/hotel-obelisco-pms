// src/dataStore.js

export const PRICES = {
  rooms: { estandar: 75, superior: 95, junior: 130, obelisco: 190 },
  food: { cafe: 120, medialuna: 45, chivito: 650, refresco: 130, buffet: 450 }
};

export const INITIAL_ROOMS = [
  { id: '101', type: 'Estándar', status: 'available', clean: 'clean', guest: null, plan: 'RO', folio: [], rate: 75 },
  { id: '102', type: 'Estándar', status: 'available', clean: 'clean', guest: null, plan: 'RO', folio: [], rate: 75 },
  { id: '201', type: 'Superior', status: 'available', clean: 'clean', guest: null, plan: 'BB', folio: [], rate: 95 },
  { id: '301', type: 'Suite Obelisco', status: 'available', clean: 'clean', guest: null, plan: 'BB', folio: [], rate: 190 },
];
