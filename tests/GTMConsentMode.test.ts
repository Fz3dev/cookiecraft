import { GTMConsentMode } from "../src/integrations/GTMConsentMode";
import { DataLayerManager } from "../src/integrations/DataLayerManager";
import { ConsentConfig, ConsentCategories } from "../src/types";

const makeConfig = (overrides: Partial<ConsentConfig> = {}): ConsentConfig => ({
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
  gtmConsentMode: true,
  ...overrides,
});

describe("GTMConsentMode", () => {
  let dlm: DataLayerManager;
  let pushConsentSpy: jest.SpyInstance;
  let pushSetSpy: jest.SpyInstance;

  beforeEach(() => {
    window.dataLayer = undefined;
    window.gtag = undefined;
    dlm = new DataLayerManager();
    pushConsentSpy = jest.spyOn(dlm, "pushConsent");
    pushSetSpy = jest.spyOn(dlm, "pushSet");
  });

  test("setDefaultConsent pushes all denied defaults", () => {
    const gtm = new GTMConsentMode(dlm, makeConfig());
    gtm.setDefaultConsent();

    expect(pushConsentSpy).toHaveBeenCalledWith(
      "default",
      expect.objectContaining({
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
        functionality_storage: "denied",
        personalization_storage: "denied",
        security_storage: "granted",
      }),
    );
  });

  test("setDefaultConsent includes wait_for_update", () => {
    const gtm = new GTMConsentMode(dlm, makeConfig({ gtmWaitForUpdate: 1000 }));
    gtm.setDefaultConsent();

    expect(pushConsentSpy).toHaveBeenCalledWith(
      "default",
      expect.objectContaining({
        wait_for_update: 1000,
      }),
    );
  });

  test("setDefaultConsent pushes url_passthrough when configured", () => {
    const gtm = new GTMConsentMode(
      dlm,
      makeConfig({ gtmUrlPassthrough: true }),
    );
    gtm.setDefaultConsent();

    expect(pushSetSpy).toHaveBeenCalledWith("url_passthrough", true);
  });

  test("setDefaultConsent pushes ads_data_redaction when configured", () => {
    const gtm = new GTMConsentMode(
      dlm,
      makeConfig({ gtmAdsDataRedaction: true }),
    );
    gtm.setDefaultConsent();

    expect(pushSetSpy).toHaveBeenCalledWith("ads_data_redaction", true);
  });

  test("updateConsent maps analytics=true correctly", () => {
    const gtm = new GTMConsentMode(dlm, makeConfig());
    const cats: ConsentCategories = {
      necessary: true,
      analytics: true,
      marketing: false,
    };
    gtm.updateConsent(cats);

    expect(pushConsentSpy).toHaveBeenCalledWith(
      "update",
      expect.objectContaining({
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      }),
    );
  });

  test("updateConsent maps marketing=true correctly", () => {
    const gtm = new GTMConsentMode(dlm, makeConfig());
    const cats: ConsentCategories = {
      necessary: true,
      analytics: false,
      marketing: true,
    };
    gtm.updateConsent(cats);

    expect(pushConsentSpy).toHaveBeenCalledWith(
      "update",
      expect.objectContaining({
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        analytics_storage: "denied",
      }),
    );
  });

  test("functionality_storage defaults to granted when preferences category not configured", () => {
    const gtm = new GTMConsentMode(dlm, makeConfig());
    const cats: ConsentCategories = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    gtm.updateConsent(cats);

    expect(pushConsentSpy).toHaveBeenCalledWith(
      "update",
      expect.objectContaining({
        functionality_storage: "granted",
        personalization_storage: "granted",
      }),
    );
  });

  test("functionality_storage follows preferences when preferences category exists", () => {
    const config = makeConfig({
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
        preferences: {
          enabled: true,
          readOnly: false,
          label: "Preferences",
          description: "",
        },
      },
    });
    const gtm = new GTMConsentMode(dlm, config);
    const cats: ConsentCategories = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    gtm.updateConsent(cats);

    expect(pushConsentSpy).toHaveBeenCalledWith(
      "update",
      expect.objectContaining({
        functionality_storage: "denied",
        personalization_storage: "denied",
      }),
    );
  });

  test("security_storage is always granted", () => {
    const gtm = new GTMConsentMode(dlm, makeConfig());
    const cats: ConsentCategories = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    gtm.updateConsent(cats);

    expect(pushConsentSpy).toHaveBeenCalledWith(
      "update",
      expect.objectContaining({
        security_storage: "granted",
      }),
    );
  });
});
