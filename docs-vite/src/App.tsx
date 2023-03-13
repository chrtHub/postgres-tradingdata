import { RedocStandalone } from "redoc";
import spec from "./spec.json";

export default function App() {
  return <RedocStandalone spec={spec} />;
}
