import { redirectIfNoToken } from "@/lib/utils";
import { useEffect } from "react";

const Dashboard = () => {
  useEffect(() => {
    redirectIfNoToken();
  }, []);

  return <div className="h-full">Dashboard</div>;
};

export default Dashboard;
