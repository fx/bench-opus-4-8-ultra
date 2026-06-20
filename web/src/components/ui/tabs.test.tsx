import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs.tsx";

function Example() {
  return (
    <Tabs defaultValue="a">
      <TabsList className="c-list">
        <TabsTrigger value="a" className="c-trigger">
          Tab A
        </TabsTrigger>
        <TabsTrigger value="b">Tab B</TabsTrigger>
      </TabsList>
      <TabsContent value="a" className="c-content">
        Panel A
      </TabsContent>
      <TabsContent value="b">Panel B</TabsContent>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("shows the default panel and switches on trigger click", async () => {
    const user = userEvent.setup();
    render(<Example />);
    expect(screen.getByText("Panel A")).toBeInTheDocument();
    expect(screen.queryByText("Panel B")).toBeNull();
    await user.click(screen.getByRole("tab", { name: "Tab B" }));
    expect(screen.getByText("Panel B")).toBeInTheDocument();
  });

  it("forwards classNames to list, trigger, content", () => {
    render(<Example />);
    expect(screen.getByRole("tablist")).toHaveClass("c-list");
    expect(screen.getByRole("tab", { name: "Tab A" })).toHaveClass("c-trigger");
    expect(screen.getByText("Panel A")).toHaveClass("c-content");
  });
});
