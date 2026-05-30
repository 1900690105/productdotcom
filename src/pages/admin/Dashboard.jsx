import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabase";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filters = ["All", "In Stock", "Low Stock"];

  useEffect(() => {
    getProducts();
  }, []);

  async function getProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setProducts(data);
    setLoading(false);
  }

  async function deleteProduct(id) {
    const confirmDelete = window.confirm("Delete this product?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    getProducts();
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "In Stock" && p.stock !== "low") ||
      (activeFilter === "Low Stock" && p.stock === "low");

    return matchesSearch && matchesFilter;
  });

  const totalValue = products.reduce((sum, p) => sum + (p.price || 0), 0);
  const avgPrice = products.length
    ? Math.round(totalValue / products.length)
    : 0;
  const lowStockCount = products.filter((p) => p.stock === "low").length;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* ── Sidebar ── */}
      <Sidebar />

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Admin Dashboard" />

        <main className="flex-1 p-8">
          {/* Page header */}
          <div className="flex items-end justify-between mb-7">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                All Products
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {products.length} items · last updated today
              </p>
            </div>
            <Link
              to="/admin/add-product"
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add product
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
            <StatCard
              label="Total products"
              value={products.length}
              sub="items listed"
            />
            <StatCard
              label="Total value"
              value={`₹${totalValue.toLocaleString("en-IN")}`}
              sub="in inventory"
            />
            <StatCard
              label="Average price"
              value={`₹${avgPrice.toLocaleString("en-IN")}`}
              sub="across all items"
            />
            <StatCard
              label="Low stock"
              value={lowStockCount}
              sub="need restock"
              warnColor={lowStockCount > 0}
            />
          </div>

          {/* Filters + Search */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
                  activeFilter === f
                    ? "bg-orange-50 text-orange-700 border-orange-300"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {f}
              </button>
            ))}
            <div className="ml-auto relative">
              <svg
                className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 w-48"
              />
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse"
                >
                  <div className="h-52 bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <svg
                className="w-12 h-12 mb-3 opacity-40"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={deleteProduct}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function StatCard({ label, value, sub, warnColor = false }) {
  return (
    <div className="bg-gray-100 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p
        className={`text-xs mt-0.5 ${
          warnColor ? "text-amber-500" : "text-gray-400"
        }`}
      >
        {sub}
      </p>
    </div>
  );
}

function ProductCard({ product, onDelete }) {
  const isLowStock = product.stock === "low";

  return (
    <div className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-gray-200"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}

        {/* Category badge */}
        {product.category && (
          <span className="absolute top-2.5 left-2.5 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
            {product.category}
          </span>
        )}

        {/* Action buttons — visible on hover */}
        <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            to={`/admin/edit-product/${product.id}`}
            className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-orange-600 hover:bg-orange-50 transition-colors shadow-sm"
            title="Edit"
          >
            <svg
              className="w-3.5 h-3.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
            </svg>
          </Link>
          <button
            onClick={() => onDelete(product.id)}
            className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shadow-sm"
            title="Delete"
          >
            <svg
              className="w-3.5 h-3.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="font-medium text-sm text-gray-900 truncate mb-1">
          {product.name}
        </p>
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">
          {product.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-sm font-semibold text-gray-900">
            ₹{Number(product.price).toLocaleString("en-IN")}
            <span className="text-xs font-normal text-gray-400 ml-0.5">
              INR
            </span>
          </span>
          <span
            className={`flex items-center gap-1.5 text-[11px] ${
              isLowStock ? "text-amber-500" : "text-gray-400"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLowStock ? "bg-amber-400" : "bg-green-400"
              }`}
            />
            {isLowStock ? "Low stock" : "In stock"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
