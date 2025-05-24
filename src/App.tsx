import { useEffect } from "react";

function redirectIfNoToken() {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="));

  if (!token) {
    window.location.href = "/login";
  }
}

const App = () => {
  useEffect(() => {
    redirectIfNoToken();
  }, []);

  return <div className="h-full">This is index</div>;
};

export default App;
