// import React, { useState, useRef, useEffect } from "react";
// import {
//   motion,
//   AnimatePresence,
//   useMotionValue,
//   useTransform,
//   animate,
// } from "framer-motion";
// import {
//   FiEdit,
//   FiLock,
//   FiMail,
//   FiBell,
//   FiSun,
//   FiMoon,
//   FiMonitor,
//   FiUser,
//   FiShield,
//   FiEye,
//   FiLayout,
//   FiChevronRight,
//   FiCheck,
//   FiX,
// } from "react-icons/fi";
// import { FaCheck, FaFingerprint } from "react-icons/fa";
// import { RiShieldKeyholeLine } from "react-icons/ri";
// import { IoMdColorPalette } from "react-icons/io";
// import { BiFontSize } from "react-icons/bi";

// const AccountSettings = () => {
//   // State management
//   const [activeTab, setActiveTab] = useState("account");
//   const [isEditing, setIsEditing] = useState(false);
//   const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
//   const [notificationsEnabled, setNotificationsEnabled] = useState(true);
//   const [biometricEnabled, setBiometricEnabled] = useState(false);
//   const [theme, setTheme] = useState("system");
//   const [fontSize, setFontSize] = useState("medium");
//   const [gender, setGender] = useState("male");
//   const [maritalStatus, setMaritalStatus] = useState("married");
//   const [isDragging, setIsDragging] = useState(false);
//   const [showDarkModeToggle, setShowDarkModeToggle] = useState(false);
//   const constraintsRef = useRef(null);

//   // Animated values
//   const x = useMotionValue(0);
//   const background = useTransform(
//     x,
//     [-100, 0, 100],
//     [
//       "rgba(99, 102, 241, 0.1)",
//       "rgba(255, 255, 255, 0)",
//       "rgba(99, 102, 241, 0.1)",
//     ]
//   );

//   // Configuration
//   const tabs = [
//     {
//       id: "account",
//       label: "Account",
//       icon: <FiUser />,
//       color: "from-purple-500 to-indigo-600",
//     },
//     {
//       id: "security",
//       label: "Security",
//       icon: <RiShieldKeyholeLine />,
//       color: "from-blue-500 to-teal-600",
//     },
//     {
//       id: "appearance",
//       label: "Appearance",
//       icon: <IoMdColorPalette />,
//       color: "from-amber-500 to-orange-600",
//     },
//     {
//       id: "preview",
//       label: "Preview",
//       icon: <FiLayout />,
//       color: "from-emerald-500 to-green-600",
//     },
//   ];

//   // Animation configurations
//   const hoverEffect = {
//     scale: 1.02,
//     boxShadow:
//       "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
//     transition: { type: "spring", stiffness: 400, damping: 10 },
//   };

//   const tapEffect = {
//     scale: 0.98,
//     transition: { type: "spring", stiffness: 1000, damping: 20 },
//   };

//   const glowEffect = {
//     boxShadow: "0 0 15px rgba(99, 102, 241, 0.5)",
//     transition: { duration: 0.3 },
//   };

//   // Dark mode toggle handler
//   const toggleDarkMode = () => {
//     document.documentElement.classList.toggle("dark");
//     setShowDarkModeToggle(false);
//   };

//   // Effect for initial animation
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       animate(x, 10, { type: "spring", stiffness: 100, damping: 10 });
//       setTimeout(
//         () => animate(x, 0, { type: "spring", stiffness: 100, damping: 10 }),
//         200
//       );
//     }, 500);

//     return () => clearTimeout(timer);
//   }, []);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 transition-colors duration-300">
//       {/* Animated Background Elements */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
//         {[...Array(12)].map((_, i) => (
//           <motion.div
//             key={i}
//             className="absolute rounded-full bg-indigo-100 dark:bg-indigo-900/20 opacity-10 dark:opacity-5"
//             initial={{
//               x: Math.random() * 100,
//               y: Math.random() * 100,
//               width: Math.random() * 400 + 100,
//               height: Math.random() * 400 + 100,
//             }}
//             animate={{
//               x: [null, Math.random() * 100],
//               y: [null, Math.random() * 100],
//             }}
//             transition={{
//               duration: 40 + Math.random() * 40,
//               repeat: Infinity,
//               repeatType: "reverse",
//               ease: "linear",
//             }}
//           />
//         ))}
//       </div>

