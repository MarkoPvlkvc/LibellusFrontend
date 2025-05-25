import { useState } from "react";

import Input from "@/components/Input";
import ButtonPrimary from "@/components/ButtonPrimary";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMember = async (email: string, password: string) => {
    const response = await axios.post("http://localhost:3001/login", {
      email,
      password,
    });

    return response.data;
  };

  const mutation = useMutation({
    mutationFn: () => loginMember(email, password),
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

      console.log("User logged in successfully:", data);

      window.location.href = "/";
    },
    onError: (error) => {
      console.error("Login failed:", error);
      alert("Invalid email or password"); // optional feedback
    },
  });

  const handleSubmit = () => {
    mutation.mutate();
  };

  return (
    <div className="flex justify-center items-center h-full">
      <div className="p-8 bg-gray-300 w-fit rounded-2xl">
        <p className="font-bold text-center text-xl">Login</p>
        <form
          className="flex flex-col mt-8 gap-5 items-center"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}>
          <div>
            <p className="text-sm font-medium">Email</p>
            <Input
              value={email}
              placeholder="Enter email"
              onChange={setEmail}
              className="mt-1"
            />
          </div>
          <div>
            <p className="text-sm font-medium">Password</p>
            <Input
              type="password"
              value={password}
              placeholder="Enter password"
              onChange={setPassword}
              className="mt-1"
            />
          </div>

          <div className="w-full mt-6">
            <ButtonPrimary type="submit" className="w-full">
              Login
            </ButtonPrimary>

            <p className="text-center text-sm mt-6">Don't have an account?</p>
            <ButtonPrimary
              varient="secondary"
              onClick={() => (window.location.href = "/register")}
              className="mt-2 w-full"
              type="button">
              Register
            </ButtonPrimary>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
