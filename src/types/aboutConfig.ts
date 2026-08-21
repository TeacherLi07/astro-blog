export interface AboutLinkConfig {
  readonly name: string;
  readonly icon: string;
  readonly url: string;
}

export interface AboutTechStackItemConfig {
  readonly icon: string;
  readonly name: string;
}

export interface AboutConfig {
  readonly enabled: boolean;
  readonly pageTitle: string;
  readonly pageDescription: string;
  readonly hero: {
    readonly eyebrow: string;
    readonly title: string;
    readonly description: readonly string[];
  };
  readonly links: readonly AboutLinkConfig[];
  readonly techStack: {
    readonly title: string;
    readonly description: string;
    readonly items: readonly AboutTechStackItemConfig[];
  };
}
