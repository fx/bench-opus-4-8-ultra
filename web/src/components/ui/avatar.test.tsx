import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar.tsx";

describe("Avatar", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the fallback when no image has loaded", () => {
    render(
      <Avatar className="c-root">
        <AvatarImage src="/nope.png" alt="user" className="c-img" />
        <AvatarFallback className="c-fallback">AB</AvatarFallback>
      </Avatar>,
    );
    // jsdom never fires the image load, so Radix shows the fallback.
    expect(screen.getByText("AB")).toBeInTheDocument();
    expect(screen.getByText("AB")).toHaveClass("c-fallback");
  });

  it("forwards the root className", () => {
    const { container } = render(
      <Avatar className="c-root">
        <AvatarFallback>X</AvatarFallback>
      </Avatar>,
    );
    expect(container.querySelector(".c-root")).not.toBeNull();
  });

  it("renders the image once it reports loaded", async () => {
    // Stub Image so Radix's load detection immediately fires onload, exercising
    // the AvatarImage render path (jsdom never loads real images).
    class FakeImage {
      complete = true;
      naturalWidth = 1;
      crossOrigin: string | null = null;
      src = "";
      addEventListener() {}
      removeEventListener() {}
    }
    vi.stubGlobal("Image", FakeImage);

    render(
      <Avatar>
        <AvatarImage src="/u.png" alt="user" className="c-img" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    await waitFor(() => {
      const img = screen.getByRole("img", { name: "user" });
      expect(img).toHaveClass("c-img");
    });
  });
});
