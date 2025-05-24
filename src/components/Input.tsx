import React, { type HTMLInputTypeAttribute } from "react";

type InputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: HTMLInputTypeAttribute;
};

const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder = "Email",
  className = "",
  type,
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border border-solid border-gray-500 hover:border-gray-600 appearance-none focus:outline-none placeholder:text-gray-500 transition-all px-4 py-2 rounded-2xl ${className}`}
    />
  );
};

export default Input;
