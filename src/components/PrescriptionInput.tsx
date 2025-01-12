import React, { useEffect } from "react";
import { DosingModel } from "../models/dosing";
import { PrescriptionDetails } from "../types";
import { ToggleButton } from "./ToggleButton";

export type PrescriptionInputProps = {
    dosingModel: DosingModel;
};

export const PrescriptionInput = ({ dosingModel }: PrescriptionInputProps) => {
    const { dosing, dosingLabel } = dosingModel;
    const { prescriptionDetails } = dosing;
    const [lines, setLines] = React.useState<PrescriptionDetails[]>([prescriptionDetails]);
    const [activeOption, setActiveOption] = React.useState("One");

    const addLine = () => {
        setLines([...lines, { dose: 0, frequency: 0, duration: 0 }]);
    };

    const handleInputChange = (index: number, field: keyof PrescriptionDetails, value: number) => {
        const newLines = [...lines];
        newLines[index][field] = value;
        setLines(newLines);
        dosingModel.updatePrescriptionDetails(newLines);
    };

    const removeLine = (index: number) => {
        const newLines = lines.filter((_, i) => i !== index);
        setLines(newLines);
    };

    const toggleVisible = dosing.type === "Ear" || dosing.type === "Eye";

    useEffect(() => {
        setLines([prescriptionDetails]);
    }, [prescriptionDetails]);

    return (
        <div className="flex flex-col items-center space-y-4">
            {toggleVisible &&
                <ToggleButton
                    options={['One', 'Both']}
                    activeOption={activeOption}
                    onOptionClick={(option) => setActiveOption(option)}
                />
            }
            {/* Map over each line of inputs */}
            <div className="mt-8 w-full">
            {lines.map((line, index) => (
                <div key={index} className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 prescriptionLine">
                    <div className="flex w-full">
                        <select
                            value={line.dose}
                            onChange={(e) => handleInputChange(index, 'dose', parseInt(e.target.value))}
                            className="mr-1"
                        >
                            {[...Array(6).keys()].map((num) => (
                                <option key={num} value={num}>
                                    {num}
                                </option>
                            ))}
                        </select>
                        <span className="mr-2">{line.dose > 1 ? `${dosingLabel}s` : dosingLabel}</span>
                        <select
                            value={line.frequency}
                            onChange={(e) => handleInputChange(index, 'frequency', parseInt(e.target.value))}
                            className="mr-1"
                        >
                            {[...Array(6).keys()].map((num) => (
                                <option key={num} value={num}>
                                    {num}
                                </option>
                            ))}
                        </select>
                        <span className="mr-2">times daily, for</span>
                        <select
                            value={line.duration}
                            onChange={(e) => handleInputChange(index, 'duration', parseInt(e.target.value))}
                            className="mr-1"
                        >
                            {[...Array(31).keys()].map((num) => (
                                <option key={num} value={num}>
                                    {num}
                                </option>
                            ))}
                        </select>
                        <span>days</span>
                    </div>
                    <div className="flex justify-end w-full lg:w-auto">
                        <button onClick={() => removeLine(index)} className="ml-4 px-2 py-1 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                            -
                        </button>
                    </div>
                </div>
            ))}
            </div>
            {/* Add Line Button */}
            <div className="w-full flex justify-end">
            <button onClick={addLine} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                Add Line
            </button>
            </div>
        </div>
    );
};
