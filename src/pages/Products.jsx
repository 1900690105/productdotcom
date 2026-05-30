import { useEffect, useState } from "react";

import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getProducts();
  }, []);

  async function getProducts() {
    const { data } = await supabase.from("products").select("*");

    setProducts(data);
  }

  return (
    <div>
      <Navbar title="User Dashboard" />

      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Products</h1>

        <div className="grid grid-cols-3 gap-5">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow p-4">
              <img
                src={product.image}
                alt=""
                className="w-full h-[220px] object-cover rounded"
              />

              <h2 className="text-2xl font-bold mt-3">{product.name}</h2>

              <p className="text-green-600 text-xl mt-2">₹{product.price}</p>

              <p className="text-gray-600 mt-2">{product.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Products;
