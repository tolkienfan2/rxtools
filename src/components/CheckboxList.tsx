import React, { useState, useEffect } from 'react';
import { DosingModel } from '../models/dosing';
import { PackSize } from '../types';

type CheckboxListProps = {
    dosingModel: DosingModel;
    packSizes: PackSize[];
}

export const CheckboxList: React.FC<CheckboxListProps> = ({ dosingModel, packSizes }) => {
    const [selectedSizes, setSelectedSizes] = useState<PackSize[]>([]);

    const handleCheckboxChange = (packSize: PackSize) => {
        const isSelected = selectedSizes.some(size => size.packSize === packSize.packSize && size.units === packSize.units);
        const newSelectedSizes = isSelected
            ? selectedSizes.filter(size => size.packSize !== packSize.packSize || size.units !== packSize.units)
            : [...selectedSizes, packSize];

        setSelectedSizes(newSelectedSizes);
        dosingModel.setSelectedPackSizes(newSelectedSizes);
    };

    useEffect(() => {
        setSelectedSizes([]);
        dosingModel.setSelectedPackSizes([]);
    }, [packSizes, dosingModel]);

    return (
        <div className="grid grid-cols-2 gap-4">
            {packSizes.map(packSize => (
                <div key={`${packSize.packSize}-${packSize.units}`} className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={selectedSizes.some(size => size.packSize === packSize.packSize && size.units === packSize.units)}
                        onChange={() => handleCheckboxChange(packSize)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <label className="text-gray-700">
                        {`${packSize.packSize} ${packSize.units}`}
                    </label>
                </div>
            ))}
        </div>
    );
};
