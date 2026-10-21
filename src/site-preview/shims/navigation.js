// next/navigation for the preview: routing is a no-op inside the admin.
const router = { push() {}, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {} };

export const useRouter = () => router;
export const usePathname = () => '/';
export const useSearchParams = () => new URLSearchParams();
export const useParams = () => ({});
export const redirect = () => {};
export const notFound = () => {};
