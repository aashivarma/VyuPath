import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  children: ReactNode;
};

const AuthGuard = ({ children }: Props) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please login</div>;
  }

  return <>{children}</>;
};

export default AuthGuard;
