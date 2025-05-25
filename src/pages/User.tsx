import ButtonPrimary from "@/components/ButtonPrimary";
import { isLibrarian, redirectIfNoToken } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import { useEffect } from "react";

const token = Cookies.get("token");

const fetchCategoryData = async (category: string) => {
  const response = await axios.get(`http://localhost:3001/${category}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

const fetchNotifications = async () => {
  const today = new Date().toISOString().split("T")[0]; // e.g., '2025-05-25'
  const response = await axios.get(
    `http://localhost:3001/notifications?sent_date=${today}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

const User = () => {
  const queryClient = useQueryClient();

  const { data: reservationData, refetch: refetchReservation } = useQuery({
    queryKey: ["reservationData"],
    queryFn: () => fetchCategoryData("reservations"),
  });

  const { data: borrowData, refetch: refetchBorrow } = useQuery({
    queryKey: ["borrowData"],
    queryFn: () => fetchCategoryData("borrowings"),
  });

  const { data: notificationData } = useQuery({
    queryKey: ["notificationData"],
    queryFn: fetchNotifications,
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

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3001/reservations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      queryClient.invalidateQueries({ queryKey: ["reservationData"] });
    } catch (error) {
      console.error("Error deleting reservation:", error);
    }
  };

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

        {isReservation && (
          <td className="h-full">
            <ButtonPrimary
              varient="secondary"
              onClick={() => handleDelete(item.id)}
              className="py-0 h-full">
              Delete
            </ButtonPrimary>
          </td>
        )}
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
        <table className="w-full border-collapse relative">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-2 text-left">
                  {header}
                </th>
              ))}
              {/* Add empty header cell for the Delete button column */}
              <th className="w-24"></th>
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

      <div className="px-4 pt-4">
        <p className="font-bold mb-2">Notifications:</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {notificationData?.data?.length > 0 ? (
            notificationData.data
              .filter((n: any) => n.relationships?.member?.data)
              .map((n: any) => (
                <div
                  key={n.id}
                  className="mb-2 p-2 w-fit border border-gray-300 rounded-xl">
                  <p className="font-semibold">{n.attributes.title}</p>
                  <p>{n.attributes.content}</p>
                </div>
              ))
          ) : (
            <p className="italic text-gray-500">No notifications for today.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default User;
