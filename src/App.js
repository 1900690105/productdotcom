import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

function App() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [newIds, setNewIds] = useState(new Set());
  const [likedIds, setLikedIds] = useState(new Set()); // tracked in React state
  const [likingIds, setLikingIds] = useState(new Set());

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: "", comment: "" });
  const [updating, setUpdating] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [formData, setFormData] = useState({ name: "", comment: "" });

  const commentsRef = useRef([]);
  commentsRef.current = comments;

  // ── Initial fetch ──────────────────────────────────────────────
  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .order("id", { ascending: false });

    if (error) console.log(error);
    else setComments(data);
    setLoading(false);
  };

  useEffect(() => {
    const stored = localStorage.getItem("likedComments");

    if (stored) {
      setLikedIds(new Set(JSON.parse(stored)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("likedComments", JSON.stringify([...likedIds]));
  }, [likedIds]);

  // ── Realtime subscription ──────────────────────────────────────
  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel("comments-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;

          if (eventType === "INSERT") {
            setComments((prev) => [newRow, ...prev]);
            setNewIds((prev) => new Set(prev).add(newRow.id));
            setTimeout(() => {
              setNewIds((prev) => {
                const next = new Set(prev);
                next.delete(newRow.id);
                return next;
              });
            }, 2500);
          }

          if (eventType === "UPDATE") {
            setComments((prev) =>
              prev.map((c) =>
                c.id === newRow.id
                  ? {
                      ...c,
                      likes: newRow.likes,
                      name: newRow.name,
                      comment: newRow.comment,
                    }
                  : c,
              ),
            );
            // Otherwise it's from another user (edit or like from another tab) — sync everything
            setComments((prev) =>
              prev.map((c) =>
                c.id === newRow.id
                  ? {
                      ...c,
                      name: newRow.name,
                      comment: newRow.comment,
                      likes: newRow.likes,
                    }
                  : c,
              ),
            );
          }

          if (eventType === "DELETE") {
            setComments((prev) => prev.filter((c) => c.id !== oldRow.id));
          }
        },
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.comment.trim()) return;

    setSubmitting(true);
    const { error } = await supabase
      .from("comments")
      .insert([{ name: formData.name, comment: formData.comment, likes: 0 }]);

    if (error) console.log(error);
    else setFormData({ name: "", comment: "" });
    setSubmitting(false);
  };

  // --- EDIT ---
  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditData({ name: comment.name, comment: comment.comment });
    setConfirmDeleteId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ name: "", comment: "" });
  };

  const handleUpdate = async (id) => {
    if (!editData.name.trim() || !editData.comment.trim()) return;
    setUpdating(true);
    const { error } = await supabase
      .from("comments")
      .update({ name: editData.name, comment: editData.comment })
      .eq("id", id);

    if (error) console.log(error);
    else cancelEdit();
    setUpdating(false);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) console.log(error);
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  // --- LIKE ---
  const handleLike = async (comment) => {
    if (likingIds.has(comment.id)) return;

    const alreadyLiked = likedIds.has(comment.id);

    // Optimistic UI
    setLikedIds((prev) => {
      const next = new Set(prev);

      if (alreadyLiked) {
        next.delete(comment.id);
      } else {
        next.add(comment.id);
      }

      return next;
    });

    setComments((prev) =>
      prev.map((c) =>
        c.id === comment.id
          ? {
              ...c,
              likes: Math.max(0, (c.likes ?? 0) + (alreadyLiked ? -1 : 1)),
            }
          : c,
      ),
    );

    setLikingIds((prev) => new Set(prev).add(comment.id));

    const { error } = await supabase.rpc(
      alreadyLiked ? "decrement_like" : "increment_like",
      { comment_id: comment.id },
    );

    if (error) {
      console.log("Like error:", error);

      // rollback
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id
            ? {
                ...c,
                likes: Math.max(0, (c.likes ?? 0) + (alreadyLiked ? 1 : -1)),
              }
            : c,
        ),
      );
    }

    setLikingIds((prev) => {
      const next = new Set(prev);
      next.delete(comment.id);
      return next;
    });
  };

  const getInitial = (name) => name?.charAt(0)?.toUpperCase() || "?";

  const avatarColors = [
    "bg-rose-100 text-rose-600",
    "bg-sky-100 text-sky-600",
    "bg-amber-100 text-amber-600",
    "bg-emerald-100 text-emerald-600",
    "bg-violet-100 text-violet-600",
    "bg-orange-100 text-orange-600",
  ];

  const getAvatarColor = (name) => {
    const index = (name?.charCodeAt(0) || 0) % avatarColors.length;
    return avatarColors[index];
  };

  const Spinner = ({ className = "w-4 h-4" }) => (
    <svg
      className={`animate-spin ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );

  const HeartIcon = ({ filled, spinning, className = "w-4 h-4" }) => (
    <svg
      className={`${className} transition-transform duration-150 ${spinning ? "scale-125" : "scale-100"}`}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-stone-50 font-serif">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
            <span className="text-sm tracking-widest uppercase text-stone-400 font-sans font-medium">
              Discussion
            </span>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-medium transition-all duration-500
            ${
              isConnected
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-stone-100 text-stone-400 border border-stone-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-stone-300"}`}
            ></span>
            {isConnected ? "Live" : "Connecting…"}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-stone-800 leading-tight tracking-tight">
            Join the Conversation
          </h1>
          <p className="mt-2 text-stone-400 font-sans text-sm">
            Comments update live — no refresh needed
          </p>
        </div>

        {/* New Comment Form */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 mb-10">
          <h2 className="text-xs font-sans font-semibold tracking-widest uppercase text-stone-400 mb-5">
            New Comment
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-sans font-medium text-stone-500 mb-1.5 tracking-wide uppercase">
                Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50
                  text-stone-800 font-sans text-sm placeholder-stone-300
                  focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent
                  transition-all duration-200 hover:border-stone-300"
              />
            </div>
            <div>
              <label className="block text-xs font-sans font-medium text-stone-500 mb-1.5 tracking-wide uppercase">
                Comment
              </label>
              <textarea
                name="comment"
                placeholder="What's on your mind?"
                value={formData.comment}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50
                  text-stone-800 font-sans text-sm placeholder-stone-300 resize-none
                  focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent
                  transition-all duration-200 hover:border-stone-300"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={
                  submitting ||
                  !formData.name.trim() ||
                  !formData.comment.trim()
                }
                className="inline-flex items-center gap-2 bg-stone-800 hover:bg-stone-700
                  disabled:bg-stone-300 disabled:cursor-not-allowed
                  text-white font-sans text-sm font-medium px-6 py-3 rounded-xl
                  transition-all duration-200 active:scale-95"
              >
                {submitting ? (
                  <>
                    <Spinner /> Posting…
                  </>
                ) : (
                  <>
                    Post Comment
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Comments List */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xs font-sans font-semibold tracking-widest uppercase text-stone-400">
              {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
            </h2>
            <div className="flex-1 h-px bg-stone-200"></div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner className="w-6 h-6 text-stone-300" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-stone-300 font-sans text-sm">
                No comments yet. Be the first!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment, i) => {
                const isLiked = likedIds.has(comment.id);
                const isLiking = likingIds.has(comment.id);
                const likeCount = comment.likes ?? 0;

                return (
                  <div
                    key={comment.id}
                    className={`group bg-white rounded-2xl border transition-all duration-500
                      ${
                        editingId === comment.id
                          ? "border-amber-300 shadow-md shadow-amber-50"
                          : confirmDeleteId === comment.id
                            ? "border-rose-200 shadow-md shadow-rose-50"
                            : newIds.has(comment.id)
                              ? "border-emerald-300 shadow-md shadow-emerald-50 scale-[1.01]"
                              : "border-stone-200 hover:border-stone-300 hover:shadow-sm"
                      }`}
                  >
                    {editingId === comment.id ? (
                      /* ── EDIT MODE ── */
                      <div className="p-5 space-y-3">
                        <p className="text-xs font-sans font-semibold tracking-widest uppercase text-amber-500 mb-3">
                          Editing
                        </p>
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) =>
                            setEditData({ ...editData, name: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50
                            text-stone-800 font-sans text-sm focus:outline-none focus:ring-2
                            focus:ring-amber-300 focus:border-transparent transition-all duration-200"
                          placeholder="Name"
                        />
                        <textarea
                          value={editData.comment}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              comment: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50
                            text-stone-800 font-sans text-sm resize-none focus:outline-none focus:ring-2
                            focus:ring-amber-300 focus:border-transparent transition-all duration-200"
                          placeholder="Comment"
                        />
                        <div className="flex items-center gap-2 justify-end pt-1">
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-2 rounded-xl text-xs font-sans font-medium text-stone-500 hover:bg-stone-100 transition-all duration-150"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdate(comment.id)}
                            disabled={
                              updating ||
                              !editData.name.trim() ||
                              !editData.comment.trim()
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl
                              bg-amber-400 hover:bg-amber-500 disabled:bg-stone-200 disabled:cursor-not-allowed
                              text-white text-xs font-sans font-semibold transition-all duration-150 active:scale-95"
                          >
                            {updating ? (
                              <>
                                <Spinner /> Saving…
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </button>
                        </div>
                      </div>
                    ) : confirmDeleteId === comment.id ? (
                      /* ── DELETE CONFIRM ── */
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center
                            text-sm font-bold font-sans flex-shrink-0 opacity-40 ${getAvatarColor(comment.name)}`}
                          >
                            {getInitial(comment.name)}
                          </div>
                          <div className="flex-1">
                            <p className="font-sans font-semibold text-stone-700 text-sm mb-0.5">
                              {comment.name}
                            </p>
                            <p className="text-stone-400 text-sm line-through leading-relaxed font-sans">
                              {comment.comment}
                            </p>
                            <div className="flex items-center gap-2 mt-4">
                              <p className="text-xs font-sans text-rose-500 font-medium flex-1">
                                Delete this comment?
                              </p>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-3 py-1.5 rounded-lg text-xs font-sans font-medium text-stone-500 hover:bg-stone-100 transition-all duration-150"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDelete(comment.id)}
                                disabled={deletingId === comment.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                  bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300
                                  text-white text-xs font-sans font-semibold transition-all duration-150 active:scale-95"
                              >
                                {deletingId === comment.id ? (
                                  <>
                                    <Spinner /> Deleting…
                                  </>
                                ) : (
                                  "Yes, delete"
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ── DEFAULT VIEW ── */
                      <div className="p-5">
                        {newIds.has(comment.id) && (
                          <div className="flex items-center gap-1.5 mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-xs font-sans font-medium text-emerald-500 tracking-wide">
                              Just posted
                            </span>
                          </div>
                        )}
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center
                            text-sm font-bold font-sans flex-shrink-0 ${getAvatarColor(comment.name)}`}
                          >
                            {getInitial(comment.name)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-sans font-semibold text-stone-700 text-sm">
                                {comment.name}
                              </span>
                              {i === 0 && !newIds.has(comment.id) && (
                                <span className="bg-amber-100 text-amber-600 text-xs font-sans font-medium px-2 py-0.5 rounded-full">
                                  Latest
                                </span>
                              )}
                            </div>
                            <p className="text-stone-600 text-sm leading-relaxed font-sans">
                              {comment.comment}
                            </p>

                            {/* ── LIKE BUTTON ── */}
                            <div className="mt-3">
                              <button
                                onClick={() => handleLike(comment)}
                                disabled={isLiking}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-sans font-medium
                                  transition-all duration-150 select-none
                                  ${
                                    isLiked
                                      ? "text-rose-500 bg-rose-50 hover:bg-rose-100"
                                      : "text-stone-400 hover:text-rose-400 hover:bg-rose-50"
                                  }`}
                              >
                                <HeartIcon
                                  filled={isLiked}
                                  spinning={isLiking}
                                  className="w-3.5 h-3.5"
                                />
                                <span className="tabular-nums min-w-[1ch]">
                                  {likeCount}
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* Edit / Delete — hover */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
                            <button
                              onClick={() => startEdit(comment)}
                              title="Edit"
                              className="p-2 rounded-lg text-stone-400 hover:text-amber-500 hover:bg-amber-50 transition-all duration-150"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setConfirmDeleteId(comment.id);
                                setEditingId(null);
                              }}
                              title="Delete"
                              className="p-2 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-150"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
