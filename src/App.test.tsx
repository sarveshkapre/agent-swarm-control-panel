import { render, screen } from "@testing-library/react";
import App from "./App";

it("renders the control panel header", () => {
  render(<App />);
  expect(screen.getByText(/Control Panel/i)).toBeInTheDocument();
});
