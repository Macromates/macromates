export default function StepProgress({ currentStep, steps }) {
  return (
    <div className="w-full">
      <ul className="steps steps-horizontal w-full">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`step ${index + 1 <= currentStep ? "step-primary" : ""}`}
            data-content={index + 1 <= currentStep ? "✓" : index + 1}
          >
            <span className="hidden sm:inline">{step.label}</span>
            <span className="sm:hidden">{step.shortLabel || step.label}</span>
          </li>
        ))}
      </ul>

      {/* Mobile-friendly step indicator */}
      <div className="text-center mt-4 sm:hidden">
        <span className="text-sm text-primary">
          Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.label}
        </span>
      </div>
    </div>
  );
}
