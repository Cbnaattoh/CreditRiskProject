import React from "react";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCreditCard,
  FiLock,
  FiImage,
  FiCheck,
  FiX,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiUpload,
  FiEye,
  FiEyeOff,
  FiShield,
  FiCamera,
} from "react-icons/fi";

// Step 2: Personal Identity
interface StepProps {
  methods: any;
}

export const Step2PersonalIdentity: React.FC<StepProps> = ({ methods }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Personal Information
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enter your full name exactly as it appears on your Ghana Card for automatic verification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            First Name *
          </label>
          <div className="relative">
            <FiUser className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              {...methods.register("first_name", { required: true })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="KWAME (as on Ghana Card)"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Use UPPERCASE as shown on your Ghana Card</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Last Name *
          </label>
          <div className="relative">
            <FiUser className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              {...methods.register("last_name", { required: true })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="MENSAH (as on Ghana Card)"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ghana Card Number *
        </label>
        <div className="relative">
          <FiCreditCard className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            {...methods.register("ghana_card_number", { required: true })}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="GHA-123456789-1"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Format: GHA-XXXXXXXXX-X (9 digits + 1 check digit)
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-center mb-2">
          <FiAlertCircle className="text-blue-600 mr-2" />
          <span className="font-medium text-blue-800 dark:text-blue-200">Important</span>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Make sure your name and Ghana Card number match exactly with your physical card. 
          We'll verify this information automatically in the next step.
        </p>
      </div>
    </div>
  );
};

// Step 3: Ghana Card Verification
interface Step3Props {
  methods: any;
  frontPreview: string | null;
  setFrontPreview: (preview: string | null) => void;
  backPreview: string | null;
  setBackPreview: (preview: string | null) => void;
  isProcessingOCR: boolean;
  ocrResults: any;
  verificationStatus: "pending" | "success" | "warning" | "error";
  onProcessOCR?: (frontImage: File, backImage: File) => Promise<void>;
}

export const Step3GhanaCardVerification: React.FC<Step3Props> = ({
  methods,
  frontPreview,
  setFrontPreview,
  backPreview,
  setBackPreview,
  isProcessingOCR,
  ocrResults,
  verificationStatus,
  onProcessOCR,
}) => {
  const handleImageUpload = (
    file: File,
    setPreview: (preview: string | null) => void,
    fieldName: string
  ) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Ghana Card Verification
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload both sides of your Ghana Card for automatic verification and data extraction.
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
        <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
          📸 Photo Guidelines for Best Results
        </h3>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
          <li>• Ensure good lighting - avoid shadows</li>
          <li>• Keep card flat and fully visible</li>
          <li>• Avoid glare and reflections</li>
          <li>• Use a contrasting background</li>
          <li>• Take photos straight-on (not angled)</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Front Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ghana Card Front *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
            {frontPreview ? (
              <div className="relative">
                <img
                  src={frontPreview}
                  alt="Ghana Card front"
                  className="max-w-full h-48 object-contain mx-auto rounded-lg"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  FRONT
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFrontPreview(null);
                    methods.setValue("ghana_card_front_image", null);
                  }}
                  className="absolute top-2 left-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <FiX size={16} />
                </button>
                {isProcessingOCR && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-center">
                      <FiLoader className="animate-spin mx-auto mb-2" size={24} />
                      <p className="text-sm">Processing...</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <FiCamera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Upload front side</p>
                <p className="text-xs text-gray-500">Contains your photo and name</p>
              </div>
            )}
            <input
              type="file"
              {...methods.register("ghana_card_front_image", {
                required: true,
                onChange: (e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, setFrontPreview, "ghana_card_front_image");
                },
              })}
              accept="image/*"
              className="hidden"
              id="front-upload"
            />
            {!frontPreview && (
              <label
                htmlFor="front-upload"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 cursor-pointer"
              >
                <FiUpload className="mr-2" />
                Choose File
              </label>
            )}
          </div>
        </div>

        {/* Back Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ghana Card Back *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
            {backPreview ? (
              <div className="relative">
                <img
                  src={backPreview}
                  alt="Ghana Card back"
                  className="max-w-full h-48 object-contain mx-auto rounded-lg"
                />
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  BACK
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBackPreview(null);
                    methods.setValue("ghana_card_back_image", null);
                  }}
                  className="absolute top-2 left-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <FiX size={16} />
                </button>
              </div>
            ) : (
              <div>
                <FiCamera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Upload back side</p>
                <p className="text-xs text-gray-500">Contains card number and address</p>
              </div>
            )}
            <input
              type="file"
              {...methods.register("ghana_card_back_image", {
                required: true,
                onChange: (e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, setBackPreview, "ghana_card_back_image");
                },
              })}
              accept="image/*"
              className="hidden"
              id="back-upload"
            />
            {!backPreview && (
              <label
                htmlFor="back-upload"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                <FiUpload className="mr-2" />
                Choose File
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Manual OCR Processing Button */}
      {frontPreview && backPreview && !isProcessingOCR && !ocrResults && onProcessOCR && (
        <div className="text-center">
          <button
            type="button"
            onClick={async () => {
              const frontFile = methods.getValues("ghana_card_front_image")?.[0];
              const backFile = methods.getValues("ghana_card_back_image")?.[0];
              if (frontFile && backFile) {
                await onProcessOCR(frontFile, backFile);
              }
            }}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all"
          >
            <FiCheckCircle className="mr-2" />
            Process Ghana Card Verification
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Click to start automatic name and number verification
          </p>
        </div>
      )}

      {/* Verification Status */}
      {frontPreview && backPreview && (
        <div className="space-y-4">
          {isProcessingOCR ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center">
                <FiLoader className="animate-spin text-blue-600 mr-3" />
                <div>
                  <h4 className="font-medium text-blue-800">Processing Ghana Card...</h4>
                  <p className="text-sm text-blue-600">
                    We're extracting and verifying information from your Ghana Card images.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            ocrResults && (
              <div
                className={`border rounded-xl p-4 ${
                  verificationStatus === "success"
                    ? "bg-green-50 border-green-200"
                    : verificationStatus === "warning"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center mb-3">
                  {verificationStatus === "success" ? (
                    <FiCheckCircle className="text-green-600 mr-2" />
                  ) : verificationStatus === "warning" ? (
                    <FiAlertCircle className="text-yellow-600 mr-2" />
                  ) : (
                    <FiX className="text-red-600 mr-2" />
                  )}
                  <h4
                    className={`font-medium ${
                      verificationStatus === "success"
                        ? "text-green-800"
                        : verificationStatus === "warning"
                        ? "text-yellow-800"
                        : "text-red-800"
                    }`}
                  >
                    {verificationStatus === "success"
                      ? "Verification Successful"
                      : verificationStatus === "warning"
                      ? "Verification Warning"
                      : "Verification Failed"}
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Extracted Name:</p>
                    <p className="text-gray-600">{ocrResults.name}</p>
                  </div>
                  <div>
                    <p className="font-medium">Card Number:</p>
                    <p className="text-gray-600">{ocrResults.cardNumber}</p>
                  </div>
                  <div>
                    <p className="font-medium">Confidence Score:</p>
                    <p className="text-gray-600">{ocrResults.confidence}%</p>
                  </div>
                  <div>
                    <p className="font-medium">Status:</p>
                    <p className="text-gray-600">
                      {verificationStatus === "success"
                        ? "Verified ✓"
                        : verificationStatus === "warning"
                        ? "Needs Review"
                        : "Failed ✗"}
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

// Step 4: Account Security
interface Step4Props {
  methods: any;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  passwordStrength: number;
  setPasswordStrength: (strength: number) => void;
}

export const Step4AccountSecurity: React.FC<Step4Props> = ({
  methods,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  passwordStrength,
  setPasswordStrength,
}) => {
  const PASSWORD_REQUIREMENTS = [
    { key: "length", label: "At least 8 characters", regex: /.{8,}/ },
    { key: "uppercase", label: "One uppercase letter", regex: /[A-Z]/ },
    { key: "number", label: "One number", regex: /\d/ },
    { key: "special", label: "One special character", regex: /[!@#$%^&*(),.?":{}|<>]/ },
  ];

  const calculatePasswordStrength = (password: string) => {
    const metRequirements = PASSWORD_REQUIREMENTS.filter(req => req.regex.test(password));
    setPasswordStrength(metRequirements.length);
    return metRequirements;
  };

  const password = methods.watch("password") || "";
  const metRequirements = calculatePasswordStrength(password);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Secure Your Account
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Create a strong password and configure security settings for your account.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password *
          </label>
          <div className="relative">
            <FiLock className="absolute left-3 top-3 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              {...methods.register("password", { required: true })}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {password && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      passwordStrength <= 1
                        ? "bg-red-500"
                        : passwordStrength <= 2
                        ? "bg-yellow-500"
                        : passwordStrength <= 3
                        ? "bg-blue-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${(passwordStrength / 4) * 100}%` }}
                  />
                </div>
                <span className="ml-3 text-sm text-gray-600">
                  {passwordStrength <= 1
                    ? "Weak"
                    : passwordStrength <= 2
                    ? "Fair"
                    : passwordStrength <= 3
                    ? "Good"
                    : "Strong"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {PASSWORD_REQUIREMENTS.map((req) => {
                  const isMet = metRequirements.some(met => met.key === req.key);
                  return (
                    <div key={req.key} className="flex items-center text-sm">
                      {isMet ? (
                        <FiCheck className="text-green-500 mr-2" />
                      ) : (
                        <FiX className="text-red-500 mr-2" />
                      )}
                      <span className={isMet ? "text-green-600" : "text-gray-500"}>
                        {req.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm Password *
          </label>
          <div className="relative">
            <FiLock className="absolute left-3 top-3 text-gray-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              {...methods.register("confirm_password", { required: true })}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
            {methods.watch("confirm_password") && 
             methods.watch("confirm_password") === methods.watch("password") && (
              <FiCheckCircle className="absolute right-10 top-3 text-green-500" />
            )}
          </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200">
          <div className="flex items-start">
            <input
              type="checkbox"
              {...methods.register("enable_mfa")}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
              id="mfa-checkbox"
            />
            <div className="ml-3">
              <label htmlFor="mfa-checkbox" className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                Enable Multi-Factor Authentication (Recommended)
              </label>
              <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1">
                Add an extra layer of security to your account. You'll set this up after registration.
              </p>
            </div>
            <FiShield className="text-indigo-600 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 5: Profile Completion
interface Step5Props {
  methods: any;
  profilePreview: string | null;
  setProfilePreview: (preview: string | null) => void;
}

export const Step5ProfileCompletion: React.FC<Step5Props> = ({
  methods,
  profilePreview,
  setProfilePreview,
}) => {
  const handleProfileImageUpload = (file: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Complete Your Profile
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Add a profile picture and finalize your account preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Picture */}
        <div className="text-center">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Profile Picture (Optional)
          </label>
          
          <div className="flex flex-col items-center">
            {profilePreview ? (
              <div className="relative">
                <img
                  src={profilePreview}
                  alt="Profile preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setProfilePreview(null);
                    methods.setValue("profile_picture", null);
                  }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <FiX size={16} />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <FiUser size={40} className="text-gray-400" />
              </div>
            )}
            
            <input
              type="file"
              {...methods.register("profile_picture", {
                onChange: (e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProfileImageUpload(file);
                },
              })}
              accept="image/*"
              className="hidden"
              id="profile-upload"
            />
            
            <label
              htmlFor="profile-upload"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
            >
              <FiImage className="mr-2" />
              {profilePreview ? "Change Picture" : "Add Picture"}
            </label>
            
            <p className="text-xs text-gray-500 mt-2">
              Recommended: 400x400px, max 5MB (JPG, PNG)
            </p>
          </div>
        </div>

        {/* Account Summary */}
        <div className="bg-gray-50 dark:bg-gray-900/20 p-6 rounded-xl border border-gray-200">
          <h3 className="font-medium text-gray-800 dark:text-white mb-4">Account Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Name:</p>
              <p className="font-medium">{methods.watch("first_name")} {methods.watch("last_name")}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Email:</p>
              <p className="font-medium">{methods.watch("email")}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Phone:</p>
              <p className="font-medium">{methods.watch("phone_number")}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Ghana Card:</p>
              <p className="font-medium">{methods.watch("ghana_card_number")}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Account Type:</p>
              <p className="font-medium">Client User</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">MFA:</p>
              <p className="font-medium">{methods.watch("enable_mfa") ? "Enabled" : "Disabled"}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200">
          <div className="flex items-center">
            <FiCheckCircle className="text-green-600 mr-3" />
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200">Almost Done!</h4>
              <p className="text-sm text-green-600 dark:text-green-300">
                Your account is ready to be created. Click "Next" to proceed to verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 6: Verification
interface Step6Props {
  methods: any;
  emailVerificationSent: boolean;
  phoneVerificationSent: boolean;
  emailOTP: string;
  setEmailOTP: (otp: string) => void;
  phoneOTP: string;
  setPhoneOTP: (otp: string) => void;
  onSendEmailOTP: () => void;
  onSendPhoneOTP: () => void;
  onVerifyEmailOTP: () => void;
  onVerifyPhoneOTP: () => void;
  onFinalSubmit: () => void;
  isLoading: boolean;
  isVerifyingEmail: boolean;
  isVerifyingPhone: boolean;
  isSendingEmailOTP: boolean;
  isSendingPhoneOTP: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  emailOtpExpiry?: number;
  phoneOtpExpiry?: number;
}

export const Step6Verification: React.FC<Step6Props> = ({
  methods,
  emailVerificationSent,
  phoneVerificationSent,
  emailOTP,
  setEmailOTP,
  phoneOTP,
  setPhoneOTP,
  onSendEmailOTP,
  onSendPhoneOTP,
  onVerifyEmailOTP,
  onVerifyPhoneOTP,
  onFinalSubmit,
  isLoading,
  isVerifyingEmail,
  isVerifyingPhone,
  isSendingEmailOTP,
  isSendingPhoneOTP,
  emailVerified,
  phoneVerified,
  emailOtpExpiry,
  phoneOtpExpiry,
}) => {
  const [emailTimeLeft, setEmailTimeLeft] = React.useState(0);
  const [phoneTimeLeft, setPhoneTimeLeft] = React.useState(0);

  // Timer effects for OTP expiry
  React.useEffect(() => {
    if (emailOtpExpiry && emailOtpExpiry > 0) {
      setEmailTimeLeft(emailOtpExpiry);
      const timer = setInterval(() => {
        setEmailTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [emailOtpExpiry]);

  React.useEffect(() => {
    if (phoneOtpExpiry && phoneOtpExpiry > 0) {
      setPhoneTimeLeft(phoneOtpExpiry);
      const timer = setInterval(() => {
        setPhoneTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phoneOtpExpiry]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Currently only email verification required (phone verification ready but disabled due to budget)
  // When budget allows, change this to: emailVerified && phoneVerified
  const bothVerified = emailVerified; // && phoneVerified;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Verify Your Account
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Complete the final verification steps to activate your account.
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Verification */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center mb-4">
            <FiMail className="text-blue-600 mr-3" />
            <h3 className="font-medium text-blue-800 dark:text-blue-200">
              Email Verification
            </h3>
            {emailVerified && (
              <FiCheckCircle className="text-green-600 ml-auto" />
            )}
          </div>
          
          {!emailVerificationSent ? (
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-300 mb-4">
                Verify your email address: {methods.watch("email")}
              </p>
              <button
                onClick={onSendEmailOTP}
                disabled={isSendingEmailOTP}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isSendingEmailOTP ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Sending Verification Code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </div>
          ) : emailVerified ? (
            <div className="text-center">
              <FiCheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
              <p className="text-green-600 font-medium">Email Verified Successfully!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Enter the 6-digit code sent to your email
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={emailOTP}
                  onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-center text-lg font-mono"
                  maxLength={6}
                />
                <button
                  onClick={onVerifyEmailOTP}
                  disabled={emailOTP.length !== 6 || isVerifyingEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifyingEmail ? <FiLoader className="animate-spin" /> : 'Verify'}
                </button>
              </div>
              {emailTimeLeft > 0 && (
                <p className="text-sm text-gray-500">
                  Code expires in: <span className="font-mono">{formatTime(emailTimeLeft)}</span>
                </p>
              )}
              {emailTimeLeft === 0 && (
                <button
                  onClick={onSendEmailOTP}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Resend Code
                </button>
              )}
            </div>
          )}
        </div>

        {/* Phone Verification - TEMPORARILY DISABLED DUE TO BUDGET CONSTRAINTS */}
        {/* 
        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200">
          <div className="flex items-center mb-4">
            <FiPhone className="text-green-600 mr-3" />
            <h3 className="font-medium text-green-800 dark:text-green-200">
              Phone Verification
            </h3>
            {phoneVerified && (
              <FiCheckCircle className="text-green-600 ml-auto" />
            )}
          </div>
          
          {!phoneVerificationSent ? (
            <div>
              <p className="text-sm text-green-600 dark:text-green-300 mb-4">
                Verify your phone number: {methods.watch("phone_number")}
              </p>
              <button
                onClick={onSendPhoneOTP}
                disabled={isSendingPhoneOTP}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isSendingPhoneOTP ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Sending Verification Code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </div>
          ) : phoneVerified ? (
            <div className="text-center">
              <FiCheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
              <p className="text-green-600 font-medium">Phone Verified Successfully!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-green-600 dark:text-green-300">
                Enter the 6-digit code sent to your phone
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={phoneOTP}
                  onChange={(e) => setPhoneOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-center text-lg font-mono"
                  maxLength={6}
                />
                <button
                  onClick={onVerifyPhoneOTP}
                  disabled={phoneOTP.length !== 6 || isVerifyingPhone}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifyingPhone ? <FiLoader className="animate-spin" /> : 'Verify'}
                </button>
              </div>
              {phoneTimeLeft > 0 && (
                <p className="text-sm text-gray-500">
                  Code expires in: <span className="font-mono">{formatTime(phoneTimeLeft)}</span>
                </p>
              )}
              {phoneTimeLeft === 0 && (
                <button
                  onClick={onSendPhoneOTP}
                  className="text-sm text-green-600 hover:text-green-800 underline"
                >
                  Resend Code
                </button>
              )}
            </div>
          )}
        </div>
        */}
        
        {/* Temporary Notice - Phone Verification Disabled */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border border-yellow-200">
          <div className="flex items-center mb-2">
            <FiPhone className="text-yellow-600 mr-3" />
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
              Phone Verification (Temporarily Disabled)
            </h3>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Phone verification is temporarily disabled. Only email verification is required to proceed.
          </p>
        </div>

        {/* Account Creation Step */}
        {bothVerified && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-200">
            <div className="text-center">
              <FiCheckCircle className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2">
                Ready to Create Account
              </h3>
              <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-6">
                All verification steps have been completed. Your account will be created with the provided information.
              </p>
              
              <button
                onClick={onFinalSubmit}
                disabled={isLoading}
                className="w-full py-3 px-6 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="mr-2" />
                    Create My Account
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200">
          <div className="flex items-start">
            <FiShield className="text-yellow-600 mr-3 mt-1" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Security Notice</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Verification codes are valid for 10 minutes. Never share your codes with anyone.
                Our team will never ask for verification codes via phone or email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};