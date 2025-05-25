import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { isLibrarian, redirectIfNoToken } from "./lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import ButtonPrimary from "./components/ButtonPrimary";

type FetchCategory = "books" | "authors";

interface BookItem {
  id: string;
  type: "book";
  attributes: {
    title: string;
    published_year: number;
    description: string;
    book_type: string;
    copies_available: number;
  };
  relationships: {
    author: {
      data: {
        id: string;
        type: "author";
      };
    };
  };
}

interface AuthorItem {
  id: string;
  type: "author";
  attributes: {
    first_name: string;
    last_name: string;
    biography: string;
  };
  relationships: {
    books: {
      data: {
        id: string;
        type: "book";
      }[];
    };
  };
}

const token = Cookies.get("token");
const userId = Number(Cookies.get("userId"));

const fetchCategoryData = async (category: FetchCategory) => {
  const response = await axios.get(`http://localhost:3001/${category}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

const handleReservation = async ({
  user_id,
  book_id,
}: {
  user_id: number;
  book_id: number;
}) => {
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 14);

  const response = await axios.post(
    "http://localhost:3001/reservations",
    {
      reservation: {
        reservation_date: today.toISOString().split("T")[0],
        expiration_date: dueDate.toISOString().split("T")[0],
        user_id: user_id,
        book_id: book_id,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

const App = () => {
  const [category, setCategory] = useState<FetchCategory>("books");

  const usePostReservation = () => {
    return useMutation({
      mutationFn: handleReservation,
      onSuccess: () => {
        window.alert("Reservation successful!");
      },
    });
  };

  const { mutate: reserveBook, isPending, error, data } = usePostReservation();

  const handleReserve = (userId: number, bookId: number) => {
    reserveBook({ user_id: userId, book_id: bookId });
  };

  const { data: categoryData, refetch: refetchCategory } = useQuery({
    queryKey: ["categoryData", category],
    queryFn: () => fetchCategoryData(category),
    enabled: false,
  });

  const { data: booksData } = useQuery({
    queryKey: ["books"],
    queryFn: () => fetchCategoryData("books"),
  });

  const booksCountMap = useMemo(() => {
    if (!booksData || !Array.isArray(booksData.data)) {
      return {};
    }

    return booksData.data.reduce((acc: Record<string, number>, item: any) => {
      const authorId = item.relationships?.author?.data?.id;
      if (!authorId) return acc;

      if (!acc[authorId]) {
        acc[authorId] = 0;
      }
      acc[authorId]++;
      return acc;
    }, {});
  }, [booksData]);

  const { data: authorsData } = useQuery({
    queryKey: ["authors"],
    queryFn: () => fetchCategoryData("authors"),
  });

  const authorsMap = useMemo(() => {
    if (!authorsData || !Array.isArray(authorsData.data)) return {};
    return authorsData.data.reduce(
      (acc: Record<string, AuthorItem>, author: AuthorItem) => {
        acc[author.id] = author;
        return acc;
      },
      {}
    );
  }, [authorsData]);

  const handleFetch = () => {
    refetchCategory();
  };

  useEffect(() => {
    handleFetch();
  }, [category]);

  useEffect(() => {
    redirectIfNoToken();
  }, []);

  const config = {
    books: {
      headers: ["Title", "Description", "Author", "Year", "Type", "Copies"],
      renderRow: (item: BookItem) => {
        const authorId = item.relationships.author?.data?.id;
        const authorName =
          authorsMap[authorId]?.attributes.first_name || "Unknown";

        return [
          <td
            key="title"
            className="px-4 py-2 rounded-l-2xl group-even:bg-gray-100 group-hover:bg-gray-300 transition-all">
            {item.attributes.title}
          </td>,
          <td
            key="description"
            className="px-4 py-2 group-even:bg-gray-100 group-hover:bg-gray-300 transition-all">
            {item.attributes.description}
          </td>,
          <td
            key="author"
            className="px-4 py-2 group-even:bg-gray-100 group-hover:bg-gray-300 transition-all">
            {authorName}
          </td>,
          <td
            key="year"
            className="px-4 py-2 group-even:bg-gray-100 group-hover:bg-gray-300 transition-all">
            {item.attributes.published_year}
          </td>,
          <td
            key="type"
            className="px-4 py-2 group-even:bg-gray-100 group-hover:bg-gray-300 transition-all">
            {item.attributes.book_type}
          </td>,
          <td
            key="copies"
            className="px-4 py-2 rounded-r-2xl group-even:bg-gray-100 group-hover:bg-gray-300 transition-all">
            {item.attributes.copies_available}
          </td>,
        ];
      },
    },
    authors: {
      headers: ["First Name", "Last Name", "Biography", "Books"],
      renderRow: (item: AuthorItem) => {
        const authorId = item.id;
        const booksCount = booksCountMap[authorId];

        return [
          <td
            key="firstName"
            className="px-4 py-2 rounded-l-2xl group-even:bg-gray-100 group-hover:bg-gray-300 transition-all">
            {item.attributes.first_name}
          </td>,
          <td
            key="lastName"
            className="px-4 py-2 group-even:bg-gray-100 group-hover:bg-gray-300 transition-all">
            {item.attributes.last_name}
          </td>,
          <td
            key="bio"
            className="px-4 py-2 group-even:bg-gray-100 group-hover:bg-gray-300 transition-all">
            {item.attributes.biography}
          </td>,
          <td
            key="books"
            className="px-4 py-2 rounded-r-2xl group-even:bg-gray-100 group-hover:bg-gray-300 transition-all">
            {booksCount || 0}
          </td>,
        ];
      },
    },
  };

  if (!config[category]) return null;

  const { headers, renderRow } = config[category];

  function flattenDataAttributes(
    obj: any,
    prefix = "data"
  ): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(obj)) {
      const attrKey = `${prefix}-${key}`;

      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        Object.assign(result, flattenDataAttributes(value, attrKey));
      } else {
        result[attrKey] = String(value);
      }
    }

    return result;
  }

  return (
    <div className="h-full">
      <div className="flex ml-4 mt-4 items-center border border-solid border-gray-300 w-fit rounded-3xl p-2">
        <p className="mx-4 font-medium text-gray-700">Category:</p>
        <label className="has-checked:bg-gray-700 transition-all has-checked:hover:bg-gray-600 hover:bg-gray-300 cursor-pointer has-checked:text-white not-[has-checked]:text-gray-700 px-6 py-2 rounded-2xl">
          <input
            type="radio"
            name="category"
            value="books"
            onChange={() => setCategory("books")}
            checked={category === "books"}
            className="hidden"
          />
          Books
        </label>
        <label className="has-checked:bg-gray-700 transition-all has-checked:hover:bg-gray-600 hover:bg-gray-300 cursor-pointer has-checked:text-white not-[has-checked]:text-gray-700 px-6 py-2 rounded-2xl">
          <input
            type="radio"
            name="category"
            value="authors"
            onChange={() => setCategory("authors")}
            checked={category === "authors"}
            className="hidden"
          />
          Authors
        </label>
      </div>

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
            {categoryData?.data &&
              categoryData.data.map((item: any) => {
                const dataAttributes = flattenDataAttributes(item);
                return (
                  <tr
                    key={item.id}
                    className="group cursor-pointer relative"
                    {...dataAttributes}>
                    {renderRow(item)}
                    <td className="absolute h-full translate-x-full transition-all group-hover:-translate-x-full">
                      {!isLibrarian() && (
                        <ButtonPrimary
                          onClick={() => {
                            handleReserve(userId, item.id);
                            item.attributes.copies_available -= 1;
                          }}
                          disabled={item.attributes.copies_available <= 0}
                          className={`py-0 h-full ${
                            item.attributes.copies_available <= 0
                              ? "bg-gray-400 pointer-events-none"
                              : ""
                          }`}>
                          Reserve
                        </ButtonPrimary>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
