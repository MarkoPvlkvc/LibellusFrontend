import axios from "axios";
import { useEffect, useState } from "react";
import { isLibrarian, redirectIfNoToken } from "./lib/utils";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";

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

type TableProps =
  | { category: "books"; data: BookItem[] }
  | { category: "authors"; data: AuthorItem[] };

const token = Cookies.get("token");

const fetchCategoryData = async (category: FetchCategory) => {
  const response = await axios.get(`http://localhost:3001/${category}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

const Table = ({ category, data }: TableProps) => {
  if (category === "books") {
    return (
      <div className="m-4 border border-solid p-2 border-gray-300 rounded-3xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Year</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Copies</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="group cursor-pointer">
                <td className="px-4 py-2 rounded-l-2xl group-even:bg-gray-100 group-hover:bg-gray-300 transition-all">
                  {item.attributes.title}
                </td>
                <td className="px-4 py-2 group-even:bg-gray-100 group-hover:bg-gray-300 transition-all">
                  {item.attributes.description}
                </td>
                <td className="px-4 py-2 group-even:bg-gray-100 group-hover:bg-gray-300 transition-all">
                  {item.attributes.published_year}
                </td>
                <td className="px-4 py-2 group-even:bg-gray-100 group-hover:bg-gray-300 transition-all">
                  {item.attributes.book_type}
                </td>
                <td className="px-4 py-2 group-even:bg-gray-100 group-hover:bg-gray-300 transition-all rounded-r-2xl">
                  {item.attributes.copies_available}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (category === "authors") {
    return (
      <div className="m-4 border border-solid p-2 border-gray-300 rounded-3xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">First Name</th>
              <th className="px-4 py-2 text-left">Last Name</th>
              <th className="px-4 py-2 text-left">Biography</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="group cursor-pointer">
                <td className="px-4 py-2 rounded-l-2xl group-even:bg-gray-100 group-hover:bg-gray-300 transition-all">
                  {item.attributes.first_name}
                </td>
                <td className="px-4 py-2 group-even:bg-gray-100 group-hover:bg-gray-300 transition-all">
                  {item.attributes.last_name}
                </td>
                <td className="px-4 py-2 rounded-r-2xl group-even:bg-gray-100 group-hover:bg-gray-300 transition-all">
                  {item.attributes.biography}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
};

const App = () => {
  const [category, setCategory] = useState<FetchCategory>("books");

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["categoryData", category],
    queryFn: () => fetchCategoryData(category),
    enabled: false,
  });

  const handleFetch = () => {
    refetch();
  };

  useEffect(() => {
    redirectIfNoToken();
  }, []);

  useEffect(() => {
    handleFetch();
  }, [category]);

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

      {isFetching && <p>Loading...</p>}

      {data?.data && <Table category={category} data={data.data} />}
    </div>
  );
};

export default App;
