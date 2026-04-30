"use client";

import { useEffect, useState } from "react";
import { CONTACT } from "@/lib/contact";

interface Testimonial {
  id: number;
  platform: "tiktok" | "facebook" | "youtube";
  video_url: string;
  customer_name: string | null;
  customer_car: string | null;
  caption: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

const platformColors: Record<string, string> = {
  tiktok: "bg-black text-white",
  facebook: "bg-blue-600 text-white",
  youtube: "bg-red-600 text-white",
};

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const [newItem, setNewItem] = useState({
    video_url: "",
    customer_name: "",
    customer_car: "",
    caption: "",
    sort_order: "",
  });

  const fetchAll = () => {
    setLoading(true);
    const key = localStorage.getItem("admin-key");
    fetch("/api/testimonials/admin", { headers: { "x-admin-key": key || "" } })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const create = async () => {
    setError("");
    if (!newItem.video_url.trim()) return setError("Video URL is required");
    setCreating(true);
    const key = localStorage.getItem("admin-key");
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key || "" },
        body: JSON.stringify({
          video_url: newItem.video_url.trim(),
          customer_name: newItem.customer_name || null,
          customer_car: newItem.customer_car || null,
          caption: newItem.caption || null,
          sort_order: newItem.sort_order ? Number(newItem.sort_order) : 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to create");
        return;
      }
      setNewItem({ video_url: "", customer_name: "", customer_car: "", caption: "", sort_order: "" });
      setShowForm(false);
      fetchAll();
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (item: Testimonial) => {
    const key = localStorage.getItem("admin-key");
    await fetch(`/api/testimonials/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": key || "" },
      body: JSON.stringify({ active: !item.active }),
    });
    fetchAll();
  };

  const remove = async (item: Testimonial) => {
    if (!confirm("Delete this testimonial?")) return;
    const key = localStorage.getItem("admin-key");
    await fetch(`/api/testimonials/${item.id}`, {
      method: "DELETE",
      headers: { "x-admin-key": key || "" },
    });
    fetchAll();
  };

  const updateOrder = async (item: Testimonial, newOrder: number) => {
    const key = localStorage.getItem("admin-key");
    await fetch(`/api/testimonials/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": key || "" },
      body: JSON.stringify({ sort_order: newOrder }),
    });
    fetchAll();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Video Testimonials</h2>
          <p className="text-gray-500">Paste TikTok / Facebook / YouTube URLs to show on the landing page</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-5 py-2.5 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Video"}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <p className="font-semibold mb-1">How it works:</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>Post your video on <a href={CONTACT.tiktokUrl} target="_blank" rel="noopener noreferrer" className="underline">TikTok ({CONTACT.tiktokHandle})</a> or {" "}
            <a href={CONTACT.facebookUrl} target="_blank" rel="noopener noreferrer" className="underline">Facebook</a>.</li>
          <li>Copy the video URL (open the video, tap Share → Copy Link).</li>
          <li>Paste it here and add the customer&apos;s name + car.</li>
          <li>It shows up in the testimonial section on carcare.et instantly.</li>
        </ol>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add Video Testimonial</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Video URL *</label>
              <input
                type="url"
                value={newItem.video_url}
                onChange={(e) => setNewItem({ ...newItem, video_url: e.target.value })}
                placeholder="https://www.tiktok.com/@carcareethiopia/video/..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">TikTok, Facebook, or YouTube URL</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={newItem.customer_name}
                onChange={(e) => setNewItem({ ...newItem, customer_name: e.target.value })}
                placeholder="Abebe M."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Car</label>
              <input
                type="text"
                value={newItem.customer_car}
                onChange={(e) => setNewItem({ ...newItem, customer_car: e.target.value })}
                placeholder="Toyota Corolla 2018"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Caption / Snippet (optional)</label>
              <input
                type="text"
                value={newItem.caption}
                onChange={(e) => setNewItem({ ...newItem, caption: e.target.value })}
                placeholder="Short quote from the customer"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={newItem.sort_order}
                onChange={(e) => setNewItem({ ...newItem, sort_order: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          <div className="flex gap-3 mt-5">
            <button
              onClick={create}
              disabled={creating}
              className="px-6 py-2 bg-primary hover:bg-primary-light disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {creating ? "Adding..." : "Add Video"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-12">Loading...</p>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-gray-400">No video testimonials yet. Add one to start showing them on the site.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${platformColors[item.platform]}`}>
                      {item.platform}
                    </span>
                    {!item.active && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">Hidden</span>
                    )}
                    <span className="text-xs text-gray-400">order: {item.sort_order}</span>
                  </div>
                  {(item.customer_name || item.customer_car) && (
                    <p className="text-sm font-medium text-gray-900">
                      {item.customer_name}
                      {item.customer_car ? ` · ${item.customer_car}` : ""}
                    </p>
                  )}
                  {item.caption && <p className="text-sm text-gray-500 mt-1">&ldquo;{item.caption}&rdquo;</p>}
                  <a
                    href={item.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 break-all inline-block"
                  >
                    {item.video_url}
                  </a>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateOrder(item, item.sort_order - 1)}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => updateOrder(item, item.sort_order + 1)}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggle(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        item.active
                          ? "bg-amber-100 hover:bg-amber-200 text-amber-800"
                          : "bg-green-100 hover:bg-green-200 text-green-800"
                      }`}
                    >
                      {item.active ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={() => remove(item)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
