export default function useMultiStep() {
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState([
    { id: 1, label: "Goal Selection" },
    { id: 2, label: "Validation and Result" },
  ]);

  const nextStep = () => {
    setCurrentStep((prevStep) => {
      const nextStep = prevStep + 1;
      return nextStep <= steps.length ? nextStep : prevStep;
    });
  };

  const prevStep = () => {
    setCurrentStep((prevStep) => {
      const nextStep = prevStep - 1;
      return nextStep >= 1 ? nextStep : prevStep;
    });
  };

  const goToStep = (stepId) => {
    if (stepId >= 1 && stepId <= steps.length) {
      setCurrentStep(stepId);
    }
  };

  return {
    currentStep,
    steps,
    nextStep,
    prevStep,
    goToStep,
  };
}