//       {/* Dark Mode Floating Button */}
//       <motion.button
//         className="fixed bottom-6 right-6 z-50 p-3 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700"
//         onClick={() => setShowDarkModeToggle(!showDarkModeToggle)}
//         whileHover={{ scale: 1.1 }}
//         whileTap={{ scale: 0.9 }}
//       >
//         {theme === "dark" ? (
//           <FiMoon className="text-indigo-600 dark:text-indigo-400" size={20} />
//         ) : (
//           <FiSun className="text-amber-600 dark:text-amber-400" size={20} />
//         )}
//       </motion.button>

//       <AnimatePresence>
//         {showDarkModeToggle && (
//           <motion.div
//             className="fixed bottom-20 right-6 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: 20 }}
//           >
//             <div className="p-4">
//               <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
//                 Theme Settings
//               </h4>
//               <div className="flex flex-col space-y-2">
//                 <button
//                   onClick={() => {
//                     setTheme("light");
//                     toggleDarkMode();
//                   }}
//                   className={`px-4 py-2 rounded-lg text-left flex items-center ${
//                     theme === "light"
//                       ? "bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400"
//                       : "hover:bg-gray-100 dark:hover:bg-gray-700"
//                   }`}
//                 >
//                   <FiSun className="mr-2" /> Light Mode
//                 </button>
//                 <button
//                   onClick={() => {
//                     setTheme("dark");
//                     toggleDarkMode();
//                   }}
//                   className={`px-4 py-2 rounded-lg text-left flex items-center ${
//                     theme === "dark"
//                       ? "bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400"
//                       : "hover:bg-gray-100 dark:hover:bg-gray-700"
//                   }`}
//                 >
//                   <FiMoon className="mr-2" /> Dark Mode
//                 </button>
//                 <button
//                   onClick={() => {
//                     setTheme("system");
//                     toggleDarkMode();
//                   }}
//                   className={`px-4 py-2 rounded-lg text-left flex items-center ${
//                     theme === "system"
//                       ? "bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400"
//                       : "hover:bg-gray-100 dark:hover:bg-gray-700"
//                   }`}
//                 >
//                   <FiMonitor className="mr-2" /> System Preference
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Main Card */}
//       <motion.div
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8, type: "spring" }}
//         className="max-w-6xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/50"
//       >
//         {/* Premium Navigation Bar */}
//         <div className="relative px-6 md:px-8 pt-6 md:pt-8">
//           <motion.div className="flex justify-center" ref={constraintsRef}>
//             <motion.div
//               className="flex bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-full p-1 shadow-inner border border-white/20 dark:border-gray-600/30"
//               drag="x"
//               dragConstraints={constraintsRef}
//               dragElastic={0.1}
//               onDragStart={() => setIsDragging(true)}
//               onDragEnd={() => setIsDragging(false)}
//               style={{ x, background }}
//             >
//               {tabs.map((tab) => (
//                 <motion.button
//                   key={tab.id}
//                   onClick={() => {
//                     animate(x, 0, { type: "spring" });
//                     setActiveTab(tab.id);
//                   }}
//                   className={`relative z-10 px-6 py-3 rounded-full flex items-center justify-center transition-all ${
//                     activeTab === tab.id
//                       ? "text-white"
//                       : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
//                   }`}
//                   whileHover={isDragging ? {} : { scale: 1.05 }}
//                   whileTap={tapEffect}
//                 >
//                   <span className="mr-2">{tab.icon}</span>
//                   <span className="font-medium">{tab.label}</span>
//                   {activeTab === tab.id && (
//                     <motion.div
//                       layoutId="activeTabBg"
//                       className={`absolute inset-0 rounded-full bg-gradient-to-r ${tab.color} z-[-1]`}
//                       transition={{
//                         type: "spring",
//                         bounce: 0.2,
//                         duration: 0.6,
//                       }}
//                     />
//                   )}
//                 </motion.button>
//               ))}
//             </motion.div>
//           </motion.div>
//         </div>

