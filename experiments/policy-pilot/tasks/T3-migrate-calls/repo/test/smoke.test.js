import assert from "node:assert/strict";
import test from "node:test";
import { getUser } from "../src/users.js";

test("getUser requests the user path", async () => {
  const response = await getUser(7);
  assert.equal(response.request.url, "/users/7");
  assert.equal(response.request.method, "GET");
});
