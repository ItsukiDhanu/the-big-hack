import NotFoundView from "~/components/NotFoundView";

export const meta = () => [{ title: "404 | The Big Hack 2.0" }, { name: "robots", content: "noindex" }];

export default function NotFound() {
  return <NotFoundView />;
}
