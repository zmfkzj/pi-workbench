export const client = {
  async oldFetch(kind, id) {
    return { kind, id, legacy: true };
  },
};
