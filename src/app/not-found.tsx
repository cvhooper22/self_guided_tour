import Link from "next/link";

export default function NotFound() {
  return <main className="flex-1 p-10 text-center"><h1 className="mb-3 text-2xl font-bold">Not found</h1><Link className="underline" href="/tours">Browse tours</Link></main>;
}
