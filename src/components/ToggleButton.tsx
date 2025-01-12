import React from 'react';

interface ToggleButtonProps {
  options: string[];
  activeOption: string;
  onOptionClick: (option: string) => void;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({ options, activeOption, onOptionClick }) => {
  return (
    <div className="toggle-button">
      {options.map((option) => (
        <button
          key={option}
          className={`toggle-button__option ${activeOption === option ? 'toggle-button__option--active' : ''}`}
          onClick={() => onOptionClick(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};