//         {/* Main Content Area */}
//         <div className="p-6 md:p-8 pt-4 md:pt-6">
//           <AnimatePresence mode="wait">
//             {/* Account Tab */}
//             {activeTab === "account" && (
//               <motion.div
//                 key="account"
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 transition={{ duration: 0.4, type: "spring" }}
//                 className="space-y-8"
//               >
//                 {/* Profile Header */}
//                 <motion.div
//                   className="flex flex-col md:flex-row items-center md:space-x-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl border border-white/20 dark:border-gray-700/50"
//                   whileHover={hoverEffect}
//                 >
//                   <motion.div
//                     className="relative group mb-4 md:mb-0"
//                     whileHover={{ scale: 1.05 }}
//                   >
//                     <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
//                       <span className="text-3xl md:text-4xl text-indigo-600 dark:text-indigo-400 font-bold">
//                         JD
//                       </span>
//                     </div>
//                     <motion.button
//                       className="absolute bottom-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-2 md:p-3 rounded-full shadow-lg transform translate-y-1/4 group-hover:translate-y-0 transition-all"
//                       whileHover={{ scale: 1.1, ...glowEffect }}
//                       whileTap={tapEffect}
//                     >
//                       <FiEdit size={18} />
//                     </motion.button>
//                   </motion.div>
//                   <div className="text-center md:text-left">
//                     <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
//                       Jon Doe
//                     </h3>
//                     <p className="text-gray-600 dark:text-gray-300 flex items-center justify-center md:justify-start">
//                       <FiMail className="mr-2" />
//                       Jon@gmail.com
//                     </p>
//                   </div>
//                 </motion.div>

//                 {/* Password Section */}
//                 <motion.div
//                   className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.2 }}
//                   whileHover={hoverEffect}
//                 >
//                   <div className="flex justify-between items-center mb-4">
//                     <h4 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white flex items-center">
//                       <FiLock className="mr-2 text-indigo-600 dark:text-indigo-400" />
//                       Password Security
//                     </h4>
//                     <motion.button
//                       onClick={() => setIsEditing(!isEditing)}
//                       className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center"
//                       whileHover={{ x: 3 }}
//                       whileTap={tapEffect}
//                     >
//                       <FiEdit className="mr-1" />
//                       {isEditing ? "Cancel" : "Edit"}
//                     </motion.button>
//                   </div>

//                   <AnimatePresence mode="wait">
//                     {isEditing ? (
//                       <motion.div
//                         key="edit-form"
//                         initial={{ height: 0, opacity: 0 }}
//                         animate={{ height: "auto", opacity: 1 }}
//                         exit={{ height: 0, opacity: 0 }}
//                         transition={{ type: "spring", bounce: 0.2 }}
//                         className="overflow-hidden"
//                       >
//                         <div className="space-y-4">
//                           {[
//                             "Current Password",
//                             "New Password",
//                             "Confirm New Password",
//                           ].map((label, i) => (
//                             <motion.div
//                               key={label}
//                               initial={{ opacity: 0, x: -10 }}
//                               animate={{ opacity: 1, x: 0 }}
//                               transition={{ delay: 0.1 + i * 0.05 }}
//                             >
//                               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                                 {label}
//                               </label>
//                               <div className="relative">
//                                 <input
//                                   type="password"
//                                   className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white/80 dark:bg-gray-700/80 dark:text-white"
//                                 />
//                                 {i > 0 && (
//                                   <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
//                                     <div className="h-full w-px bg-gray-200 dark:bg-gray-600 mx-2"></div>
//                                     <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
//                                       <FiEye />
//                                     </button>
//                                   </div>
//                                 )}
//                               </div>
//                             </motion.div>
//                           ))}
//                           <motion.div
//                             className="flex justify-end space-x-3 pt-4"
//                             initial={{ opacity: 0, y: 10 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             transition={{ delay: 0.25 }}
//                           >
//                             <motion.button
//                               onClick={() => setIsEditing(false)}
//                               className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
//                               whileHover={{ scale: 1.03 }}
//                               whileTap={tapEffect}
//                             >
//                               Cancel
//                             </motion.button>
//                             <motion.button
//                               className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all"
//                               whileHover={{ scale: 1.03, ...glowEffect }}
//                               whileTap={tapEffect}
//                             >
//                               Save Changes
//                             </motion.button>
//                           </motion.div>
//                         </div>
//                       </motion.div>
//                     ) : (
//                       <motion.div
//                         key="view-mode"
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: 1 }}
//                         exit={{ opacity: 0 }}
//                         className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-700/80 rounded-lg border border-gray-200 dark:border-gray-600"
//                       >
//                         <div className="flex items-center text-gray-600 dark:text-gray-300">
//                           <FiLock className="mr-2 text-indigo-600 dark:text-indigo-400" />
//                           <span>Last changed 3 months ago</span>
//                         </div>
//                         <FiChevronRight className="text-gray-400 dark:text-gray-500" />
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </motion.div>
//               </motion.div>
//             )}

