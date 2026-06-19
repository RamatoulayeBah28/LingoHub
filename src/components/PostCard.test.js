import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PostCard from "./PostCard";

jest.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ currentUser: null }),
}));

const fakePost = {
  id: "1",
  title: "Learning Spanish tips",
  content: "Some content here",
  authorName: "TestUser",
  createdAt: "2026-01-15T10:30:00.000Z",
  upvotes: 5,
  tags: ["spanish", "grammar"],
};

function renderPostCard() {
  render(
    <BrowserRouter>
      <PostCard post={fakePost} />
    </BrowserRouter>,
  );
}

describe("post data", () => {
  test("renders the post title", () => {
    renderPostCard();
    expect(screen.getByText(fakePost.title)).toBeInTheDocument();
  });

  test("renders the post content", () => {
    renderPostCard();
    expect(screen.getByText(fakePost.content)).toBeInTheDocument();
  });

  test("renders the author name", () => {
    renderPostCard();
    expect(screen.getByText(`By: ${fakePost.authorName}`)).toBeInTheDocument();
  });

  test("renders the created at date", () => {
    renderPostCard();
    const expectedDate = new Date(fakePost.createdAt).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  test("renders the upvote count", () => {
    renderPostCard();
    expect(screen.getByText(fakePost.upvotes.toString())).toBeInTheDocument();
  });

  test("renders the tags", () => {
    renderPostCard();
    fakePost.tags.forEach((tag) => {
      expect(screen.getByText(`#${tag}`)).toBeInTheDocument();
    });
  });
});
