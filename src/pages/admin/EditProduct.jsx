import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { supabase } from "../../supabase";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

function EditProduct() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [name, setName] = useState("");

  const [price, setPrice] = useState("");

  const [description, setDescription] = useState("");

  const [image, setImage] = useState("");

  const [newImage, setNewImage] = useState(null);

  useEffect(() => {
    async function getProduct() {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      setName(data.name);
      setPrice(data.price);
      setDescription(data.description);
      setImage(data.image);
    }

    getProduct();
  }, [id]);

  async function updateProduct(e) {
    e.preventDefault();

    let imageUrl = image;

    if (newImage) {
      const fileName = `${Date.now()}-${newImage.name}`;

      await supabase.storage.from("product-images").upload(fileName, newImage);

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const { error } = await supabase
      .from("products")
      .update({
        name,
        price,
        description,
        image: imageUrl,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Updated");

    navigate("/admin/dashboard");
  }

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 min-h-screen bg-gray-100">
        <Navbar title="Edit Product" />

        <div className="p-6">
          <form
            onSubmit={updateProduct}
            className="bg-white p-6 rounded shadow w-[500px]"
          >
            <img
              src={image}
              alt=""
              className="w-full h-[220px] object-cover rounded mb-4"
            />

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border p-3 rounded mb-4"
            />

            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border p-3 rounded mb-4"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border p-3 rounded mb-4"
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImage(e.target.files[0])}
              className="mb-4"
            />

            <button className="bg-blue-600 text-white px-5 py-3 rounded">
              Update Product
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProduct;
