import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("/lang", "routes/lang.ts"),
] satisfies RouteConfig;
