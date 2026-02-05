// src/layouts/PublicLayout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="public-main">
        <Outlet />
      </main>
    </>
  );
}