/* Small DOM helpers shared by profile.html and leaderboard.html (no innerHTML with user data). */

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

export function rankBadge(rank, big = false, locked = false) {
  const badge = el("span", `rankBadge${big ? " big" : ""}${locked ? " locked" : ""}`);
  badge.style.setProperty("--c", rank.color || "#a0ada0");
  const icon = el("i", `fa-solid ${rank.icon || "fa-tag"}`);
  icon.setAttribute("aria-hidden", "true");
  badge.append(icon, document.createTextNode(rank.name));
  badge.title = rank.desc || rank.name;
  return badge;
}

/* Fills `container` with the user's picture, or their first letter if there isn't one. */
export function fillAvatar(container, photoURL, name) {
  container.replaceChildren();
  const letter = String(name || "?").trim().charAt(0).toUpperCase() || "?";
  const safe = typeof photoURL === "string" && /^https:\/\//i.test(photoURL);
  if (!safe) { container.textContent = letter; return; }
  const image = document.createElement("img");
  image.src = photoURL;
  image.alt = "";
  image.referrerPolicy = "no-referrer";
  image.onerror = () => { container.replaceChildren(); container.textContent = letter; };
  container.appendChild(image);
}

export function gameInfo(name) {
  const catalog = window.MELD_GAME_CATALOG || [];
  return catalog.find(game => game.name === name) || null;
}
