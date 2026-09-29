import { Role } from "@/auth/roles";
import { useAuthState } from "@/provider/authStateContext";
import { useCan } from "@refinedev/core";
import { NavigateToResource } from "@refinedev/react-router";
import { useLocation } from "react-router";

interface RouteGuardProps {
  children: React.ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const { role, ready } = useAuthState();
  const location = useLocation();

  const getResourceAndAction = (pathname: string) => {
    if (pathname === "/") return { resource: null, action: null };

    let resource: string | null = null;
    let action: string = "list";

    if (pathname.startsWith("/school-admins")) resource = "school-admins";
    else if (pathname.startsWith("/teachers")) resource = "teachers";
    else if (pathname.startsWith("/students")) resource = "students";
    else if (pathname.startsWith("/works")) resource = "students";
    else if (pathname.startsWith("/academic-years")) {
      resource = pathname.includes("/classes") ? "classes" : "academic-years";
    }

    if (pathname.includes("/create")) action = "create";
    else if (pathname.includes("/edit")) action = "edit";

    return { resource, action };
  };

  const { resource, action } = getResourceAndAction(location.pathname);

  const { data: canAccess, isLoading: canLoading } = useCan({
    resource: resource ?? "academic-years",
    action: action ?? "list",
    queryOptions: { enabled: !!resource && ready },
  });

  const getRedirectResource = () => {
    if (role === Role.AgencyAdmin) return "school-admins";
    if (role === Role.SchoolAdmin) return "academic-years";
    return "academic-years";
  };

  if (!ready || (resource && canLoading)) return null;

  if (!resource) return <NavigateToResource resource={getRedirectResource()} />;
  if (!canAccess?.can)
    return <NavigateToResource resource={getRedirectResource()} />;

  return <>{children}</>;
};
