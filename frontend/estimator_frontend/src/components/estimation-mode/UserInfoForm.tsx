"use client";

import { useEffect, useState, type FormEvent } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

import { sendGuestEmailOtp, verifyGuestEmailOtp } from "@estimator/lib/api";
import styles from "./UserInfoForm.module.css";

interface UserInfo {
  name: string;
  email: string;
  designation: string;
  phone: string;
  company: string;
}

interface UserInfoFormProps {
  onSubmit: (userInfo: UserInfo, guestVerificationToken?: string) => void;
  onCancel: () => void;
  mode: "quick" | "detailed";
}

export default function UserInfoForm({ onSubmit, onCancel, mode }: UserInfoFormProps) {
  const jobFunctionOptions = [
    "IT Executive (CIO, CTO, VP Engineering, etc.)",
    "Business Executive (CEO, COO, CMO, etc.)",
    "Architect",
    "Business Development / Alliance Manager",
    "DBA",
    "Technical Operations",
    "Director / Development Manager",
    "Product / Project Manager",
    "Software Developer / Engineer",
    "Business Analyst",
    "Data Scientist",
    "Student",
    "Other",
  ];

  const [formData, setFormData] = useState<UserInfo>({
    name: "",
    email: "",
    designation: "",
    phone: "",
    company: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UserInfo, string>>>({});
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setResendCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendCooldown]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof UserInfo, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.designation.trim()) {
      newErrors.designation = "Designation is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhoneNumber(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.company.trim()) {
      newErrors.company = "Company name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof UserInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    if (field === "email" && otpSent) {
      setOtpSent(false);
      setOtpCode("");
      setOtpError("");
      setOtpMessage("");
      setResendCooldown(0);
    }
  };

  const handleDetailsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSendingOtp(true);
    setOtpError("");
    setOtpMessage("");

    try {
      const response = await sendGuestEmailOtp(formData.email, formData.name);
      setOtpSent(true);
      setOtpCode("");
      setOtpMessage(response.message);
      setResendCooldown(response.resend_cooldown_seconds);
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : "Failed to send OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalizedOtp = otpCode.replace(/\D/g, "");
    if (normalizedOtp.length !== 6) {
      setOtpError("Please enter the 6-digit OTP sent to your email.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError("");

    try {
      const response = await verifyGuestEmailOtp(formData.email, normalizedOtp);
      onSubmit(formData, response.verification_token);
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : "Failed to verify OTP.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSendingOtp) {
      return;
    }

    setIsSendingOtp(true);
    setOtpError("");
    setOtpMessage("");

    try {
      const response = await sendGuestEmailOtp(formData.email, formData.name);
      setOtpMessage(response.message);
      setResendCooldown(response.resend_cooldown_seconds);
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : "Failed to resend OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Before We Begin</h2>
          <p className={styles.subtitle}>
            {otpSent
              ? `Enter the OTP we sent to ${formData.email} to continue with your ${mode} estimation.`
              : `Please provide your details to ${mode === "quick" ? "get a quick estimate" : "start the detailed estimation"}.`}
          </p>
        </div>

        {!otpSent ? (
          <form onSubmit={handleDetailsSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                Full Name <span className={styles.required}>*</span>
              </label>
              <input
                id="name"
                type="text"
                className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="John Doe"
              />
              {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address <span className={styles.required}>*</span>
              </label>
              <input
                id="email"
                type="email"
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="john.doe@company.com"
              />
              {errors.email && <span className={styles.errorText}>{errors.email}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="designation" className={styles.label}>
                Designation <span className={styles.required}>*</span>
              </label>
              <select
                id="designation"
                className={`${styles.input} ${errors.designation ? styles.inputError : ""}`}
                value={formData.designation}
                onChange={(e) => handleChange("designation", e.target.value)}
              >
                <option value="">Select job function</option>
                {jobFunctionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.designation && <span className={styles.errorText}>{errors.designation}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone" className={styles.label}>
                Phone Number <span className={styles.required}>*</span>
              </label>
              <PhoneInput
                id="phone"
                international
                className={styles.phoneInputWrapper}
                value={formData.phone}
                onChange={(value) => handleChange("phone", value || "")}
                placeholder="Enter phone number"
                numberInputProps={{
                  className: `${styles.input} ${errors.phone ? styles.inputError : ""}`,
                  autoComplete: "tel",
                }}
              />
              {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="company" className={styles.label}>
                Company Name <span className={styles.required}>*</span>
              </label>
              <input
                id="company"
                type="text"
                className={`${styles.input} ${errors.company ? styles.inputError : ""}`}
                value={formData.company}
                onChange={(e) => handleChange("company", e.target.value)}
                placeholder="Acme Corporation"
              />
              {errors.company && <span className={styles.errorText}>{errors.company}</span>}
            </div>

            <div className={styles.actions}>
              <button type="button" onClick={onCancel} className={styles.cancelButton}>
                Cancel
              </button>
              <button type="submit" className={styles.submitButton} disabled={isSendingOtp}>
                {isSendingOtp ? "Sending OTP..." : "Continue to Verification"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className={styles.form}>
            <div className={styles.summaryCard}>
              <div><strong>Name:</strong> {formData.name}</div>
              <div><strong>Email:</strong> {formData.email}</div>
              <div><strong>Designation:</strong> {formData.designation}</div>
              <div><strong>Phone:</strong> {formData.phone}</div>
              <div><strong>Company:</strong> {formData.company}</div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="otp" className={styles.label}>
                Email OTP <span className={styles.required}>*</span>
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                className={`${styles.input} ${otpError ? styles.inputError : ""}`}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, ""));
                  if (otpError) {
                    setOtpError("");
                  }
                }}
                placeholder="Enter 6-digit OTP"
              />
              {otpMessage && <span className={styles.infoText}>{otpMessage}</span>}
              {otpError && <span className={styles.errorText}>{otpError}</span>}
            </div>

            <div className={styles.secondaryActions}>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => setOtpSent(false)}
              >
                Edit details
              </button>
              <button
                type="button"
                className={styles.linkButton}
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isSendingOtp}
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : (isSendingOtp ? "Sending..." : "Resend OTP")}
              </button>
            </div>

            <div className={styles.actions}>
              <button type="button" onClick={onCancel} className={styles.cancelButton}>
                Cancel
              </button>
              <button type="submit" className={styles.submitButton} disabled={isVerifyingOtp}>
                {isVerifyingOtp ? "Verifying..." : "Verify and Continue"}
              </button>
            </div>
          </form>
        )}

        <p className={styles.privacyNote}>
          Your information is secure and will only be used for providing migration estimation services.
        </p>
      </div>
    </div>
  );
}
