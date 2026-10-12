import { oldFetch } from "./http.js";

export const getUser = (id) => oldFetch(`/users/${id}`);

export function updateUser(id, data) {
  return oldFetch(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
