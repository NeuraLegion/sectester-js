export type Test = string | BrokenAccessControlTest;

export type BrokenAccessControlOptions =
  | {
      auth: string; // + anon
    }
  | {
      auth: [string, string];
    };

export type BrokenAccessControlTest = {
  name: 'broken_access_control';
  options: BrokenAccessControlOptions;
};
