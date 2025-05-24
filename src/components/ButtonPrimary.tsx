"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, type FC } from "react";

interface ButtonPrimaryProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

const ButtonPrimary: FC<ButtonPrimaryProps> = ({
  className,
  children,
  "aria-label": ariaLabel,
  onClick,
  ...props
}) => {
  return (
    <button
      className={cn(
        `px-5 py-2 bg-gray-700 w-fit cursor-pointer hover:bg-gray-600 transition-all font-bold text-amber-50 rounded-2xl`,
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
