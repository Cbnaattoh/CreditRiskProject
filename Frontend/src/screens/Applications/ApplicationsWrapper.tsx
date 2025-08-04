import React from "react";
import { useIsClientUser } from "../../components/utils/hooks/useRBAC";
import Applicants from "../Applicants"; // This is the list view component
import Applications from "./index"; // This is the form component

const ApplicationsWrapper: React.FC = () => {
  const isClientUser = useIsClientUser();
  
  // RBAC working correctly
  console.log('✅ ApplicationsWrapper: Showing client applications view');
  
  // For client users, show their applications list (filtered view)
  // For admin/staff, this component shouldn't be used (they use loan-applications route)
  if (isClientUser) {
    // Show the Applicants component but with client user filtering
    return <Applicants showClientView={true} />;
  }
  
  // For non-client users who somehow access this route, show the form
  return <Applications />;
};

export default ApplicationsWrapper;