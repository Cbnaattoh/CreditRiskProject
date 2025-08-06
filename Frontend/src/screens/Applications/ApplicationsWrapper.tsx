import React from "react";
import { useIsClientUser } from "../../components/utils/hooks/useRBAC";
import Applicants from "../Applicants"; // This is the list view component
import Applications from "./index"; // This is the form component

const ApplicationsWrapper: React.FC = () => {
  const isClientUser = useIsClientUser();
  
  // RBAC working correctly
  console.log('✅ ApplicationsWrapper: Showing client applications view');
  
  // For client users, show the application form (so they can create new applications)
  // For admin/staff users, show the applicants list
  if (isClientUser) {
    // Show the Applications form component for client users to create applications
    return <Applications />;
  }
  
  // For admin/staff users who access this route, show the filtered applicants list
  return <Applicants showClientView={true} />;
};

export default ApplicationsWrapper;