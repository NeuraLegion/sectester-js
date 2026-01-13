export type Test = string | BrokenAccessControlTest;

export type BrokenAccessControlOptions =
  | {
      auth: string; // auth_object_id to scan with existing user and unauthorized user
    }
  | {
      auth: [string, string]; // auth_object_ids to scan with authorized users with different privileges
    };

export type BrokenAccessControlTest = {
  name: 'broken_access_control';
  options: BrokenAccessControlOptions;
};
