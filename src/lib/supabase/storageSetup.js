"use client";

export async function setupStorageBucket() {
  try {
    const response = await fetch("/api/storage/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      console.error(
        "Storage setup failed:",
        result?.error || `HTTP ${response.status}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Storage setup request failed:", error);
    return false;
  }
}
