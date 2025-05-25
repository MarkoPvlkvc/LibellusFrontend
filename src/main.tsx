import { lazy, StrictMode } from "react";
import ReactDOM from "react-dom/client";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";

import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Cookies from "js-cookie";

import ButtonPrimary from "./components/ButtonPrimary.tsx";
import Login from "./pages/Login.tsx";
import User from "./pages/User.tsx";
import Register from "./pages/Register.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import { isLibrarian } from "./lib/utils.ts";

const queryClient = new QueryClient();

const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </QueryClientProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: Register,
});
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
});
const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/user",
  component: User,
});
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: Dashboard,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  registerRoute,
  loginRoute,
  userRoute,
  dashboardRoute,
]);

const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const isLoggedIn = () => {
  return !!Cookies.get("token");
};

const handleLogout = () => {
  Cookies.remove("token");
  Cookies.remove("userType");
  Cookies.remove("userId");
  window.location.href = "/";
};

const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <div className="h-svh grid grid-rows-[auto_1fr]">
        <div className="bg-gray-300 select-none px-8 py-4 flex justify-between items-center">
          <h1
            onClick={() => (window.location.href = "/")}
            className="font-bold text-2xl text-gray-700 cursor-pointer">
            Lib•ellus
          </h1>
          <div className="flex gap-2">
            {!isLoggedIn() && (
              <ButtonPrimary onClick={() => (window.location.href = "/login")}>
                Login
              </ButtonPrimary>
            )}
            {isLoggedIn() && (
              <>
                {isLibrarian() ? (
                  <ButtonPrimary
                    onClick={() => (window.location.href = "/dashboard")}>
                    Dashboard
                  </ButtonPrimary>
                ) : (
                  <ButtonPrimary
                    onClick={() => (window.location.href = "/user")}>
                    User
                  </ButtonPrimary>
                )}
                <ButtonPrimary
                  varient="secondary"
                  onClick={() => handleLogout()}>
                  Logout
                </ButtonPrimary>
              </>
            )}
          </div>
        </div>
        <RouterProvider router={router} />
      </div>
    </StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
