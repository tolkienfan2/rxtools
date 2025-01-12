import { PackSize, Prescription } from "../../types";

// Dosing Sizes
const eyeDropSizes = [2.5, 3, 5, 6, 7.5, 8, 10, 12];
export const eyeDropPackSizes: PackSize[] = eyeDropSizes.map((size) => ({ packSize: size, units: 'mL' }));

const earDropSizes = [5, 7.5, 10, 15];
export const earDropPackSizes: PackSize[] = earDropSizes.map((size) => ({ packSize: size, units: 'mL' }));

const insulinSizes = [100, 300, 500];
export const insulinPackSizes: PackSize[] = insulinSizes.map((size) => ({ packSize: size, units: 'IU' }));

const ozempicSizes = [0.25, 0.5, 1, 2];
export const ozempicPackSizes: PackSize[] = ozempicSizes.map((size) => ({ packSize: size, units: 'mg' }));

const tabletSizes = [5, 10, 20, 50, 100];
export const tabletPackSizes: PackSize[] = tabletSizes.map((size) => ({ packSize: size, units: 'mg' }));

const capsuleSizes = [50, 100, 200, 500];
export const capsulePackSizes: PackSize[] = capsuleSizes.map((size) => ({ packSize: size, units: 'mg' }));

// Dosing Types
export const DOSING_TYPES = ['Drops', 'Injections', 'Pills'];
export const DROP_TYPES: Prescription[] = ['Eye', 'Ear'];
export const INJECTION_TYPES: Prescription[] = ['Insulin', 'Ozempic'];
export const PILL_TYPES: Prescription[] = ['Tablet', 'Capsule'];

// Prescription Types
export enum PrescriptionType {
    Eye = 'Eye',
    Ear = 'Ear',
    Insulin = 'Insulin',
    Ozempic = 'Ozempic',
    Tablet = 'Tablet',
    Capsule = 'Capsule'
}

// Tab Types
export enum TabType {
    Drops = 'Drops',
    Injections = 'Injections',
    Pills = 'Pills'
}