// lib/chapa/client.js
const CHAPA_API_URL = "https://api.chapa.co/v1";
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

export async function initializePayment({
  amount,
  currency = "ETB",
  email,
  first_name,
  last_name,
  tx_ref,
  return_url,
}) {
  const response = await fetch(`${CHAPA_API_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency,
      email,
      first_name,
      last_name,
      tx_ref,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/chappa/webhook`,
      return_url,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to initialize payment");
  }

  return response.json();
}

export async function verifyPayment(tx_ref) {
  const response = await fetch(
    `${CHAPA_API_URL}/transaction/verify/${tx_ref}`,
    {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to verify payment");
  }

  return response.json();
}
