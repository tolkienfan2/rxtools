import React, { useState, useEffect } from 'react';
import { DosingModel } from '../models/dosing/DosingModel';
import { DOSING_TYPES, TabType } from '../models/dosing';
import type { ActiveTab, Prescription } from '../types';
import { SegmentedControl, PrescriptionInput, CheckboxList } from '../components';

export const DosingCalculator: React.FC = () => {
    const [dosingModel] = useState(new DosingModel());
    const [activeTab, setActiveTab] = useState<ActiveTab>(TabType.Drops);
    const [prescriptionTypes, setPrescriptionTypes] = useState<string[]>(dosingModel.getPrescriptionTypes());
    const [selectedPrescriptionType, setSelectedPrescriptionType] = useState<Prescription>(prescriptionTypes[0] as Prescription);
    const [packLabel, setPackLabel] = useState<string>('Pack Sizes');
    const [packSizes, setPackSizes] = useState(dosingModel.packSizes);
    const [results, setResults] = useState(dosingModel.results);

    useEffect(() => {
        dosingModel.setActiveTab(activeTab);
        const types = dosingModel.getPrescriptionTypes();
        setPackLabel(dosingModel.packLabel);
        setPrescriptionTypes(types);
        setPackSizes(dosingModel.getPackSizes(types[0] as Prescription));
        setSelectedPrescriptionType(types[0] as Prescription);
        dosingModel.setPrescriptionType(types[0] as Prescription);
    }, [activeTab, dosingModel]);

    const handlePrescriptionTypeClick = (type: Prescription) => {
        setSelectedPrescriptionType(type);
        setPackSizes(dosingModel.getPackSizes(type));
        dosingModel.setPrescriptionType(type);
    };

    const handleCalculateClick = () => {
        dosingModel.calculateResults();
        setResults(dosingModel.results);
    };

    const handleResetClick = () => {
        dosingModel.reset();
        setActiveTab(TabType.Drops);
        setPrescriptionTypes(dosingModel.getPrescriptionTypes());
        setSelectedPrescriptionType(dosingModel.getPrescriptionTypes()[0] as Prescription);
        setPackLabel(dosingModel.packLabel);
        setPackSizes(dosingModel.packSizes);
        setResults(undefined);
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6 sm:px-12">
            <header className="text-center mb-12">
                <h1 className="text-5xl font-extrabold text-blue-600">Dosing Calculator</h1>
                <div className="mt-4 flex justify-center">
                    <SegmentedControl
                        options={DOSING_TYPES}
                        activeOption={activeTab}
                        onOptionClick={(option) => setActiveTab(option as ActiveTab)}
                    />
                </div>
            </header>

            <div className="flex flex-col lg:flex-row items-start justify-center space-y-8 lg:space-y-0 lg:space-x-8">
                {/* Prescription Details Section */}
                <div className="w-full lg:w-1/3 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4">Prescription Details</h2>
                    <SegmentedControl
                        options={prescriptionTypes}
                        activeOption={selectedPrescriptionType}
                        onOptionClick={(type) => handlePrescriptionTypeClick(type as Prescription)}
                    />
                    <PrescriptionInput dosingModel={dosingModel} />
                </div>

                {/* Pack Sizes Section */}
                <div className="w-full lg:w-1/3 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4">{packLabel}</h2>
                    {/* Input fields for pack sizes */}
                    <CheckboxList packSizes={packSizes} dosingModel={dosingModel} />
                </div>

                {/* Results Section */}
                <div className="w-full lg:w-1/3 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4">Results</h2>
                    {results ? (
                        <div>
                            <p className="text-lg font-semibold">Total Dose: {results.totalDose} {results.packsNeeded[0]?.units}</p>
                            <p className="mt-4 font-medium">Packs Needed:</p>
                            <ul className="list-disc list-inside mt-2">
                                {results.packsNeeded.map((pack, index) => (
                                    <li key={index} className="text-gray-700">
                                        <span className="font-bold">{pack.quantity}</span> x {pack.packSize} {pack.units}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p>No results calculated yet</p>
                    )}
                </div>
            </div>

            <footer className="text-center mt-16">
                <button
                    className="bg-red-500 text-white px-6 py-2 rounded-md mr-4"
                    onClick={handleResetClick}
                >Reset</button>
                <button
                    className="bg-blue-500 text-white px-6 py-2 rounded-md"
                    onClick={handleCalculateClick}
                >Calculate</button>
            </footer>
        </div>
    );
};