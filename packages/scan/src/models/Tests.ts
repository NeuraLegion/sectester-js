export type Test = string | BrokenAccessControlTest;

export type BrokenAccessControlOptions =
  | {
      auth: string; // scan with axisting user and unauthorized access
    }
  | {
      auth: [string, string]; // scan with different authorized users
    };

export type BrokenAccessControlTest = {
  name: 'broken_access_control';
  options: BrokenAccessControlOptions;
};
