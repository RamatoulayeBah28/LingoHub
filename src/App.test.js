import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

jest.mock("./supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (callback) => {
        callback("SIGNED_OUT", null);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getUser: () => Promise.resolve({ data: { user: null } }),
    },
  },
}));

test("renders the LingoHub navbar", async () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
  const brand = await screen.findByText(/lingohub/i);
  expect(brand).toBeInTheDocument();
});

test("App snapshot test", async () => {
  const { asFragment } = render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
  await screen.findByText(/lingohub/i);
  expect(asFragment()).toMatchSnapshot();
});
