import type { ActiveTab, Dosing, DropsDosing, InjectionDosing, PackSize, PillDosing, PrescriptionDetails, Prescription } from './../../types';

export interface PackResult {
    packSize: number;
    units: string;
    quantity: number;
}

export interface Results {
    totalDose: number;
    packsNeeded: PackResult[];
}
import {
    eyeDropPackSizes,
    earDropPackSizes,
    insulinPackSizes,
    ozempicPackSizes,
    tabletPackSizes,
    capsulePackSizes,
    PrescriptionType,
    TabType,
    DROP_TYPES,
    INJECTION_TYPES,
    PILL_TYPES
} from './constants';

export class DosingModel {
    activeTab: ActiveTab;
    dosing: Dosing;
    packSizes: PackSize[];
    selectedPackSizes: PackSize[] = [];
    dosingLabel: string = "drop";
    packLabel: string = "Pack Sizes";
    finalPrescriptionDetails: PrescriptionDetails[] = [];
    results: Results | undefined = undefined;

    constructor() {
        this.activeTab = TabType.Drops;
        this.packSizes = eyeDropPackSizes
        this.dosing = this.initializeDosing(TabType.Drops);
    }

    private initializeDosing(activeTab: ActiveTab): Dosing {
        const defaultDetails: PrescriptionDetails = {
            dose: 0,
            frequency: 0,
            duration: 0,
        };

        const tabConfig: { [key in ActiveTab]: { type: Prescription; units: string } } = {
            Drops: { type: PrescriptionType.Eye, units: 'mL' },
            Injections: { type: PrescriptionType.Insulin, units: 'IU' },
            Pills: { type: PrescriptionType.Tablet, units: 'mg' },
        };

        if (!tabConfig[activeTab]) {
            throw new Error(`Unsupported activeTab: ${activeTab}`);
        }

        const { type, units } = tabConfig[activeTab];

        if (activeTab === TabType.Drops) {
            this.dosingLabel = "drop";
            this.packLabel = "Bottle Sizes";
            return {
                activeTab,
                type: type as PrescriptionType.Eye | PrescriptionType.Ear,
                prescriptionDetails: { ...defaultDetails, units },
                packSizes: this.packSizes.filter((p) => p.units === units),
            } as DropsDosing;
        } else if (activeTab === TabType.Injections) {
            this.dosingLabel = "jab";
            this.packLabel = "Strengths";
            return {
                activeTab,
                type: type as PrescriptionType.Insulin | PrescriptionType.Ozempic,
                prescriptionDetails: { ...defaultDetails, units },
                packSizes: this.packSizes.filter((p) => p.units === units),
            } as InjectionDosing;
        } else {
            this.dosingLabel = "pill";
            this.packLabel = "Strengths";
            return {
                activeTab,
                type: type as PrescriptionType.Tablet | PrescriptionType.Capsule,
                prescriptionDetails: { ...defaultDetails, units },
                packSizes: this.packSizes.filter((p) => p.units === units),
            } as PillDosing;
        }
    }

    setActiveTab(tab: ActiveTab): void {
        this.activeTab = tab;
        this.dosing = this.initializeDosing(tab);
    }

    setPrescriptionType(type: Prescription): void {
        this.dosing.type = type;
        this.packSizes = this.getPackSizes(type);
    }

    getPrescriptionTypes(): Prescription[] {
        if (this.activeTab === TabType.Drops) {
            return DROP_TYPES;
        } else if (this.activeTab === TabType.Injections) {
            return INJECTION_TYPES;
        } else {
            return PILL_TYPES;
        }
    }

    getPackSizes(type: Prescription): PackSize[] {
        switch (type) {
            case PrescriptionType.Eye:
                return eyeDropPackSizes;
            case PrescriptionType.Ear:
                return earDropPackSizes;
            case PrescriptionType.Insulin:
                return insulinPackSizes;
            case PrescriptionType.Ozempic:
                return ozempicPackSizes;
            case PrescriptionType.Tablet:
                return tabletPackSizes;
            case PrescriptionType.Capsule:
                return capsulePackSizes;
            default:
                return [];
        }
    }

    updatePrescriptionDetails(details: PrescriptionDetails[]): void {
        this.finalPrescriptionDetails = details;
    }

    calculateResults = () => {
        const totalDose = this.finalPrescriptionDetails.reduce((acc, curr) => {
            return acc + curr.dose * curr.frequency * curr.duration;
        }, 0);

        const packsNeeded = this.selectedPackSizes.map((pack) => {
            const quantity = Math.ceil(totalDose / pack.packSize);
            return {
                packSize: pack.packSize,
                units: pack.units,
                quantity: quantity
            };
        });

        this.results = { totalDose, packsNeeded };
    }

    getCurrentState(): Dosing {
        return this.dosing;
    }

    setSelectedPackSizes(selectedSizes: PackSize[]): void {
        this.selectedPackSizes = selectedSizes;
    }

    reset = () => {
        this.initializeDosing(TabType.Drops);
        this.packSizes = eyeDropPackSizes;
        this.results = undefined;
        this.selectedPackSizes = [];
        this.finalPrescriptionDetails = [];
    }
}
