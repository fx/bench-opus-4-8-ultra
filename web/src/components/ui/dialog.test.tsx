import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./dialog.tsx";

function Example() {
  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogHeader>
        <p>Body</p>
        <DialogFooter>
          <DialogClose>Done</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("opens on trigger click and shows title/description/content", async () => {
    const user = userEvent.setup();
    render(<Example />);
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByText("Open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("closes via the built-in close (X) button", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByText("Open"));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes via a custom DialogClose", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByText("Open"));
    await user.click(screen.getByText("Done"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("forwards classNames to header, footer, title, description, content", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent className="c-content">
          <DialogHeader className="c-header">
            <DialogTitle className="c-title">T</DialogTitle>
            <DialogDescription className="c-desc">D</DialogDescription>
          </DialogHeader>
          <DialogFooter className="c-footer">f</DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByText("Open"));
    expect(screen.getByRole("dialog")).toHaveClass("c-content");
    expect(screen.getByText("T")).toHaveClass("c-title");
    expect(screen.getByText("D")).toHaveClass("c-desc");
    expect(screen.getByText("T").parentElement).toHaveClass("c-header");
    expect(screen.getByText("f")).toHaveClass("c-footer");
  });
});