//             {/* Security Tab */}
//             {activeTab === "security" && (
//               <motion.div
//                 key="security"
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 transition={{ duration: 0.4, type: "spring" }}
//                 className="space-y-6"
//               >
//                 <motion.h3
//                   className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.1 }}
//                 >
//                   Security Center
//                 </motion.h3>

//                 <motion.div
//                   className="space-y-4"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.2 }}
//                 >
//                   {[
//                     {
//                       icon: (
//                         <RiShieldKeyholeLine
//                           className="text-blue-600 dark:text-blue-400"
//                           size={24}
//                         />
//                       ),
//                       title: "Two-Factor Authentication",
//                       description:
//                         "Add an extra layer of security to your account",
//                       enabled: twoFactorEnabled,
//                       toggle: () => setTwoFactorEnabled(!twoFactorEnabled),
//                       color: "from-blue-600 to-teal-600",
//                     },
//                     {
//                       icon: (
//                         <FiBell
//                           className="text-amber-600 dark:text-amber-400"
//                           size={24}
//                         />
//                       ),
//                       title: "Login Notifications",
//                       description:
//                         "Get alerts for new sign-ins to your account",
//                       enabled: notificationsEnabled,
//                       toggle: () =>
//                         setNotificationsEnabled(!notificationsEnabled),
//                       color: "from-amber-600 to-orange-600",
//                     },
//                     {
//                       icon: (
//                         <FaFingerprint
//                           className="text-purple-600 dark:text-purple-400"
//                           size={24}
//                         />
//                       ),
//                       title: "Biometric Authentication",
//                       description: "Enable fingerprint or face recognition",
//                       enabled: biometricEnabled,
//                       toggle: () => setBiometricEnabled(!biometricEnabled),
//                       color: "from-purple-600 to-indigo-600",
//                     },
//                   ].map((item, index) => (
//                     <motion.div
//                       key={index}
//                       className="flex items-center justify-between p-5 md:p-6 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-600/50 shadow-sm"
//                       whileHover={hoverEffect}
//                       initial={{ opacity: 0, y: 10 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ delay: 0.1 + index * 0.05 }}
//                     >
//                       <div className="flex items-center space-x-4">
//                         <div className="p-3 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border border-white/20 dark:border-gray-600/30 shadow-inner">
//                           {item.icon}
//                         </div>
//                         <div>
//                           <h4 className="font-semibold text-gray-800 dark:text-white">
//                             {item.title}
//                           </h4>
//                           <p className="text-sm text-gray-600 dark:text-gray-300">
//                             {item.description}
//                           </p>
//                         </div>
//                       </div>
//                       <motion.div
//                         className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
//                           item.enabled
//                             ? `bg-gradient-to-r ${item.color}`
//                             : "bg-gray-200 dark:bg-gray-600"
//                         }`}
//                         whileHover={isDragging ? {} : { scale: 1.05 }}
//                         whileTap={tapEffect}
//                         onClick={item.toggle}
//                       >
//                         <motion.span
//                           className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-100 shadow-lg transition-all ${
//                             item.enabled ? "translate-x-7" : "translate-x-1"
//                           }`}
//                           layout
//                         />
//                       </motion.div>
//                     </motion.div>
//                   ))}
//                 </motion.div>

