"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "@estimator/store/authStore";
import { useFormStore } from "@estimator/components/store/formStore";
import FormRenderer from "@estimator/components/main/index";
import EstimationModeSelector from "@estimator/components/estimation-mode/EstimationModeSelector";
import QuickEstimateResults from "@estimator/components/estimation-mode/QuickEstimateResults";
import UserInfoForm from "@estimator/components/estimation-mode/UserInfoForm";
import TierSelector from "@estimator/components/estimation-mode/TierSelector";
import type { FormConfig } from "@estimator/components/utils/types";
import type { DataSize } from "@estimator/components/estimation-mode/EstimationModeSelector";
import { getTierEstimates, saveEstimation } from "@estimator/lib/api";
import { userService } from "@/api/services/user.service";
import { getUserEmail } from "@/utils/sessionStorage";
import type { UserProfile } from "@/types/models/user";
import formConfig from "@estimator/components/metadata/form.json";
import styles from "./HomeClient.module.css";

type EstimationMode = "quick" | "detailed" | null;

interface UserInfo {
  name: string;
  email: string;
  designation: string;
  company: string;
}

interface QuickEstimate {
  dataSize: DataSize;
  estimatedWeeks: { min: number; max: number };
  estimatedCost: { min: number; max: number };
  breakdown: {
    planning: string;
    migration: string;
    testing: string;
    deployment: string;
  };
  keyConsiderations: string[];
}

const mapMicrositeProfileToUserInfo = (profile: UserProfile): UserInfo => ({
  name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.user_email,
  email: profile.user_email,
  designation: profile.job_function || "",
  company: profile.company || "",
});

