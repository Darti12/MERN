import { logout } from "../user/userSlice";
import { useDispatch } from "react-redux";

export const useLogout = () => {
  const dispatch = useDispatch();
  const logoutUser = () => {
    localStorage.removeItem("user");
    dispatch(logout());
  };

  return { logoutUser };
};
