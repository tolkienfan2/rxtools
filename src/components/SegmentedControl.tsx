import React from 'react';

interface SegmentedControlProps {
  options: string[];
  activeOption: string;
  onOptionClick: (option: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, activeOption, onOptionClick }) => {
  return (
    <div className="segmented-control">
      {options.map((option) => (
        <button
          key={option}
          className={`segmented-control__button ${activeOption === option ? 'segmented-control__button--active' : ''}`}
          onClick={() => onOptionClick(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};