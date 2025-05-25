import { useState } from "react";

import Input from "@/components/Input";
import ButtonPrimary from "@/components/ButtonPrimary";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const registerMember = async () => {
    const response = await axios.post("http://localhost:3001/members", {
      member: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: password,
        password_confirmation: confirmPassword,
        membership_start: new Date().toISOString().split("T")[0],
      },
    });

    return response.data;
  };

  const mutation = useMutation({
    mutationFn: registerMember,
    onSuccess: (data) => {
      const token = data.token;
      const userType = data.user.data.attributes.type;
      const userId = data.user.data.id;

      Cookies.set("token", token, {
        expires: 7,
        secure: true,
        sameSite: "Lax",
      });

      Cookies.set("userType", userType, {
        expires: 7,
        secure: true,
        sameSite: "Lax",
      });

      Cookies.set("userId", userId, {
        expires: 7,
        secure: true,
        sameSite: "Lax",
      });

      console.log("User registered successfully:", data);

      window.location.href = "/";
    },
    onError: (error) => {
      console.error("Registration failed:", error);
    },
  });

  const handleSubmit = () => {
    mutation.mutate();
  };

  return (
    <div className="flex justify-center items-center h-full">
      <div className="p-8 bg-gray-300 w-fit rounded-2xl">
        <p className="font-bold text-center text-xl">Register</p>
        <form
          className="flex flex-col mt-8 gap-5 items-center"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}>
          <div className="flex gap-4">
            <div>
              <p className="text-sm font-medium">First Name</p>
              <Input
                value={firstName}
                placeholder="Enter first name"
                onChange={setFirstName}
                className="mt-1 w-[200px]"
              />
            </div>
            <div>
              <p className="text-sm font-medium">Last Name</p>
              <Input
                value={lastName}
                placeholder="Enter last name"
                onChange={setLastName}
                className="mt-1 w-[200px]"
              />
            </div>
          </div>
          <div className="w-full">
            <p className="text-sm font-medium">Email</p>
            <Input
              value={email}
              placeholder="Enter email"
              onChange={setEmail}
              className="mt-1 w-full"
            />
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-sm font-medium">Password</p>
              <Input
                type="password"
                value={password}
                placeholder="Enter password"
                onChange={setPassword}
                className="mt-1 w-[200px]"
              />
            </div>
            <div>
              <p className="text-sm font-medium">Confirm Password</p>
              <Input
                type="password"
                value={confirmPassword}
                placeholder="Enter password"
                onChange={setConfirmPassword}
                className="mt-1 w-[200px]"
              />
            </div>
          </div>

          <div className="w-full mt-6">
            <ButtonPrimary type="submit" className="w-full">
              Register
            </ButtonPrimary>

            <p className="text-center text-sm mt-6">Already have an account?</p>
            <ButtonPrimary
              varient="secondary"
              onClick={() => (window.location.href = "/login")}
              className="mt-2 w-full"
              type="button">
              Login
            </ButtonPrimary>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
