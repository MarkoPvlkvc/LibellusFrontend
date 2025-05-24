import { useState } from "react";

import Input from "@/components/Input";
import ButtonPrimary from "@/components/ButtonPrimary";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex justify-center items-center h-full">
      <div className="p-8 bg-gray-300 w-fit rounded-2xl">
        <p className="font-bold text-center text-xl">Login</p>
        <div className="flex flex-col mt-8 gap-5 items-center">
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
              value={password}
              placeholder="Enter password"
              onChange={setPassword}
              className="mt-1"
            />
          </div>

          <div className="w-full mt-6">
            <ButtonPrimary className="w-full">Login</ButtonPrimary>

            <p className="text-center text-sm mt-6">Don't have an account?</p>
            <ButtonPrimary
              onClick={() => (window.location.href = "/register")}
              className="mt-2 w-full">
              Register
            </ButtonPrimary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
