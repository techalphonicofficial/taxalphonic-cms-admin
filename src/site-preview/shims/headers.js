// next/headers for the preview: there is no incoming request.
export const headers = async () => new Headers();
export const cookies = async () => ({ get: () => undefined, getAll: () => [], has: () => false });