export default function HomeClient() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [estimationMode, setEstimationMode] = useState<EstimationMode>(null);
  const [quickEstimate, setQuickEstimate] = useState<QuickEstimate | null>(null);
  const [quickEstimationId, setQuickEstimationId] = useState<string | null>(null);
  const [tierEstimatesData, setTierEstimatesData] = useState<any>(null);
  const [showUserInfoForm, setShowUserInfoForm] = useState(false);
  const [showTierSelector, setShowTierSelector] = useState(false);
  const [pendingMode, setPendingMode] = useState<"quick" | "detailed" | null>(null);
  const [pendingDataSize, setPendingDataSize] = useState<DataSize | null>(null);
  const [pendingDetailedSubmit, setPendingDetailedSubmit] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [guestVerificationToken, setGuestVerificationToken] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("");
  const [showClientNameError, setShowClientNameError] = useState(false);
  const config = formConfig as FormConfig;
  const prevAuthRef = useRef(isAuthenticated);

  // Load tier estimates from API on mount
  useEffect(() => {
    const loadTierEstimates = async () => {
      try {
        const data = await getTierEstimates();
        setTierEstimatesData(data);
      } catch (error) {
        console.error("Failed to load tier estimates, using defaults:", error);
        // Will fall back to hardcoded estimates
      }
    };
    loadTierEstimates();
  }, []);

  // Clear admin access flag when landing on home page
  useEffect(() => {
    sessionStorage.removeItem("admin_access_allowed");

    // Prevent back button from navigating to admin
    const preventBackToAdmin = () => {
      // If user tries to navigate back from home, push forward to stay on home
      if (window.location.pathname === "/estimator" || window.location.pathname === "") {
        console.log("Back button pressed on home - staying on home");
        window.history.pushState(null, "", "/estimator");
      }
    };

    // Add state entry when landing on home
    window.history.pushState(null, "", "/estimator");
    window.addEventListener("popstate", preventBackToAdmin);

    return () => {
      window.removeEventListener("popstate", preventBackToAdmin);
    };
  }, []);

  // Reset to home when user logs in or logs out (to prevent state persistence)
  useEffect(() => {
    const wasAuthenticated = prevAuthRef.current;
    const isNowAuthenticated = isAuthenticated;
    
    // User just logged in (auth changed from false to true)
    if (!wasAuthenticated && isNowAuthenticated && (estimationMode || showUserInfoForm || showTierSelector)) {
      console.log("User just logged in - resetting estimation state");
      setEstimationMode(null);
      setQuickEstimate(null);
      setQuickEstimationId(null);
      setShowUserInfoForm(false);
      setShowTierSelector(false);
      setPendingMode(null);
      setUserInfo(null);
      setGuestVerificationToken(null);
      setClientName("");
    }
    
    // User just logged out (auth changed from true to false)
    if (wasAuthenticated && !isNowAuthenticated && (estimationMode || showUserInfoForm || showTierSelector)) {
      console.log("User just logged out - resetting estimation state");
      setEstimationMode(null);
      setQuickEstimate(null);
      setQuickEstimationId(null);
      setShowUserInfoForm(false);
      setShowTierSelector(false);
      setPendingMode(null);
      setUserInfo(null);
      setGuestVerificationToken(null);
      setClientName("");
    }
    
    // Update ref for next render
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, estimationMode, showUserInfoForm, showTierSelector]);

  const generateQuickEstimate = (dataSize: DataSize): QuickEstimate => {
    // Use API data if available, otherwise fall back to hardcoded estimates
    if (tierEstimatesData?.tiers?.[dataSize]) {
      const tierData = tierEstimatesData.tiers[dataSize];
      return {
        dataSize,
        estimatedWeeks: tierData.estimated_weeks,
        estimatedCost: tierData.estimated_cost,
        breakdown: tierData.breakdown,
        keyConsiderations: tierData.key_considerations,
      };
    }

    // Fallback hardcoded estimates (in case API fails)
    const estimates = {
      simple: {
        estimatedWeeks: { min: 1, max: 2 },
        estimatedCost: { min: 10000, max: 15000 },
        breakdown: {
          planning: "1-2 days",
          migration: "2-5 days",
          testing: "1-2 days",
          deployment: "1 day",
        },
        keyConsiderations: [
          "Single environment migration typically takes 5-10 days",
          "Estimated cost includes planning, migration tooling, and initial support",
          "Timeline assumes straightforward schema with minimal transformations",
          "Additional time may be needed for complex application refactoring",
          "Reverse sync and change streams may extend timeline by 5-10 days",
          "Supports up to 50 collections across up to 10 databases",
          "Estimate is for up to 3 environments",
        ],
      },
      medium: {
        estimatedWeeks: { min: 2, max: 4 },
        estimatedCost: { min: 20000, max: 30000 },
        breakdown: {
          planning: "2-4 days",
          migration: "5-10 days",
          testing: "2-4 days",
          deployment: "1-2 days",
        },
        keyConsiderations: [
          "Multiple environments with moderate data typically take 10-20 days",
          "Cost includes comprehensive planning, migration execution, and extended support",
          "Timeline accounts for moderate schema complexity and data transformations",
          "Performance tuning and optimization may add 5-10 days",
          "Parallel environment migrations can reduce overall timeline",
          "Supports up to 50 collections across up to 10 databases",
          "Estimate is for up to 3 environments",
        ],
      },
      complex: {
        estimatedWeeks: { min: 4, max: 12 },
        estimatedCost: { min: 35000, max: 100000 },
        breakdown: {
          planning: "3-8 days",
          migration: "10-40 days",
          testing: "4-8 days",
          deployment: "3-4 days",
        },
        keyConsiderations: [
          "Large-scale migrations (>2TB) typically require 20-60 days",
          "Cost includes detailed architecture review, phased migration, and ongoing support",
          "Timeline accounts for complex schemas, extensive testing, and gradual rollout",
          "Multiple iterations of performance optimization are typically needed",
          "High availability requirements may extend timeline by 10-20 days",
          "Dedicated migration team recommended for projects of this scale",
          "Supports up to 50 collections across up to 10 databases",
          "Estimate is for up to 3 environments",
        ],
      },
    };

    return {
      dataSize,
      ...estimates[dataSize],
    };
  };

  const handleModeSelected = (mode: "quick" | "detailed") => {
    if (!clientName.trim()) {
      setShowClientNameError(true);
      return;
    }
    setShowClientNameError(false);

    void (async () => {
      if (mode === "quick") {
        setShowTierSelector(true);
        return;
      }

      const resolvedUserInfo = await ensureEstimatorUserInfo();
      if (!resolvedUserInfo && !isAuthenticated) {
        setPendingMode("detailed");
        setPendingDetailedSubmit(false);
        setShowUserInfoForm(true);
        return;
      }

      setEstimationMode("detailed");
    })();
  };

  const ensureEstimatorUserInfo = async (): Promise<UserInfo | null> => {
    if (userInfo) {
      return userInfo;
    }

    if (!isAuthenticated) {
      return null;
    }

    try {
      const profile = await userService.getProfile();
      const resolvedUserInfo = mapMicrositeProfileToUserInfo(profile);
      setUserInfo(resolvedUserInfo);
      setGuestVerificationToken(null);
      return resolvedUserInfo;
    } catch (error) {
      console.error("Failed to load microsite profile for estimator:", error);
      const email = getUserEmail();
      if (!email) {
        return null;
      }

      const fallbackUserInfo = {
        name: email,
        email,
        designation: "",
        company: "",
      };
      setUserInfo(fallbackUserInfo);
      setGuestVerificationToken(null);
      return fallbackUserInfo;
    }
  };

  const handleUserInfoSubmit = async (info: UserInfo, verificationToken?: string) => {
    setUserInfo(info);
    setGuestVerificationToken(verificationToken || null);
    setShowUserInfoForm(false);

    if (pendingMode === "quick") {
      // Reveal quick estimate results and save to DB
      setEstimationMode("quick");
      setPendingMode(null);
      const dataSize = pendingDataSize!;
      setPendingDataSize(null);
      const estimate = quickEstimate!;
      try {
        const timestamp = new Date().toLocaleString();
        const savedEstimation = await saveEstimation({
          name: `Quick Estimate - ${dataSize} - ${timestamp}`,
          estimation_type: "quick",
          quick_estimate_data: estimate,
          client_name: clientName || undefined,
          user_name: info.name,
          user_email: info.email,
          user_designation: info.designation,
          user_company: info.company,
          guest_verification_token: verificationToken,
        });
        setQuickEstimationId(savedEstimation._id);
      } catch (error) {
        console.error("Failed to save quick estimation:", error);
      }
    } else if (pendingMode === "detailed") {
      setPendingMode(null);
      if (pendingDetailedSubmit) {
        // User already filled the detailed form; resume and auto-submit it.
        setPendingDetailedSubmit(true);
      } else {
        // User came from the mode-selection screen; now enter detailed estimation.
        setPendingDetailedSubmit(false);
        setEstimationMode("detailed");
      }
    }
  };

  const handleUserInfoCancel = () => {
    setShowUserInfoForm(false);
    setPendingMode(null);
    setPendingDataSize(null);
    setPendingDetailedSubmit(false);
    setGuestVerificationToken(null);
  };

  const handleTierSelected = async (dataSize: DataSize) => {
    const estimate = generateQuickEstimate(dataSize);
    setQuickEstimate(estimate);
    setShowTierSelector(false);

    const resolvedUserInfo = await ensureEstimatorUserInfo();

    if (!resolvedUserInfo && !isAuthenticated) {
      // Collect estimator-specific client details before revealing results.
      setPendingDataSize(dataSize);
      setPendingMode("quick");
      setShowUserInfoForm(true);
    } else {
      // Use microsite profile info for logged-in users or previously entered guest info.
      setEstimationMode("quick");
      try {
        const timestamp = new Date().toLocaleString();
        const savedEstimation = await saveEstimation({
          name: `Quick Estimate - ${dataSize} - ${timestamp}`,
          estimation_type: "quick",
          quick_estimate_data: estimate,
          client_name: clientName || undefined,
          user_name: resolvedUserInfo?.name,
          user_email: resolvedUserInfo?.email,
          user_designation: resolvedUserInfo?.designation,
          user_company: resolvedUserInfo?.company,
          guest_verification_token: guestVerificationToken || undefined,
        });
        setQuickEstimationId(savedEstimation._id);
        console.log("Quick estimation saved to database with ID:", savedEstimation._id);
      } catch (error) {
        console.error("Failed to save quick estimation:", error);
      }
    }
  };

  const handleTierCancel = () => {
    setShowTierSelector(false);
    setPendingMode(null);
    setPendingDataSize(null);
    setUserInfo(null);
    setGuestVerificationToken(null);
    setQuickEstimationId(null);
  };

  const handleResetEstimation = () => {
    setEstimationMode(null);
    setQuickEstimate(null);
    setQuickEstimationId(null);
    setUserInfo(null);
    setPendingMode(null);
    setPendingDataSize(null);
    setPendingDetailedSubmit(false);
    setShowTierSelector(false);
    setClientName("");
    setGuestVerificationToken(null);
  };

  // Export userInfo for use in FormRenderer
  const getUserInfoForSaving = () => {
    return userInfo || {};
  };

  // Show user info form if needed
  if (showUserInfoForm && pendingMode) {
    return (
      <div className={styles.pageOffset}>
        <UserInfoForm
          onSubmit={handleUserInfoSubmit}
          onCancel={handleUserInfoCancel}
          mode={pendingMode}
        />
      </div>
    );
  }

  // Show tier selector for quick estimate (after user info)
  if (showTierSelector) {
    return (
      <div className={styles.pageOffset}>
        <TierSelector
          onTierSelected={handleTierSelected}
          onCancel={handleTierCancel}
        />
      </div>
    );
  }

  // Show mode selector if no mode is selected yet
  if (!estimationMode) {
    return (
      <div className={styles.pageOffset}>
        <EstimationModeSelector 
          onModeSelected={handleModeSelected}
          clientName={clientName}
          onClientNameChange={(name) => {
            setClientName(name);
            if (showClientNameError && name.trim()) {
              setShowClientNameError(false);
            }
          }}
          showError={showClientNameError}
        />
      </div>
    );
  }

  // Show quick estimate results
  if (estimationMode === "quick" && quickEstimate) {
    return (
      <div className={styles.pageOffset}>
        <QuickEstimateResults
          estimate={quickEstimate}
          onStartDetailedEstimate={() => {
            void (async () => {
              const resolvedUserInfo = await ensureEstimatorUserInfo();
              if (!resolvedUserInfo && !isAuthenticated) {
                setPendingMode("detailed");
                setShowUserInfoForm(true);
                return;
              }
              setEstimationMode("detailed");
            })();
          }}
          onReset={() => {
            handleResetEstimation();
            navigate("/estimator");
          }}
        />
      </div>
    );
  }

  // Show detailed form
  return (
    <div className={styles.pageOffset}>
      {/* Keep only local back navigation; auth stays in microsite navbar */}
      <div className={styles.headerContainer}>
        <button
          onClick={() => {
            const hasAnswers = Object.keys(useFormStore.getState().answers).length > 0;
            const isFormInProgress = !useFormStore.getState().submitted && hasAnswers;

            if (isFormInProgress) {
              const confirmed = window.confirm(
                "You have unsaved progress. All your answers will be lost if you go back. Are you sure you want to continue?"
              );
              if (!confirmed) {
                return;
              }
            }
            handleResetEstimation();
            navigate("/estimator");
          }}
          className={styles.backToHomeButton}
        >
          ← Back to Home
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.mainContainer}>
        <FormRenderer
          config={config}
          userInfo={getUserInfoForSaving()}
          clientName={clientName}
          quickEstimationId={quickEstimationId}
          guestVerificationToken={guestVerificationToken}
          requireUserInfo={!isAuthenticated && !userInfo}
          onNeedUserInfo={() => {
            setPendingMode("detailed");
            setShowUserInfoForm(true);
          }}
          triggerSubmit={pendingDetailedSubmit}
        />
      </div>
    </div>
  );
}