//                 {/* Session Management */}
//                 <motion.div
//                   className="mt-8"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.4 }}
//                 >
//                   <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
//                     Session Management
//                   </h4>
//                   <div className="space-y-4">
//                     <motion.div
//                       className="flex items-center justify-between p-5 md:p-6 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-600/50 shadow-sm"
//                       whileHover={hoverEffect}
//                     >
//                       <div className="flex items-center space-x-4">
//                         <div className="p-3 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border border-white/20 dark:border-gray-600/30 shadow-inner">
//                           <FiShield
//                             className="text-green-600 dark:text-green-400"
//                             size={24}
//                           />
//                         </div>
//                         <div>
//                           <h4 className="font-semibold text-gray-800 dark:text-white">
//                             Active Sessions
//                           </h4>
//                           <p className="text-sm text-gray-600 dark:text-gray-300">
//                             Manage your logged-in devices
//                           </p>
//                         </div>
//                       </div>
//                       <motion.button
//                         className="px-4 py-1.5 rounded-full bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-600 dark:to-gray-700 text-gray-800 dark:text-white text-sm font-medium border border-gray-200 dark:border-gray-600"
//                         whileHover={{ scale: 1.05 }}
//                         whileTap={tapEffect}
//                       >
//                         View Sessions
//                       </motion.button>
//                     </motion.div>

//                     <motion.div
//                       className="flex items-center justify-between p-5 md:p-6 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-600/50 shadow-sm"
//                       whileHover={hoverEffect}
//                     >
//                       <div className="flex items-center space-x-4">
//                         <div className="p-3 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border border-white/20 dark:border-gray-600/30 shadow-inner">
//                           <FiCheck
//                             className="text-red-600 dark:text-red-400"
//                             size={24}
//                           />
//                         </div>
//                         <div>
//                           <h4 className="font-semibold text-gray-800 dark:text-white">
//                             Log Out Everywhere
//                           </h4>
//                           <p className="text-sm text-gray-600 dark:text-gray-300">
//                             Sign out of all devices except this one
//                           </p>
//                         </div>
//                       </div>
//                       <motion.button
//                         className="px-4 py-1.5 rounded-full bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/30 text-red-600 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-700/50"
//                         whileHover={{ scale: 1.05 }}
//                         whileTap={tapEffect}
//                       >
//                         Sign Out
//                       </motion.button>
//                     </motion.div>
//                   </div>
//                 </motion.div>
//               </motion.div>
//             )}

//             {/* Appearance Tab */}
//             {activeTab === "appearance" && (
//               <motion.div
//                 key="appearance"
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 transition={{ duration: 0.4, type: "spring" }}
//                 className="space-y-8"
//               >
//                 <motion.h3
//                   className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.1 }}
//                 >
//                   Appearance Settings
//                 </motion.h3>

