export async function getEmployerContactEntitlement({
  candidateId,
  requireApplication = true,
}) {
  const response = await fetch(
    `/api/contact/entitlement?candidateId=${candidateId}&requireApplication=${requireApplication}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.error || "Failed to evaluate contact entitlement.",
    );
  }

  return payload;
}
