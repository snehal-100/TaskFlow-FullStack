import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "https://taskflow-fullstack-1-657e.onrender.com/api/tasks";
const AUTH_URL = "https://taskflow-fullstack-1-657e.onrender.com/api/auth";

const emptyForm = {
  title: "",
  description: "",
  status: "PENDING",
  priority: "MEDIUM",
  dueDate: "",
};

const emptyAuthForm = {
  name: "",
  email: "",
  password: "",
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [token, setToken] = useState(
    localStorage.getItem("token") || ""
  );

  const [user, setUser] = useState({
    name: localStorage.getItem("name") || "",
    email: localStorage.getItem("email") || "",
  });

  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const fetchTasks = async () => {
    if (!token) return;

    try {
      const response = await axios.get(
        API_URL,
        getAuthConfig()
      );

      setTasks(response.data);
    } catch (error) {
      console.error("Error loading tasks:", error);

      if (error.response?.status === 401 ||
          error.response?.status === 403) {
        logout();
      }
    }
  };

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  const handleAuthChange = (event) => {
    setAuthForm({
      ...authForm,
      [event.target.name]: event.target.value,
    });

    setAuthError("");
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    setAuthLoading(true);
    setAuthError("");

    try {
      const endpoint =
        authMode === "login" ? "/login" : "/register";

      const requestBody =
        authMode === "login"
          ? {
              email: authForm.email,
              password: authForm.password,
            }
          : authForm;

      const response = await axios.post(
        `${AUTH_URL}${endpoint}`,
        requestBody
      );

      const data = response.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("name", data.name);
      localStorage.setItem("email", data.email);

      setUser({
        name: data.name,
        email: data.email,
      });

      setToken(data.token);
      setAuthForm(emptyAuthForm);
    } catch (error) {
      console.error("Authentication error:", error);

      setAuthError(
        error.response?.data?.message ||
          (authMode === "login"
            ? "Invalid email or password."
            : "Registration failed. The email may already be registered.")
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const switchAuthMode = () => {
    setAuthMode(
      authMode === "login" ? "register" : "login"
    );

    setAuthForm(emptyAuthForm);
    setAuthError("");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("email");

    setToken("");
    setUser({
      name: "",
      email: "",
    });

    setTasks([]);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const saveTask = async (event) => {
    event.preventDefault();

    try {
      if (editingId !== null) {
        await axios.put(
          `${API_URL}/${editingId}`,
          form,
          getAuthConfig()
        );
      } else {
        await axios.post(
          API_URL,
          form,
          getAuthConfig()
        );
      }

      setEditingId(null);
      setForm(emptyForm);
      await fetchTasks();
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  const startEdit = (task) => {
    setEditingId(task.id);

    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(
        `${API_URL}/${id}`,
        getAuthConfig()
      );

      if (editingId === id) {
        cancelEdit();
      }

      await fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const completeTask = async (task) => {
    try {
      await axios.put(
        `${API_URL}/${task.id}`,
        {
          title: task.title,
          description: task.description,
          status: "COMPLETED",
          priority: task.priority,
          dueDate: task.dueDate,
        },
        getAuthConfig()
      );

      await fetchTasks();
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
  };

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status !== "COMPLETED"
  ).length;

  const filteredTasks = tasks.filter((task) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      task.title.toLowerCase().includes(searchText) ||
      (task.description || "")
        .toLowerCase()
        .includes(searchText);

    const matchesStatus =
      statusFilter === "ALL" ||
      task.status === statusFilter;

    const matchesPriority =
      priorityFilter === "ALL" ||
      task.priority === priorityFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority
    );
  });

  const filtersActive =
    search !== "" ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL";

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-brand">
          <h1>TaskFlow</h1>
          <p>
            Organize your tasks, track your progress,
            and get things done.
          </p>
        </div>

        <div className="auth-card">
          <h2>
            {authMode === "login"
              ? "Welcome Back"
              : "Create Account"}
          </h2>

          <p className="auth-subtitle">
            {authMode === "login"
              ? "Login to manage your tasks."
              : "Register to start organizing your work."}
          </p>

          {authError && (
            <div className="auth-error">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit}>
            {authMode === "register" && (
              <>
                <label htmlFor="authName">
                  Name
                </label>

                <input
                  id="authName"
                  name="name"
                  value={authForm.name}
                  onChange={handleAuthChange}
                  placeholder="Enter your name"
                  required
                />
              </>
            )}

            <label htmlFor="authEmail">
              Email
            </label>

            <input
              id="authEmail"
              type="email"
              name="email"
              value={authForm.email}
              onChange={handleAuthChange}
              placeholder="Enter your email"
              required
            />

            <label htmlFor="authPassword">
              Password
            </label>

            <input
              id="authPassword"
              type="password"
              name="password"
              value={authForm.password}
              onChange={handleAuthChange}
              placeholder="Enter your password"
              minLength="6"
              required
            />

            <button
              type="submit"
              className="auth-submit"
              disabled={authLoading}
            >
              {authLoading
                ? "Please wait..."
                : authMode === "login"
                  ? "Login"
                  : "Register"}
            </button>
          </form>

          <p className="auth-switch">
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              type="button"
              onClick={switchAuthMode}
            >
              {authMode === "login"
                ? "Register"
                : "Login"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <div>
            <h1>TaskFlow</h1>
            <p>
              Organize your work and get things done.
            </p>
          </div>

          <div className="user-menu">
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>

            <button onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="stats">
          <div className="stat-card">
            <span>Total Tasks</span>
            <strong>{tasks.length}</strong>
          </div>

          <div className="stat-card">
            <span>Pending</span>
            <strong>{pendingTasks}</strong>
          </div>

          <div className="stat-card">
            <span>Completed</span>
            <strong>{completedTasks}</strong>
          </div>
        </section>

        <section className="content">
          <div className="form-card">
            <h2>
              {editingId !== null
                ? "Edit Task"
                : "Add New Task"}
            </h2>

            {editingId !== null && (
              <p className="editing-message">
                You are editing an existing task.
              </p>
            )}

            <form onSubmit={saveTask}>
              <label>Title</label>

              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter task title"
                required
              />

              <label>Description</label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter task description"
              />

              <label>Status</label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="PENDING">
                  Pending
                </option>

                <option value="IN_PROGRESS">
                  In Progress
                </option>

                <option value="COMPLETED">
                  Completed
                </option>
              </select>

              <label>Priority</label>

              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">
                  Medium
                </option>
                <option value="HIGH">High</option>
              </select>

              <label>Due Date</label>

              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
              />

              <button
                type="submit"
                className="submit-button"
              >
                {editingId !== null
                  ? "Save Changes"
                  : "Add Task"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  className="cancel"
                  onClick={cancelEdit}
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          <div className="task-section">
            <div className="section-heading">
              <div>
                <h2>My Tasks</h2>

                <p>
                  Showing {filteredTasks.length} of{" "}
                  {tasks.length} tasks
                </p>
              </div>
            </div>

            <div className="filter-card">
              <div className="search-box">
                <label>Search</label>

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search tasks..."
                />
              </div>

              <div className="filter-select">
                <label>Status</label>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="ALL">
                    All Statuses
                  </option>
                  <option value="PENDING">
                    Pending
                  </option>
                  <option value="IN_PROGRESS">
                    In Progress
                  </option>
                  <option value="COMPLETED">
                    Completed
                  </option>
                </select>
              </div>

              <div className="filter-select">
                <label>Priority</label>

                <select
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="ALL">
                    All Priorities
                  </option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">
                    Medium
                  </option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              {filtersActive && (
                <button
                  className="clear-filters"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <h3>
                  {tasks.length === 0
                    ? "No tasks yet"
                    : "No matching tasks"}
                </h3>

                <p>
                  {tasks.length === 0
                    ? "Create your first task using the form."
                    : "Try changing your search or filters."}
                </p>
              </div>
            ) : (
              <div className="task-list">
                {filteredTasks.map((task) => (
                  <article
                    className={`task-card ${
                      task.status === "COMPLETED"
                        ? "completed-task"
                        : ""
                    }`}
                    key={task.id}
                  >
                    <div className="task-top">
                      <h3>{task.title}</h3>

                      <span
                        className={`priority ${task.priority.toLowerCase()}`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <p className="task-description">
                      {task.description ||
                        "No description provided."}
                    </p>

                    <div className="task-info">
                      <span className="status">
                        {task.status.replaceAll(
                          "_",
                          " "
                        )}
                      </span>

                      <span>
                        Due:{" "}
                        {task.dueDate ||
                          "No due date"}
                      </span>
                    </div>

                    <div className="actions">
                      <button
                        className="edit"
                        onClick={() =>
                          startEdit(task)
                        }
                      >
                        Edit
                      </button>

                      {task.status !==
                        "COMPLETED" && (
                        <button
                          className="complete"
                          onClick={() =>
                            completeTask(task)
                          }
                        >
                          Complete
                        </button>
                      )}

                      <button
                        className="delete"
                        onClick={() =>
                          deleteTask(task.id)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;