//                 {/* Theme Selection */}
//                 <motion.div
//                   className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.2 }}
//                   whileHover={hoverEffect}
//                 >
//                   <h4 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
//                     <IoMdColorPalette className="mr-2 text-indigo-600 dark:text-indigo-400" />
//                     Theme Preferences
//                   </h4>
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     {[
//                       {
//                         id: "light",
//                         icon: <FiSun size={24} />,
//                         label: "Light",
//                         desc: "Bright and clean",
//                       },
//                       {
//                         id: "dark",
//                         icon: <FiMoon size={24} />,
//                         label: "Dark",
//                         desc: "Easy on the eyes",
//                       },
//                       {
//                         id: "system",
//                         icon: <FiMonitor size={24} />,
//                         label: "System",
//                         desc: "Match device setting",
//                       },
//                     ].map((option) => (
//                       <motion.button
//                         key={option.id}
//                         onClick={() => setTheme(option.id)}
//                         whileHover={{ scale: 1.03 }}
//                         whileTap={tapEffect}
//                         className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all ${
//                           theme === option.id
//                             ? "border-indigo-500 bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md"
//                             : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
//                         }`}
//                       >
//                         <span className="mb-3">{option.icon}</span>
//                         <span className="font-medium">{option.label}</span>
//                         <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
//                           {option.desc}
//                         </span>
//                         {theme === option.id && (
//                           <motion.div
//                             className="mt-3 text-indigo-600 dark:text-indigo-400"
//                             initial={{ scale: 0 }}
//                             animate={{ scale: 1 }}
//                           >
//                             <FaCheck />
//                           </motion.div>
//                         )}
//                       </motion.button>
//                     ))}
//                   </div>
//                 </motion.div>

//                 {/* Font Size */}
//                 <motion.div
//                   className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.3 }}
//                   whileHover={hoverEffect}
//                 >
//                   <h4 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
//                     <BiFontSize className="mr-2 text-indigo-600 dark:text-indigo-400" />
//                     Text Size
//                   </h4>
//                   <div className="flex flex-col space-y-4">
//                     <div className="flex justify-between items-center">
//                       {["small", "medium", "large"].map((size) => (
//                         <motion.button
//                           key={size}
//                           onClick={() => setFontSize(size)}
//                           whileHover={{ scale: 1.05 }}
//                           whileTap={tapEffect}
//                           className={`px-6 py-3 rounded-lg border-2 transition-all ${
//                             fontSize === size
//                               ? "border-indigo-500 bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md"
//                               : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
//                           }`}
//                         >
//                           {size.charAt(0).toUpperCase() + size.slice(1)}
//                         </motion.button>
//                       ))}
//                     </div>
//                     <div className="mt-4">
//                       <div
//                         className={`bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-all ${
//                           fontSize === "small"
//                             ? "text-sm"
//                             : fontSize === "medium"
//                             ? "text-base"
//                             : "text-lg"
//                         }`}
//                       >
//                         <p className="font-medium">Preview Text</p>
//                         <p className="text-gray-600 dark:text-gray-400">
//                           This is how your text will appear at this size
//                           setting.
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </motion.div>

//                 {/* Accent Color */}
//                 <motion.div
//                   className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.4 }}
//                   whileHover={hoverEffect}
//                 >
//                   <h4 className="font-semibold text-gray-800 dark:text-white mb-4">
//                     Accent Color
//                   </h4>
//                   <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
//                     {["indigo", "blue", "green", "red", "purple", "amber"].map(
//                       (color) => (
//                         <motion.button
//                           key={color}
//                           whileHover={{ scale: 1.1 }}
//                           whileTap={tapEffect}
//                           className={`h-10 rounded-full bg-${color}-500 border-2 ${
//                             color === "indigo"
//                               ? "border-indigo-700 dark:border-indigo-300"
//                               : "border-transparent"
//                           }`}
//                         />
//                       )
//                     )}
//                   </div>
//                 </motion.div>
//               </motion.div>
//             )}

//             {/* Preview Tab */}
//             {activeTab === "preview" && (
//               <motion.div
//                 key="preview"
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 transition={{ duration: 0.4, type: "spring" }}
//                 className="space-y-8"
//               >
//                 <motion.h3
//                   className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.1 }}
//                 >
//                   Profile Preview
//                 </motion.h3>

//                 {/* Basic Information */}
//                 <motion.div
//                   className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.2 }}
//                   whileHover={hoverEffect}
//                 >
//                   <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
//                     Basic Information
//                   </h4>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                         First Name
//                       </label>
//                       <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium">
//                         Afriyle
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                         Other Names
//                       </label>
//                       <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium">
//                         Kelvin
//                       </div>
//                     </div>
//                   </div>

//                   <div className="mt-6">
//                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
//                       Gender
//                     </label>
//                     <div className="grid grid-cols-3 gap-3">
//                       {["male", "female", "other"].map((option) => (
//                         <motion.button
//                           key={option}
//                           onClick={() => setGender(option)}
//                           whileHover={{ scale: 1.03 }}
//                           whileTap={tapEffect}
//                           className={`p-4 rounded-lg border-2 transition-all ${
//                             gender === option
//                               ? "border-indigo-500 bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md"
//                               : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
//                           }`}
//                         >
//                           {option.charAt(0).toUpperCase() + option.slice(1)}
//                         </motion.button>
//                       ))}
//                     </div>
//                   </div>

//                   <div className="mt-6">
//                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
//                       Marital Status
//                     </label>
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                       {["single", "married", "divorced", "widowed"].map(
//                         (status) => (
//                           <motion.button
//                             key={status}
//                             onClick={() => setMaritalStatus(status)}
//                             whileHover={{ scale: 1.03 }}
//                             whileTap={tapEffect}
//                             className={`p-4 rounded-lg border-2 transition-all ${
//                               maritalStatus === status
//                                 ? "border-indigo-500 bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md"
//                                 : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
//                             }`}
//                           >
//                             {status.charAt(0).toUpperCase() + status.slice(1)}
//                           </motion.button>
//                         )
//                       )}
//                     </div>
//                   </div>
//                 </motion.div>

//                 {/* Contact Information */}
//                 <motion.div
//                   className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.3 }}
//                   whileHover={hoverEffect}
//                 >
//                   <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
//                     Contact Information
//                   </h4>

//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                         Email Address
//                       </label>
//                       <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium flex items-center justify-between">
//                         <span>jon@gmail.com</span>
//                         <div className="flex space-x-2">
//                           <motion.button
//                             className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg"
//                             whileHover={{ scale: 1.1 }}
//                             whileTap={tapEffect}
//                           >
//                             <FiEdit />
//                           </motion.button>
//                           <motion.button
//                             className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
//                             whileHover={{ scale: 1.1 }}
//                             whileTap={tapEffect}
//                           >
//                             <FiX />
//                           </motion.button>
//                         </div>
//                       </div>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                         Phone Number
//                       </label>
//                       <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium flex items-center justify-between">
//                         <span>+1 (555) 123-4567</span>
//                         <div className="flex space-x-2">
//                           <motion.button
//                             className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg"
//                             whileHover={{ scale: 1.1 }}
//                             whileTap={tapEffect}
//                           >
//                             <FiEdit />
//                           </motion.button>
//                           <motion.button
//                             className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
//                             whileHover={{ scale: 1.1 }}
//                             whileTap={tapEffect}
//                           >
//                             <FiX />
//                           </motion.button>
//                         </div>
//                       </div>
//                     </div>

//                     <motion.button
//                       className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-2 border-dashed border-indigo-200 dark:border-indigo-700/50 text-indigo-600 dark:text-indigo-400 font-medium flex items-center justify-center"
//                       whileHover={{
//                         scale: 1.01,
//                         backgroundColor: "rgba(99, 102, 241, 0.1)",
//                       }}
//                       whileTap={tapEffect}
//                     >
//                       <span className="mr-2">+</span>
//                       Add New Contact Method
//                     </motion.button>
//                   </div>
//                 </motion.div>

//                 {/* Address Information */}
//                 <motion.div
//                   className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.4 }}
//                   whileHover={hoverEffect}
//                 >
//                   <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
//                     Address Information
//                   </h4>

//                   <div className="space-y-6">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           Country
//                         </label>
//                         <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium">
//                           United States
//                         </div>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           State/Region
//                         </label>
//                         <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium">
//                           California
//                         </div>
//                       </div>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                         Street Address
//                       </label>
//                       <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium">
//                         123 Main St, Apt 4B
//                       </div>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           City
//                         </label>
//                         <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium">
//                           San Francisco
//                         </div>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                           ZIP Code
//                         </label>
//                         <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium">
//                           94107
//                         </div>
//                       </div>
//                     </div>

//                     <div className="pt-4 flex justify-end space-x-4">
//                       <motion.button
//                         className="px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium"
//                         whileHover={{ scale: 1.02 }}
//                         whileTap={tapEffect}
//                       >
//                         Cancel
//                       </motion.button>
//                       <motion.button
//                         className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all font-medium"
//                         whileHover={{ scale: 1.02, ...glowEffect }}
//                         whileTap={tapEffect}
//                       >
//                         Save Changes
//                       </motion.button>
//                     </div>
//                   </div>
//                 </motion.div>

//                 {/* Social Media Connections */}
//                 <motion.div
//                   className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.5 }}
//                   whileHover={hoverEffect}
//                 >
//                   <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
//                     Social Connections
//                   </h4>

//                   <div className="space-y-4">
//                     {[
//                       { name: "Google", connected: true, color: "bg-red-500" },
//                       {
//                         name: "Facebook",
//                         connected: true,
//                         color: "bg-blue-600",
//                       },
//                       {
//                         name: "Twitter",
//                         connected: false,
//                         color: "bg-blue-400",
//                       },
//                       {
//                         name: "GitHub",
//                         connected: false,
//                         color: "bg-gray-800 dark:bg-gray-700",
//                       },
//                     ].map((social, index) => (
//                       <motion.div
//                         key={social.name}
//                         className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ delay: 0.5 + index * 0.05 }}
//                       >
//                         <div className="flex items-center space-x-4">
//                           <div
//                             className={`w-10 h-10 rounded-full ${social.color} flex items-center justify-center text-white`}
//                           >
//                             {social.name.charAt(0)}
//                           </div>
//                           <span className="font-medium">{social.name}</span>
//                         </div>
//                         {social.connected ? (
//                           <motion.button
//                             className="px-4 py-1.5 rounded-full bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/30 text-red-600 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-700/50"
//                             whileHover={{ scale: 1.05 }}
//                             whileTap={tapEffect}
//                           >
//                             Disconnect
//                           </motion.button>
//                         ) : (
//                           <motion.button
//                             className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-800/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium border border-indigo-200 dark:border-indigo-700/50"
//                             whileHover={{ scale: 1.05 }}
//                             whileTap={tapEffect}
//                           >
//                             Connect
//                           </motion.button>
//                         )}
//                       </motion.div>
//                     ))}
//                   </div>
//                 </motion.div>

//                 {/* Account Actions */}
//                 <motion.div
//                   className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.6 }}
//                   whileHover={hoverEffect}
//                 >
//                   <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
//                     Account Actions
//                   </h4>

//                   <div className="space-y-4">
//                     <motion.button
//                       className="w-full p-4 text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between text-red-600 dark:text-red-400"
//                       whileHover={{ x: 5 }}
//                       whileTap={tapEffect}
//                     >
//                       <span>Delete Account</span>
//                       <FiChevronRight />
//                     </motion.button>

//                     <motion.button
//                       className="w-full p-4 text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between text-amber-600 dark:text-amber-400"
//                       whileHover={{ x: 5 }}
//                       whileTap={tapEffect}
//                     >
//                       <span>Deactivate Account</span>
//                       <FiChevronRight />
//                     </motion.button>

//                     <motion.button
//                       className="w-full p-4 text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between text-blue-600 dark:text-blue-400"
//                       whileHover={{ x: 5 }}
//                       whileTap={tapEffect}
//                     >
//                       <span>Export Data</span>
//                       <FiChevronRight />
//                     </motion.button>
//                   </div>
//                 </motion.div>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>
//       </motion.div>
//     </div>
//   );
// };

// export default AccountSettings;






import { useState} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./components/ThemeToggle";
import { TabNavigation } from "./components/TabNavigation";
import { AccountTab } from "./components/AccountTab";
import { SecurityTab } from "./components/SecurityTab";
import { AppearanceTab } from "./components/ApperanceTab";
import { PreviewTab } from "./components/PreviewTab";
import {FiUser, FiLayout} from "react-icons/fi"
import {RiShieldKeyholeLine} from "react-icons/ri";
import {IoMdColorPalette} from "react-icons/io"

const AccountSettings = () => {
  const [activeTab, setActiveTab] = useState("account");

  const tabs = [
    {
      id: "account",
      label: "Account",
      icon: <FiUser />,
      color: "from-purple-500 to-indigo-600",
    },
    {
      id: "security",
      label: "Security",
      icon: <RiShieldKeyholeLine />,
      color: "from-blue-500 to-teal-600",
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: <IoMdColorPalette />,
      color: "from-amber-500 to-orange-600",
    },
    {
      id: "preview",
      label: "Preview",
      icon: <FiLayout />,
      color: "from-emerald-500 to-green-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 transition-colors duration-300">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-indigo-100 dark:bg-indigo-900/20 opacity-10 dark:opacity-5"
            initial={{
              x: Math.random() * 100,
              y: Math.random() * 100,
              width: Math.random() * 400 + 100,
              height: Math.random() * 400 + 100,
            }}
            animate={{
              x: [null, Math.random() * 100],
              y: [null, Math.random() * 100],
            }}
            transition={{
              duration: 40 + Math.random() * 40,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear",
            }}
          />
        ))}
      </div>

      <ThemeToggle />

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="max-w-6xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/50"
      >
        <TabNavigation tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <div className="p-6 md:p-8 pt-4 md:pt-6">
          <AnimatePresence mode="wait">
            {activeTab === "account" && <AccountTab />}
            {activeTab === "security" && <SecurityTab />}
            {activeTab === "appearance" && <AppearanceTab />}
            {activeTab === "preview" && <PreviewTab />}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AccountSettings;