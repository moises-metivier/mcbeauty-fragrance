// src/services/orderService.js
import { supabase } from "../lib/supabaseClient";

/**
 * Crea SOLO la orden (sin items).
 * Los items se insertan desde Checkout.jsx.
 */
export async function createOrder({
  customer_name,
  customer_phone = "",
  customer_email = "",
  payment_method_id = null,
  total = 0,
}) {
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      customer_name,
      customer_phone,
      customer_email,
      payment_method_id,
      total,              // ✅ CLAVE
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return order;
}