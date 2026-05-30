import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

function AddProduct() {
  const navigate = useNavigate();

  const [name, setName] = useState("");

  const [price, setPrice] = useState("");

  const [description, setDescription] = useState("");

  const [image, setImage] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();

    let imageUrl = "";

    // Upload image
    if (image) {
      const fileName = `${Date.now()}-${image.name}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, image);

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("products").insert([
      {
        name,
        price,
        description,
        image: imageUrl,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Product Added");

    navigate("/admin/dashboard");
  }

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-gray-100 min-h-screen">
        <Navbar title="Add Product" />

        <div className="p-6">
          <h1 className="text-3xl font-bold mb-5">Add Product</h1>

          <form
            onSubmit={handleAdd}
            className="bg-white p-6 rounded shadow w-[500px]"
          >
            <input
              type="text"
              placeholder="Product Name"
              className="w-full border p-3 mb-4 rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <input
              type="number"
              placeholder="Price"
              className="w-full border p-3 mb-4 rounded"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />

            <textarea
              placeholder="Description"
              className="w-full border p-3 mb-4 rounded"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <input
              type="file"
              className="mb-4"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />

            <button className="bg-green-600 text-white px-5 py-3 rounded">
              Add Product
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;
