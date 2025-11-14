export interface UsersModel {
  username: string;
  password: string;
  submitting: boolean;
  errors: string[];
  success: string;
  user: null | { username: string };
}
