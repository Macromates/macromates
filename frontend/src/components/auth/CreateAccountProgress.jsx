export default function CreateAccountProgress({ step }) {
  const totalSteps = 3;

  return (
    <ul className={`steps inline-flex justify-center !w-auto mt-4 gap-0`}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const idx = i + 1;
        return (
          <li
            key={idx}
            data-content=""
            className={`
              step
              ${idx <= step ? "step-primary" : ""}
              !flex-none
              mx-1        
              before:!h-0.5      
              after:!w-2           
              after:!h-2   
            `}
          />
        );
      })}
    </ul>
  );
}
