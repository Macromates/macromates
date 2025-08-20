import { useState } from "react";

export default function AIInputForm({ onSubmit }) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!inputValue.trim()) {
      alert("Please enter a valid input.");
      return;
    }
    onSubmit(inputValue);
  };

  const handleOnChange = (event) => {
    setInputValue(event.target.value);
  };

  return (
    <div className="ai-input-form flex flex-col gap-4 pb-24 mt-8 overflow-scroll">
      <span className="text-sm font-medium text-primary">
        Set goal (with amount and optional time frame)
      </span>
      <textarea
        className="textarea textarea-bordered w-full border-1 border-primary/75 text-primary"
        rows="4"
        name="inputField"
        placeholder="e.g. 'I want to lose 5kg in 2 months')"
        required
        onChange={handleOnChange} // This is just to ensure the textarea is controlled
      ></textarea>
      <button className="btn btn-primary mt-4" onClick={handleSubmit}>
        Validate Goal
      </button>
    </div>
  );
}
