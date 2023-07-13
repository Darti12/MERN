import { useSelector } from "react-redux";
import { RootState } from "../store";

export const useGetUser = () => {
  const loggedInUser = useSelector((state: RootState) => state.userState.user);

  const user = loggedInUser;

  return { user };
};
