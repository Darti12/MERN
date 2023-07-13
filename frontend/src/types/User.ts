export interface User {
  email?: string;
  roles?: string[];
  username?: string;
  token?: string;
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}
