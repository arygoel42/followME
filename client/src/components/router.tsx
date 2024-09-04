import { createBrowserRouter } from "react-router-dom";
// import App from "../App.tsx";
import Placeholder from "../placeholder.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Placeholder />,
  },
  {
    path: "/placeholder",
    element: <Placeholder />,
  },
]);

export default router;
