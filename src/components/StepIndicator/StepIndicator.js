import React from 'react';
import './StepIndicator.css'; // Assuming you will style your component

function StepIndicator({ currentStep, totalSteps }) {
    return (
        <div className="step-indicator-container">
            {Array.from({ length: totalSteps }, (_, index) => {
                // Determine if the step is completed
                const isCompleted = index < currentStep;
                // Determine if the step is current
                const isCurrent = index === currentStep;

                return (
                    <div key={index} className="step">
                        <div className={`step-content ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                            {index + 1}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default StepIndicator;
