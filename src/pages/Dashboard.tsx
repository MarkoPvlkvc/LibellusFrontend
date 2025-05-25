import ButtonPrimary from "@/components/ButtonPrimary";
import { isLibrarian, redirectIfNoToken } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

const token = Cookies.get("token");

type FetchCategory = "books" | "authors";

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

const bookTypes = [
  "fiction",
  "nonfiction",
  "fantasy",
  "scifi",
  "mystery",
  "romance",
  "horror",
  "historical",
  "biography",
  "self_help",
];

const Dashboard = () => {
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [showInputRow, setShowInputRow] = useState(false);
  const [newBook, setNewBook] = useState({
    title: "",
    published_year: "",
    description: "",
    book_type: "",
    copies_available: "",
  });

  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editedBook, setEditedBook] = useState<typeof newBook>(newBook);

  const queryClient = useQueryClient();

  const fetchCategoryData = async (category: FetchCategory) => {
    const response = await axios.get(`http://localhost:3001/${category}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  };

  const { data: authorsData } = useQuery<{ data: AuthorItem[] }>({
    queryKey: ["authors"],
    queryFn: () => fetchCategoryData("authors"),
  });

  const { data: booksData } = useQuery<{ data: BookItem[] }>({
    queryKey: ["books"],
    queryFn: () => fetchCategoryData("books"),
  });

  useEffect(() => {
    redirectIfNoToken();
    if (!isLibrarian()) {
      window.location.href = "/user";
    }
  }, []);

  const filteredBooks = (() => {
    if (!selectedAuthorId || !authorsData?.data || !booksData?.data) return [];

    const selectedAuthor = authorsData.data.find(
      (a) => a.id === selectedAuthorId
    );
    if (!selectedAuthor) return [];

    const bookIds = selectedAuthor.relationships.books.data.map((b) => b.id);
    return booksData.data.filter((book) => bookIds.includes(book.id));
  })();

  const headers = [
    "title",
    "published year",
    "description",
    "book type",
    "copies available",
  ];

  const handleSaveNewBook = async () => {
    if (!selectedAuthorId) return;

    const payload = {
      book: {
        title: newBook.title,
        published_year: Number(newBook.published_year),
        description: newBook.description,
        book_type: newBook.book_type,
        copies_available: Number(newBook.copies_available),
        author_id: Number(selectedAuthorId),
      },
    };

    try {
      await axios.post("http://localhost:3001/books", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowInputRow(false);
      setNewBook({
        title: "",
        published_year: "",
        description: "",
        book_type: "",
        copies_available: "",
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["books"] }),
        queryClient.invalidateQueries({ queryKey: ["authors"] }),
      ]);
    } catch (error) {
      console.error("error creating book:", error);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      await axios.delete(`http://localhost:3001/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["books"] }),
        queryClient.invalidateQueries({ queryKey: ["authors"] }),
      ]);
    } catch (error) {
      console.error("error deleting book:", error);
    }
  };

  const handleStartEdit = (book: BookItem) => {
    setEditingBookId(book.id);
    setEditedBook({
      title: book.attributes.title,
      published_year: book.attributes.published_year.toString(),
      description: book.attributes.description,
      book_type: book.attributes.book_type,
      copies_available: book.attributes.copies_available.toString(),
    });
  };

  const handleSaveEdit = async (bookId: string) => {
    const payload = {
      book: {
        title: editedBook.title,
        published_year: Number(editedBook.published_year),
        description: editedBook.description,
        book_type: editedBook.book_type,
        copies_available: Number(editedBook.copies_available),
        author_id: Number(selectedAuthorId),
      },
    };

    try {
      await axios.put(`http://localhost:3001/books/${bookId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEditingBookId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["books"] }),
        queryClient.invalidateQueries({ queryKey: ["authors"] }),
      ]);
    } catch (error) {
      console.error("error updating book:", error);
    }
  };

  return (
    <div className="h-full">
      <div className="px-4 pt-4">
        <label htmlFor="authorSelect" className="block mb-2 font-semibold">
          select an author:
        </label>
        <select
          id="authorSelect"
          className="w-fit p-2 border border-gray-300 rounded-2xl"
          value={selectedAuthorId || ""}
          onChange={(e) => setSelectedAuthorId(e.target.value)}>
          <option value="" disabled>
            --
          </option>
          {authorsData?.data.map((author) => (
            <option key={author.id} value={author.id}>
              {author.attributes.first_name} {author.attributes.last_name}
            </option>
          ))}
        </select>

        {selectedAuthorId && (
          <p className="mt-4">
            <span className="font-bold">biography:</span>{" "}
            {
              authorsData?.data.find((author) => author.id === selectedAuthorId)
                ?.attributes.biography
            }
          </p>
        )}
      </div>

      <div className="w-full flex px-4 mt-4">
        <ButtonPrimary
          className="ml-auto"
          onClick={() => setShowInputRow(true)}>
          New Book
        </ButtonPrimary>
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
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {showInputRow && (
              <tr>
                {[
                  "title",
                  "published_year",
                  "description",
                  "book_type",
                  "copies_available",
                ].map((field) => (
                  <td className="px-2 py-1" key={field}>
                    {field === "book_type" ? (
                      <select
                        value={newBook.book_type}
                        onChange={(e) =>
                          setNewBook((prev) => ({
                            ...prev,
                            book_type: e.target.value,
                          }))
                        }
                        className="w-full border p-1 rounded">
                        <option value="">select type</option>
                        {bookTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={
                          field === "published_year" ||
                          field === "copies_available"
                            ? "number"
                            : "text"
                        }
                        value={newBook[field as keyof typeof newBook]}
                        onChange={(e) =>
                          setNewBook((prev) => ({
                            ...prev,
                            [field]: e.target.value,
                          }))
                        }
                        className="w-full border p-1 rounded"
                        placeholder={field}
                      />
                    )}
                  </td>
                ))}
                <td className="px-2 py-1">
                  <ButtonPrimary onClick={handleSaveNewBook}>
                    save
                  </ButtonPrimary>
                </td>
              </tr>
            )}

            {filteredBooks.map((book) => (
              <tr key={book.id}>
                {editingBookId === book.id ? (
                  <>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={editedBook.title}
                        onChange={(e) =>
                          setEditedBook((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full border p-1 rounded"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        value={editedBook.published_year}
                        onChange={(e) =>
                          setEditedBook((prev) => ({
                            ...prev,
                            published_year: e.target.value,
                          }))
                        }
                        className="w-full border p-1 rounded"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={editedBook.description}
                        onChange={(e) =>
                          setEditedBook((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="w-full border p-1 rounded"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={editedBook.book_type}
                        onChange={(e) =>
                          setEditedBook((prev) => ({
                            ...prev,
                            book_type: e.target.value,
                          }))
                        }
                        className="w-full border p-1 rounded">
                        <option value="">select type</option>
                        {bookTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        value={editedBook.copies_available}
                        onChange={(e) =>
                          setEditedBook((prev) => ({
                            ...prev,
                            copies_available: e.target.value,
                          }))
                        }
                        className="w-full border p-1 rounded"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <ButtonPrimary onClick={() => handleSaveEdit(book.id)}>
                        Save
                      </ButtonPrimary>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2">{book.attributes.title}</td>
                    <td className="px-4 py-2">
                      {book.attributes.published_year}
                    </td>
                    <td className="px-4 py-2">{book.attributes.description}</td>
                    <td className="px-4 py-2">{book.attributes.book_type}</td>
                    <td className="px-4 py-2">
                      {book.attributes.copies_available}
                    </td>
                    <td className="px-2 py-1 space-x-2">
                      <ButtonPrimary
                        varient="secondary"
                        onClick={() => handleStartEdit(book)}>
                        Edit
                      </ButtonPrimary>
                      <ButtonPrimary
                        varient="secondary"
                        onClick={() => handleDeleteBook(book.id)}>
                        Delete
                      </ButtonPrimary>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
