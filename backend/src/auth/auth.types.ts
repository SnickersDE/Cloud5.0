export type RegisterBody = {
  email: string;
  password: string;
  passwordRepeat: string;
};

export type LoginBody = {
  username: string;
  password: string;
};

export type ProfileRow = {
  id: string;
  username: string;
  role: 'authenticated' | 'admin';
  email: string;
};
