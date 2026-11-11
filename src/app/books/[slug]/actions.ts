"use server";

import { refresh, updateTag } from "next/cache";
import { activeManualMethods } from "@/config/payments";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/dal";
import type { FormState } from "@/lib/auth/validation";

const BD_PHONE = /^(?:\+?88)?(01[3-9]\d{8})$/;
const TRX_ID = /^[A-Z0-9]{8,20}$/;

/**
 * Places a book order. Everything that matters (price, stock, free-book
 * eligibility, the linked payment) is decided in the database by
 * place_book_order(); this action only validates input and maps errors.
 */
export async function placeBookOrder(_p: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in first." };

  const get = (k: string) => String(fd.get(k) ?? "").trim();
  const slug = get("slug");
  const quantity = Number(get("quantity") || 1);
  const name = get("recipient_name");
  const phone = get("phone").replace(/[\s-]/g, "");
  const address = get("address");
  const note = get("note");
  const method = get("method");
  const sender = get("sender_number").replace(/[\s-]/g, "");
  const trx = get("transaction_id").replace(/\s/g, "").toUpperCase();
  const screenshot = get("screenshot_path");
  const values = { quantity: String(quantity), recipient_name: name, phone, address, note, method, sender_number: sender, transaction_id: trx };

  const supabase = await createClient();
  const { data: book } = await supabase
    .from("books")
    .select("id, price")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!book) return { error: "This book is not available.", values };
  const paid = Number(book.price) > 0;

  const fieldErrors: Record<string, string[]> = {};
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) fieldErrors.quantity = ["Choose 1 to 10 copies."];
  if (name.length < 2 || name.length > 100) fieldErrors.recipient_name = ["Enter the receiver's name."];
  const phoneMatch = BD_PHONE.exec(phone);
  if (!phoneMatch) fieldErrors.phone = ["Enter a valid phone number (01XXXXXXXXX)."];
  if (address.length < 10 || address.length > 500) fieldErrors.address = ["Enter the full delivery address (house, road, area, district)."];
  if (note.length > 500) fieldErrors.note = ["Keep the note under 500 characters."];
  if (paid) {
    if (!activeManualMethods.some((m) => m.id === method)) fieldErrors.method = ["Choose a payment method."];
    if (!BD_PHONE.test(sender)) fieldErrors.sender_number = ["Enter the number you sent the money from (01XXXXXXXXX)."];
    if (!TRX_ID.test(trx)) fieldErrors.transaction_id = ["Enter the Transaction ID from your SMS (letters and numbers)."];
    if (!screenshot.startsWith(`${user.id}/`)) fieldErrors.screenshot = ["Upload a screenshot of the payment."];
  }
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  if (paid) {
    // The screenshot must really exist (Storage RLS: only the owner/admin can read it).
    const { error: fileError } = await supabase.storage.from("payment-proofs").createSignedUrl(screenshot, 60);
    if (fileError) return { fieldErrors: { screenshot: ["Screenshot upload not found. Please upload it again."] }, values };
  }

  const { data: orderNo, error } = await supabase.rpc("place_book_order", {
    p_book_id: book.id,
    p_quantity: quantity,
    p_recipient_name: name,
    p_phone: phoneMatch![1],
    p_address: address,
    p_note: note || null,
    p_method: paid ? method : null,
    p_sender_number: paid ? sender : null,
    p_transaction_id: paid ? trx : null,
    p_screenshot_path: paid ? screenshot : null,
  });

  if (error) {
    if (error.code === "23505") {
      return error.message.includes("transaction_id")
        ? { fieldErrors: { transaction_id: ["This Transaction ID has already been submitted."] }, values }
        : { error: "You already have an order for this book waiting for confirmation.", values };
    }
    if (error.hint === "out_of_stock") return { error: "Sorry, not enough copies are in stock right now.", values };
    if (error.hint === "not_enrolled") return { error: "This book is free for enrolled students. Enroll in a course first.", values };
    console.error("[books] place order:", error.code, error.message);
    return { error: "Could not place your order. Please try again.", values };
  }

  updateTag("books"); // stock changed
  refresh();
  return {
    success: paid
      ? `Order ${orderNo} placed! We will verify your payment and call you before delivery.`
      : `Order ${orderNo} placed! We will call you before delivery.`,
  };
}
