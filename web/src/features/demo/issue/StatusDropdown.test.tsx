import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusDropdown } from "./StatusDropdown.tsx";
import { STATUS_META, STATUS_OPTIONS } from "./status-meta.ts";

describe("StatusDropdown", () => {
  it("renders the current status as a coloured lozenge trigger", () => {
    render(<StatusDropdown status="in_progress" onChange={() => {}} />);
    const trigger = screen.getByTestId("status-dropdown-trigger");
    expect(trigger).toHaveTextContent("In Progress");
    expect(trigger).toHaveStyle({
      backgroundColor: STATUS_META.in_progress.color,
    });
    expect(trigger).toHaveAccessibleName(/Change status/);
  });

  it("opens the menu and lists every status option", async () => {
    const user = userEvent.setup();
    render(<StatusDropdown status="todo" onChange={() => {}} />);

    await user.click(screen.getByTestId("status-dropdown-trigger"));

    for (const option of STATUS_OPTIONS) {
      expect(screen.getByTestId(`status-option-${option}`)).toHaveTextContent(
        STATUS_META[option].label,
      );
    }
  });

  it("calls onChange with the chosen status", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatusDropdown status="todo" onChange={onChange} />);

    await user.click(screen.getByTestId("status-dropdown-trigger"));
    await user.click(screen.getByTestId("status-option-done"));

    expect(onChange).toHaveBeenCalledWith("done");
  });

  it("still fires onChange when re-selecting the already-current status", async () => {
    // The store no-ops a same-status transition, so the component itself does not
    // guard — verify the selected option remains clickable and reports back.
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatusDropdown status="done" onChange={onChange} />);

    await user.click(screen.getByTestId("status-dropdown-trigger"));
    await user.click(screen.getByTestId("status-option-done"));

    expect(onChange).toHaveBeenCalledWith("done");
  });
});
