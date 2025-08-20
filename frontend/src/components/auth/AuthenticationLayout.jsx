import { Outlet } from "react-router";

const AuthenticationLayout = () => {
  return (
    <div className="rounded-box w-full max-w-xs md:max-w-md lg:max-w-lg mx-auto">
      <Outlet />
    </div>
  );
};

export default AuthenticationLayout;
