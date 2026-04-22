export const DEFAULT_AVATAR_SRC = "/default-avatar.svg";

export function resolveAvatarSrc(value) {
  const trimmedValue = (value || "").trim();
  return trimmedValue || DEFAULT_AVATAR_SRC;
}
