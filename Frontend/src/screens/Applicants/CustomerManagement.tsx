import React from "react";
import Applicants from "./index";

// Customer Management view - focuses on customer profiles rather than applications
const CustomerManagement: React.FC = () => {
  return <Applicants showClientView={false} />;
};

export default CustomerManagement;