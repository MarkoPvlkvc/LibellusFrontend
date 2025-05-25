import { type ClassValue, clsx } from "clsx";
import Cookies from "js-cookie";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function redirectIfNoToken() {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="));

  if (!token) {
    window.location.href = "/login";
  }
}

export const isLibrarian = () => {
  return Cookies.get("userType") == "Librarian";
};
