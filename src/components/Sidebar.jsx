import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="w-[250px] h-screen bg-gray-900 text-white p-5">
      <h1 className="text-2xl font-bold mb-10">Admin Panel</h1>

      <div className="flex flex-col gap-4">
        <Link to="/admin/dashboard" className="hover:text-yellow-400">
          Dashboard
        </Link>

        <Link to="/admin/add-product" className="hover:text-yellow-400">
          Add Product
        </Link>
      </div>
    </div>
  );
}

export default Sidebar;
