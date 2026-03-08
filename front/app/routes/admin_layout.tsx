import { Navigate, Outlet, useOutletContext } from 'react-router';

export default function Outer () {
    const outletContext = useOutletContext();
    const { loginInfo } = outletContext;

    if (!loginInfo.login) {
        return <Navigate to={"/login"} />;
    }
    if (loginInfo.role == "user") {
        return <Navigate to={"/"} />;
    }

    return <Outlet context={outletContext} />;
}
