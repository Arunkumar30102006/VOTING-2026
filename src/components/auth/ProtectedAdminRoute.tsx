import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";

const ProtectedAdminRoute = () => {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    setIsAdmin(false);
                    setLoading(false);
                    return;
                }

                // Check if user exists in company_admins table
                const { data, error } = await supabase
                    .from("company_admins")
                    .select("id")
                    .eq("user_id", session.user.id)
                    .maybeSingle();

                if (error) {
                    console.error("Error checking admin status:", error);
                    setIsAdmin(false);
                } else if (data) {
                    setIsAdmin(true);
                } else {
                    // User is logged in but not an admin (e.g. might be a shareholder if we merge auth systems later)
                    // For now, if they are not in company_admins, they are not authorized for these routes.
                    setIsAdmin(false);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        checkAdminStatus();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingSpinner />
            </div>
        );
    }

    if (!isAdmin) {
        toast.error("Unauthorized access. Please login as a company administrator.");
        return <Navigate to="/company-login" replace />;
    }

    return <Outlet />;
};

export default ProtectedAdminRoute;
