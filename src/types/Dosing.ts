export type PrescriptionDetails = {
    dose: number;
    frequency: number; // Frequency per day
    duration: number; // Duration in days
}

export type BaseDosing = {
    activeTab: ActiveTab;
    type: string; // General type for drops, injections, and pills
    prescriptionDetails: PrescriptionDetails;
    packSizes: PackSize[]; // Relevant pack sizes for this prescription
};

// Active tab types
export type ActiveTab = 'Drops' | 'Injections' | 'Pills';
export type Prescription = 'Eye' | 'Ear' | 'Insulin' | 'Ozempic' | 'Tablet' | 'Capsule';

export type DropsDosing = BaseDosing & {
    activeTab: 'Drops';
    type: 'Eye' | 'Ear';
}

export type InjectionDosing = BaseDosing & {
    activeTab: 'Injections';
    type: 'Insulin' | 'Ozempic';
}

export type PillDosing = BaseDosing & {
    activeTab: 'Pills';
    type: 'Tablet' | 'Capsule';
}

export type Dosing = DropsDosing | InjectionDosing | PillDosing;

// Pack size type
export type PackSize = {
    packSize: number;
    units: string; // Units should match prescriptionDetails.units
}

// Results type
export type Results = {
    totalDose: number; // Total dose for the prescription
    packsNeeded: PackSize[]; // Array of pack sizes needed to meet the dose
}

