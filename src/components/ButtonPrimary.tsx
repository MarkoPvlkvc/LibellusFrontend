"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, type FC } from "react";

interface ButtonPrimaryProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  varient?: "primary" | "secondary";
}

const ButtonPrimary: FC<ButtonPrimaryProps> = ({
  className,
  children,
  "aria-label": ariaLabel,
  onClick,
  varient = "primary",
  ...props
}) => {
  return (
    <button
      className={cn(
        `px-5 py-2 ${
          varient === "primary"
            ? "bg-gray-700 border-2 border-solid border-transparent hover:bg-gray-600 text-amber-50"
            : "border-2 border-solid border-gray-400 hover:border-gray-600 text-gray-700"
        } w-fit cursor-pointer transition-all font-bold rounded-2xl`,
        className
      )}
      aria-label={ariaLabel}
      onClick={onClick}
      {...props}>
      {children}
    </button>
  );
};

ButtonPrimary.displayName = "ButtonPrimary";

export default ButtonPrimary;
