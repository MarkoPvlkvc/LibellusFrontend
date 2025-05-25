import ButtonPrimary from "@/components/ButtonPrimary";
import { isLibrarian, redirectIfNoToken } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import { useEffect } from "react";

const fetchCategoryData = async (category: string) => {
  const response = await axios.get(`http://localhost:3001/${category}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

const token = Cookies.get("token");

const User = () => {
  const { data: reservationData, refetch: refetchReservation } = useQuery({
    queryKey: ["reservationData"],
    queryFn: () => fetchCategoryData("reservations"),
    enabled: false,
  });

  const { data: borrowData, refetch: refetchBorrow } = useQuery({
    queryKey: ["borrowData"],
    queryFn: () => fetchCategoryData("borrowings"),
    enabled: false,
  });

  const handleFetch = () => {
    refetchReservation();
    refetchBorrow();
  };

  useEffect(() => {
    redirectIfNoToken();

    if (isLibrarian()) {
      window.location.href = "/dashboard";
    }

    handleFetch();
  }, []);

  const headers = ["Type", "Book ID", "Member ID", "Start Date", "End Date"];

  const renderRow = (item: any) => {
    const isReservation = item.type === "reservation";
    const attrs = item.attributes || {};
    const relationships = item.relationships || {};
    const bookId = relationships.book?.data?.id || "N/A";
    const memberId = relationships.member?.data?.id || "N/A";

    const startDate = isReservation
      ? attrs.reservation_date
      : attrs.borrow_date;
    const endDate = isReservation
      ? attrs.expiration_date
      : attrs.return_date || attrs.due_date;

    return (
      <>
        <td className="px-4 py-2">{item.type}</td>
        <td className="px-4 py-2">{bookId}</td>
        <td className="px-4 py-2">{memberId}</td>
        <td className="px-4 py-2">{startDate}</td>
        <td className="px-4 py-2">{endDate}</td>
      </>
    );
  };

  const flattenDataAttributes = (item: any) => {
    const flat: Record<string, string> = {
      "data-id": item.id,
      "data-type": item.type,
    };

    Object.entries(item.attributes || {}).forEach(([key, val]) => {
      flat[`data-${key}`] = String(val);
    });

    return flat;
  };

  return (
    <div className="h-full">
      <div className="m-4 border border-solid p-2 border-gray-300 rounded-3xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-2 text-left">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ...(reservationData?.data || []),
              ...(borrowData?.data || []),
            ].map((item: any) => {
              const dataAttributes = flattenDataAttributes(item);
              return (
                <tr
                  key={`${item.type}-${item.id}`}
                  className="group relative"
                  {...dataAttributes}>
                  {renderRow(item)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default User;
