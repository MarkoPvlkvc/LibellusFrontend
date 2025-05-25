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
    full_name: string;
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

const fetchCategoryData = async (
  category: FetchCategory,
  filters?: Record<string, string>
) => {
  let url = `http://localhost:3001/${category}`;
  if (category === "books" && filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "") {
        params.append(key, value);
      }
    });
    if (Array.from(params).length > 0) {
      url += `?${params.toString()}`;
    }
  }
  const response = await axios.get(url, {
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

  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [filters, setFilters] = useState({
    title: "",
    published_year: "",
    book_type: "",
    author_id: "",
    copies_available: "",
  });

  const sortableColumns = [
    { key: "title", label: "Title" },
    { key: "description", label: "Description" },
    { key: "author", label: "Author" },
    { key: "published_year", label: "Year" },
    { key: "book_type", label: "Type" },
    { key: "copies_available", label: "Copies" },
  ];

  // Book types for the select filter
  const bookTypes = [
    "fiction",
    "nonfiction",
    "biography",
    "science",
    "history",
    "children",
    "fantasy",
    "mystery",
    "romance",
    "horror",
    "self-help",
    "other",
  ];

  const usePostReservation = () => {
    return useMutation({
      mutationFn: handleReservation,
      onSuccess: () => {
        window.alert("Reservation successful!");
      },
    });
  };

  const { mutate: reserveBook } = usePostReservation();

  const handleReserve = (userId: number, bookId: number) => {
    reserveBook({ user_id: userId, book_id: bookId });
  };

  const { data: categoryData, refetch: refetchCategory } = useQuery({
    queryKey: ["categoryData", category, filters],
    queryFn: () => fetchCategoryData(category, filters),
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

  const authorsMap = useMemo<Record<string, AuthorItem>>(() => {
    if (!authorsData || !Array.isArray(authorsData.data)) return {};
    return authorsData.data.reduce((acc: any, author: AuthorItem) => {
      acc[author.id] = author;
      return acc;
    }, {} as Record<string, AuthorItem>);
  }, [authorsData]);

  const sortedBooksData = useMemo(() => {
    if (category !== "books" || !categoryData?.data)
      return categoryData?.data || [];

    if (!sortColumn) return categoryData.data;

    return [...categoryData.data].sort((a: any, b: any) => {
      let aValue, bValue;

      switch (sortColumn) {
        case "title":
          aValue = a.attributes.title.toLowerCase();
          bValue = b.attributes.title.toLowerCase();
          break;
        case "description":
          aValue = a.attributes.description.toLowerCase();
          bValue = b.attributes.description.toLowerCase();
          break;
        case "author":
          const authorAId = a.relationships.author?.data?.id;
          const authorBId = b.relationships.author?.data?.id;
          aValue =
            authorsMap[authorAId]?.attributes.full_name?.toLowerCase() || "";
          bValue =
            authorsMap[authorBId]?.attributes.full_name?.toLowerCase() || "";
          break;
        case "published_year":
          aValue = a.attributes.published_year;
          bValue = b.attributes.published_year;
          break;
        case "book_type":
          aValue = a.attributes.book_type.toLowerCase();
          bValue = b.attributes.book_type.toLowerCase();
          break;
        case "copies_available":
          aValue = a.attributes.copies_available;
          bValue = b.attributes.copies_available;
          break;
        default:
          aValue = "";
          bValue = "";
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [category, categoryData, sortColumn, sortDirection, authorsMap]);

  const handleFetch = () => {
    refetchCategory();
  };

  useEffect(() => {
    handleFetch();
  }, [category]);

  useEffect(() => {
    redirectIfNoToken();
  }, []);

  useEffect(() => {
    if (category === "books") {
      handleFetch();
    }
  }, [filters, category]);

  const onFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const config = {
    books: {
      headers: ["Title", "Description", "Author", "Year", "Type", "Copies"],
      renderRow: (item: BookItem) => {
        const authorId = item.relationships.author?.data?.id;
        const authorFullName =
          authorsMap[authorId]?.attributes.full_name || "Unknown";

        return [
          <td key="title" className="px-4 py-2 rounded-l-2xl">
            {item.attributes.title}
          </td>,
          <td key="description" className="px-4 py-2">
            {item.attributes.description}
          </td>,
          <td key="author" className="px-4 py-2">
            {authorFullName}
          </td>,
          <td key="year" className="px-4 py-2">
            {item.attributes.published_year}
          </td>,
          <td key="type" className="px-4 py-2">
            {item.attributes.book_type}
          </td>,
          <td key="copies" className="px-4 py-2 rounded-r-2xl">
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
          <td key="firstName" className="px-4 py-2 rounded-l-2xl">
            {item.attributes.first_name}
          </td>,
          <td key="lastName" className="px-4 py-2">
            {item.attributes.last_name}
          </td>,
          <td key="bio" className="px-4 py-2">
            {item.attributes.biography}
          </td>,
          <td key="books" className="px-4 py-2 rounded-r-2xl">
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

      {category === "books" && (
        <>
          <div className="px-4 w-full justify-end flex items-center gap-4">
            <label>
              Sort by:
              <select
                value={sortColumn || ""}
                onChange={(e) => setSortColumn(e.target.value || null)}
                className="ml-2 rounded border px-2 py-1">
                <option value="">--</option>
                {sortableColumns.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Direction:
              <select
                value={sortDirection}
                onChange={(e) =>
                  setSortDirection(e.target.value as "asc" | "desc")
                }
                className="ml-2 rounded border px-2 py-1">
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>
          </div>
          <div className="px-4 w-full flex justify-end items-center gap-4 mt-4">
            <label className="flex flex-col">
              Title:
              <input
                type="text"
                value={filters.title}
                onChange={(e) => onFilterChange("title", e.target.value)}
                className="rounded border px-2 py-1"
              />
            </label>
            <label className="flex flex-col">
              Published Year:
              <input
                type="number"
                value={filters.published_year}
                onChange={(e) =>
                  onFilterChange("published_year", e.target.value)
                }
                className="rounded border px-2 py-1"
              />
            </label>
            <label className="flex flex-col">
              Book Type:
              <select
                value={filters.book_type}
                onChange={(e) => onFilterChange("book_type", e.target.value)}
                className="rounded border px-2 py-1">
                <option value="">--</option>
                {bookTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col">
              Author:
              <select
                value={filters.author_id}
                onChange={(e) => onFilterChange("author_id", e.target.value)}
                className="rounded border px-2 py-1">
                <option value="">--</option>
                {Object.entries(authorsMap).map(([id, author]) => (
                  <option key={id} value={id}>
                    {author.attributes.first_name} {author.attributes.last_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col">
              Copies Available:
              <select
                value={filters.copies_available}
                onChange={(e) =>
                  onFilterChange("copies_available", e.target.value)
                }
                className="rounded border px-2 py-1">
                <option value="">--</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </label>
          </div>
        </>
      )}

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
            {(category === "books" ? sortedBooksData : categoryData?.data)?.map(
              (item: any) => {
                const dataAttributes = flattenDataAttributes(item);
                return (
                  <tr
                    key={item.id}
                    className="group relative"
                    {...dataAttributes}>
                    {renderRow(item)}
                    {!isLibrarian() && category === "books" && (
                      <td className="h-full pl-4">
                        <ButtonPrimary
                          varient="secondary"
                          onClick={() => {
                            handleReserve(userId, item.id);
                            item.attributes.copies_available -= 1;
                          }}
                          disabled={item.attributes.copies_available <= 0}
                          className={`py-0 h-full ${
                            item.attributes.copies_available <= 0
                              ? "border-gray-200 text-gray-200 pointer-events-none"
                              : ""
                          }`}>
                          Reserve
                        </ButtonPrimary>
                      </td>
                    )}
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
