/// <reference types="nativewind/types" />

declare global {
  namespace ReactNavigation {
    interface RootParamList {
      "/jobs": undefined;
      "/jobs/[id]": { id: string };
      "/jobs/post": undefined;
      "/jobs/my-jobs": undefined;
      "/jobs/[id]/applications": { id: string };
      "/jobs/[id]/complete": { id: string };
      "/jobs/[id]/rate": { id: string };
    }
  }
}

// Need to export something to make it a module
export {};