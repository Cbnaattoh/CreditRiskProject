import {useEffect} from "react";
import {useGetMyPermissionsQuery} from "../../redux/features/api/RBAC/rbacApi";
import {useSelector} from "react-redux";
import {selectIsAuthenticated} from "../../redux/features/auth/authSlice";

export const useAuthSync = () => {
    const isAuthenticated = useSelector(selectIsAuthenticated);

    // Automatic permissions fetch when user is authenticated.
    const {
        data: permissionsData,
        isLoading: permissionsLoading,
        error: permissionsError
    } = useGetMyPermissionsQuery(undefined, {
        skip: !isAuthenticated,
        refetchOnMountOrArgChange: true,
    });

    useEffect(()=>{
        if (permissionsError){
            console.error('Failed to fetch user permissions:', permissionsError);
        }
    }, [permissionsError]);

    return{
        permissionsLoading,
        permissionsError,
        permissionsData,
    };
};