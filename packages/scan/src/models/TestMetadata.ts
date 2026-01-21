export type BrokenAccessControlMetadata = {
  authObjectId: [null, string] | [string, string];
};

export type TestMetadata = {
  broken_access_control?: BrokenAccessControlMetadata;
};
