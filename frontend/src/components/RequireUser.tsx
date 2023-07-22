import React from "react";
import { User } from "../types/User";
import { Navigate, Outlet } from "react-router-dom";
import Unauthorized from "../pages/UnAuthorized";

interface RequireUserProps {
  user: User;
  requiredRole?: string;
}

const RequireUser = (props: RequireUserProps) => {
  return (
    <>
      {props.user ? (
        <>
          {!props.requiredRole && <Outlet />}
          {props.requiredRole &&
            props.user.roles?.includes(props.requiredRole) && <Outlet />}
        </>
      ) : (
        <Unauthorized />
      )}
    </>
  );
};

export default RequireUser;
