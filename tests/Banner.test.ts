import { Banner } from "../src/ui/Banner";
import { EventEmitter } from "../src/core/EventEmitter";
import { ConsentConfig, ConsentCategories } from "../src/types";

const makeConfig = (): ConsentConfig => ({
  autoShow: true,
  revision: 1,
  categories: {
    necessary: {
      enabled: true,
      readOnly: true,
      label: "Essential",
      description: "",
    },
    analytics: {
      enabled: true,
      readOnly: false,
      label: "Analytics",
      description: "",
    },
    marketing: {
      enabled: true,
      readOnly: false,
      label: "Marketing",
      description: "",
    },
  },
  translations: {
    title: "We use cookies",
    description: "We use cookies to improve your experience.",
    acceptAll: "Accept all",
    rejectAll: "Reject all",
    customize: "Manage preferences",
  },
});

describe("Banner", () => {
  let emitter: EventEmitter;
  let banner: Banner;

  beforeEach(() => {
    document.body.innerHTML = "";
    emitter = new EventEmitter();
    banner = new Banner(makeConfig(), emitter);
  });

  afterEach(() => {
    banner.destroy();
  });

  test("renders accept, reject and customize actions", () => {
    banner.show();
    const root = document.querySelector(".cc-banner");
    expect(root).not.toBeNull();
    expect(root!.querySelector('[data-action="accept"]')).not.toBeNull();
    expect(root!.querySelector('[data-action="reject"]')).not.toBeNull();
    expect(root!.querySelector('[data-action="customize"]')).not.toBeNull();
  });

  test("renders reject button after accept with its own style", () => {
    banner.show();
    const actions = document.querySelector(".cc-banner__actions");
    const buttons = Array.from(actions!.querySelectorAll("button"));
    expect(buttons).toHaveLength(2);
    expect(buttons[0].classList.contains("cc-btn--accept")).toBe(true);
    expect(buttons[1].classList.contains("cc-btn--reject")).toBe(true);
  });

  test("clicking accept emits consent:accept with all categories granted", () => {
    banner.show();
    const handler = jest.fn();
    emitter.on("consent:accept", handler);
    (document.querySelector('[data-action="accept"]') as HTMLElement).click();
    expect(handler).toHaveBeenCalledTimes(1);
    const categories = handler.mock.calls[0][0] as ConsentCategories;
    expect(categories.necessary).toBe(true);
    expect(categories.analytics).toBe(true);
    expect(categories.marketing).toBe(true);
  });

  test("clicking reject emits consent:reject with only necessary granted", () => {
    banner.show();
    const handler = jest.fn();
    emitter.on("consent:reject", handler);
    (document.querySelector('[data-action="reject"]') as HTMLElement).click();
    expect(handler).toHaveBeenCalledTimes(1);
    const categories = handler.mock.calls[0][0] as ConsentCategories;
    expect(categories.necessary).toBe(true);
    expect(categories.analytics).toBe(false);
    expect(categories.marketing).toBe(false);
  });

  test("uses rejectAll translation for the reject button label", () => {
    banner.show();
    const btn = document.querySelector('[data-action="reject"]');
    expect(btn!.textContent!.trim()).toBe("Reject all");
  });
});
