import ButtonPrimary from "@/components/ButtonPrimary";
import { isLibrarian, redirectIfNoToken } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

const token = Cookies.get("token");

type FetchCategory = "books" | "authors";
type tabCategory = "codebook" | "masterdetail";

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
  const [showModal, setShowModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const [newBook, setNewBook] = useState({
    title: "",
    published_year: "",
    description: "",
    book_type: "",
    copies_available: "",
  });

  const [category, setCategory] = useState<tabCategory>("codebook");

  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editedBook, setEditedBook] = useState<typeof newBook>(newBook);

  const [newAuthor, setNewAuthor] = useState({
    first_name: "",
    last_name: "",
    biography: "",
  });

  const [editingAuthorId, setEditingAuthorId] = useState<string | null>(null);
  const [editedAuthor, setEditedAuthor] = useState<typeof newAuthor>(newAuthor);

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

  const handleSaveNewAuthor = async () => {
    const payload = {
      author: { ...newAuthor },
    };
    try {
      await axios.post("http://localhost:3001/authors", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowInputRow(false);
      setNewAuthor({ first_name: "", last_name: "", biography: "" });

      await queryClient.invalidateQueries({ queryKey: ["authors"] });
    } catch (error) {
      console.error("error creating author:", error);
    }
  };

  const handleDeleteAuthor = async (authorId: string) => {
    try {
      await axios.delete(`http://localhost:3001/authors/${authorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await queryClient.invalidateQueries({ queryKey: ["authors"] });
    } catch (error) {
      console.error("error deleting author:", error);
    }
  };

  const handleStartEditAuthor = (author: AuthorItem) => {
    setEditingAuthorId(author.id);
    setEditedAuthor({
      first_name: author.attributes.first_name,
      last_name: author.attributes.last_name,
      biography: author.attributes.biography,
    });
  };

  const handleSaveEditAuthor = async (authorId: string) => {
    const payload = {
      author: { ...editedAuthor },
    };
    try {
      await axios.put(`http://localhost:3001/authors/${authorId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEditingAuthorId(null);
      await queryClient.invalidateQueries({ queryKey: ["authors"] });
    } catch (error) {
      console.error("error updating author:", error);
    }
  };

  const handleSelectMasterDetail = (authorId: string) => {
    setSelectedAuthorId(authorId);
    setCategory("masterdetail");
  };

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["books"] });
  }, [showModal]);

  return (
    <div className="h-full">
      <div className="flex ml-4 mt-4 items-center border border-solid border-gray-300 w-fit rounded-3xl p-2">
        <p className="mx-4 font-medium text-gray-700">Category:</p>
        <label className="has-checked:bg-gray-700 transition-all has-checked:hover:bg-gray-600 hover:bg-gray-300 cursor-pointer has-checked:text-white not-[has-checked]:text-gray-700 px-6 py-2 rounded-2xl">
          <input
            type="radio"
            name="category"
            value="codebook"
            onChange={() => setCategory("codebook")}
            checked={category === "codebook"}
            className="hidden"
          />
          Codebook
        </label>
        <label className="has-checked:bg-gray-700 transition-all has-checked:hover:bg-gray-600 hover:bg-gray-300 cursor-pointer has-checked:text-white not-[has-checked]:text-gray-700 px-6 py-2 rounded-2xl">
          <input
            type="radio"
            name="category"
            value="masterdetail"
            onChange={() => setCategory("masterdetail")}
            checked={category === "masterdetail"}
            className="hidden"
          />
          Master-Detail
        </label>
      </div>

      {category === "codebook" ? (
        <div className="border border-solid border-gray-200 p-2 m-4 rounded-4xl">
          <div className="w-full flex px-4 mt-4">
            <ButtonPrimary
              className="ml-auto"
              onClick={() => setShowInputRow(true)}>
              New Author
            </ButtonPrimary>
          </div>

          <div className="m-4 border border-solid p-2 border-gray-300 rounded-3xl overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["First Name", "Last Name", "Biography"].map((header) => (
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
                    {["first_name", "last_name", "biography"].map((field) => (
                      <td className="px-2 py-1" key={field}>
                        <input
                          type="text"
                          value={newAuthor[field as keyof typeof newAuthor]}
                          onChange={(e) =>
                            setNewAuthor((prev) => ({
                              ...prev,
                              [field]: e.target.value,
                            }))
                          }
                          className="w-full border p-1 rounded"
                          placeholder={field.replace("_", " ")}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1">
                      <ButtonPrimary onClick={handleSaveNewAuthor}>
                        Save
                      </ButtonPrimary>
                    </td>
                  </tr>
                )}

                {authorsData?.data.map((author) =>
                  editingAuthorId === author.id ? (
                    <tr key={author.id}>
                      {["first_name", "last_name", "biography"].map((field) => (
                        <td className="px-2 py-1" key={field}>
                          <input
                            type="text"
                            value={
                              editedAuthor[
                                field as keyof typeof editedAuthor
                              ] || ""
                            }
                            onChange={(e) =>
                              setEditedAuthor((prev) => ({
                                ...prev,
                                [field]: e.target.value,
                              }))
                            }
                            className="w-full border p-1 rounded"
                          />
                        </td>
                      ))}
                      <td className="px-2 py-1">
                        <ButtonPrimary
                          onClick={() => handleSaveEditAuthor(author.id)}>
                          Save
                        </ButtonPrimary>
                      </td>
                    </tr>
                  ) : (
                    <tr key={author.id}>
                      <td className="px-4 py-2">
                        {author.attributes.first_name}
                      </td>
                      <td className="px-4 py-2">
                        {author.attributes.last_name}
                      </td>
                      <td className="px-4 py-2">
                        {author.attributes.biography}
                      </td>
                      <td className="px-2 py-1 space-x-2 flex justify-end">
                        <ButtonPrimary
                          varient="secondary"
                          onClick={() => handleSelectMasterDetail(author.id)}>
                          Details
                        </ButtonPrimary>
                        <ButtonPrimary
                          varient="secondary"
                          onClick={() => handleStartEditAuthor(author)}>
                          Edit
                        </ButtonPrimary>
                        <ButtonPrimary
                          varient="secondary"
                          onClick={() => handleDeleteAuthor(author.id)}>
                          Delete
                        </ButtonPrimary>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border border-solid border-gray-200 p-2 m-4 rounded-4xl">
          <div className="px-4 pt-4">
            <label htmlFor="authorSelect" className="block mb-2 font-semibold">
              Select an author:
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
            <p className="mt-4">
              <span className="font-bold">Biography:</span>{" "}
              {
                authorsData?.data.find(
                  (author) => author.id === selectedAuthorId
                )?.attributes.biography
              }
            </p>
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
                        Save
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
                          <ButtonPrimary
                            onClick={() => handleSaveEdit(book.id)}>
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
                        <td className="px-4 py-2">
                          {book.attributes.description}
                        </td>
                        <td className="px-4 py-2">
                          {book.attributes.book_type}
                        </td>
                        <td className="px-4 py-2">
                          {book.attributes.copies_available}
                        </td>
                        <td className="px-2 py-1 space-x-2 flex justify-end">
                          <ButtonPrimary
                            varient="secondary"
                            onClick={() => {
                              setSelectedBookId(book.id);
                              setShowModal(true);
                            }}>
                            Borrow
                          </ButtonPrimary>
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
      )}

      {showModal && (
        <Modal
          bookId={Number(selectedBookId)}
          bearerToken={token}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

interface Member {
  id: string;
  attributes: {
    first_name: string;
    last_name: string;
  };
}

interface ModalProps {
  bookId: number;
  bearerToken: string | undefined;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ bookId, bearerToken, onClose }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [borrowDate, setBorrowDate] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return today;
  });
  const [dueDate, setDueDate] = useState(() => {
    const due = new Date();
    due.setDate(due.getDate() + 10);
    return due.toISOString().slice(0, 10);
  });

  useEffect(() => {
    fetch("http://localhost:3001/members", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) {
          setMembers(data.data);
          if (data.data.length > 0) {
            setSelectedUserId(data.data[0].id);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch members:", err);
      });
  }, []);

  const handleConfirm = () => {
    if (!selectedUserId) {
      alert("Please select a user.");
      return;
    }

    const today = new Date();
    const borrowDate = today.toISOString().split("T")[0];

    const due = new Date();
    due.setDate(today.getDate() + 14);
    const dueDate = due.toISOString().split("T")[0];

    const body = {
      borrowing: {
        borrow_date: borrowDate,
        due_date: dueDate,
        return_date: null,
        user_id: Number(selectedUserId),
        book_id: bookId,
      },
    };

    fetch("http://localhost:3001/borrowings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create borrowing");
        return res.json();
      })
      .then((data) => {
        alert("Borrowing created successfully!");
        onClose();
      })
      .catch((err) => {
        alert("Error creating borrowing: " + err.message);
      });
  };

  return (
    <div className="fixed inset-0 bg-gray-950/50 flex justify-center items-center z-50">
      <div className="bg-white p-4 rounded-2xl">
        <h2 className="text-xl font-semibold mb-8">Borrow Book</h2>
        <label className="block mb-2 font-medium" htmlFor="memberSelect">
          Select Member
        </label>
        <select
          id="memberSelect"
          className="w-full border border-gray-300 rounded p-2 mb-6"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.attributes.first_name} {member.attributes.last_name}
            </option>
          ))}
        </select>

        <div className="flex justify-end space-x-3">
          <ButtonPrimary varient="secondary" onClick={onClose}>
            Cancel
          </ButtonPrimary>
          <ButtonPrimary onClick={handleConfirm}>Confirm</ButtonPrimary>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
