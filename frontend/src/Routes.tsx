import { lazy } from "react";
import { lazyLoaded } from "HOCs/lazyLoaded";
import { RouteProps } from "react-router-dom";
import Navigate from "components/Link/Navigate";

const HomeView = lazyLoaded(lazy(() => import("app/views/Home/Home")));
const Error404View = lazyLoaded(lazy(() => import("app/views/404/404")));

export const ROUTES: RouteProps[] = [
    { path: "/", element: <Navigate to="/" />, index: true },
    { path: "/:lang", Component: HomeView, index: true },
    { path: "/*", Component: Error404View },
];
