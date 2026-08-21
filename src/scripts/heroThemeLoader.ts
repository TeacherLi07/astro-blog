type Theme = "light" | "dark";

type HeroImage = HTMLImageElement & {
  dataset: DOMStringMap & {
    heroImage?: Theme;
    heroSrc?: string;
  };
};

const getCurrentTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

class HeroThemeController {
  private readonly hero: HTMLElement;
  private readonly images: Map<Theme, HeroImage>;
  private readonly loaded = new Set<Theme>();
  private readonly failed = new Set<Theme>();
  private readonly pending = new Map<Theme, Promise<boolean>>();
  private readonly observer: MutationObserver;
  private preloadTimer: number | undefined;
  private idleCallback: number | undefined;
  private removeLoadListener = () => {};
  private pageLoaded = document.readyState === "complete";
  private preloadQueued = false;
  private destroyed = false;

  constructor(hero: HTMLElement) {
    this.hero = hero;
    this.images = new Map(
      [...hero.querySelectorAll<HeroImage>("[data-hero-image]")]
        .map((image) => [image.dataset.heroImage, image] as const)
        .filter((entry): entry is [Theme, HeroImage] => Boolean(entry[0])),
    );
    this.observer = new MutationObserver(() => this.syncTheme(getCurrentTheme(), true));
    this.observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    this.waitForPageLoad();
    this.syncTheme(getCurrentTheme(), true);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.observer.disconnect();
    this.removeLoadListener();
    if (this.preloadTimer !== undefined) window.clearTimeout(this.preloadTimer);
    if (this.idleCallback !== undefined && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(this.idleCallback);
    }
  }

  private loadImage(theme: Theme, priority: boolean): Promise<boolean> {
    const image = this.images.get(theme);
    if (!image) return Promise.resolve(false);
    if (this.loaded.has(theme)) return Promise.resolve(true);
    if (this.failed.has(theme)) return Promise.resolve(false);

    const existingRequest = this.pending.get(theme);
    if (existingRequest) {
      if (priority) image.fetchPriority = "high";
      return existingRequest;
    }

    if (priority) image.fetchPriority = "high";
    const request = new Promise<boolean>((resolve) => {
      const finish = (success: boolean) => {
        (success ? this.loaded : this.failed).add(theme);
        this.pending.delete(theme);
        resolve(success);
      };

      image.addEventListener("load", () => finish(true), { once: true });
      image.addEventListener("error", () => finish(false), { once: true });
      image.src = image.dataset.heroSrc ?? "";
    });

    this.pending.set(theme, request);
    return request;
  }

  private syncTheme(theme: Theme, priority: boolean) {
    if (this.destroyed || !this.images.has(theme)) return;

    if (this.loaded.has(theme)) {
      this.showTheme(theme);
      return;
    }

    this.hero.dataset.heroLoading = theme;
    void this.loadImage(theme, priority).then((success) => {
      if (!this.destroyed && success && getCurrentTheme() === theme) {
        this.showTheme(theme);
        this.scheduleAlternatePreload();
      }
    });
  }

  private showTheme(theme: Theme) {
    this.hero.dataset.heroActive = theme;
    delete this.hero.dataset.heroLoading;
  }

  private waitForPageLoad() {
    if (this.pageLoaded) return;

    const markLoaded = () => {
      this.pageLoaded = true;
      this.removeLoadListener = () => {};
      this.scheduleAlternatePreload();
    };
    window.addEventListener("load", markLoaded, { once: true });
    this.removeLoadListener = () => window.removeEventListener("load", markLoaded);
  }

  private scheduleAlternatePreload() {
    if (!this.pageLoaded || this.preloadQueued || this.destroyed) return;
    if (!this.loaded.has(getCurrentTheme())) return;

    this.preloadQueued = true;
    const preload = () => {
      if (this.destroyed) return;
      const alternate = getCurrentTheme() === "dark" ? "light" : "dark";
      void this.loadImage(alternate, false);
    };

    const scheduleIdle = () => {
      if (this.destroyed) return;
      if (typeof window.requestIdleCallback === "function") {
        this.idleCallback = window.requestIdleCallback(preload, { timeout: 2000 });
      } else {
        this.preloadTimer = window.setTimeout(preload, 0);
      }
    };
    scheduleIdle();
  }
}

let activeController: HeroThemeController | null = null;

const initializeHero = () => {
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  if (!hero || activeController) return;
  activeController = new HeroThemeController(hero);
};

const destroyHero = () => {
  activeController?.destroy();
  activeController = null;
};

document.addEventListener("astro:page-load", initializeHero);
document.addEventListener("astro:before-swap", destroyHero);
initializeHero();
