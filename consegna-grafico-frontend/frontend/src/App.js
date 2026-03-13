import { useDeferredValue, useState, useEffect, useCallback, useMemo } from "react";
import { HashRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { ThemeProvider } from "next-themes";
import {
  Smartphone, CheckCircle,
  MessageSquare, Users, Bell, Copy,
  Settings, CreditCard, Zap, Shield, ShieldAlert,
  Check, Inbox,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/app/Navbar";
import { DashboardAccountTab } from "@/components/dashboard/DashboardAccountTab";
import { DashboardAdminTab } from "@/components/dashboard/DashboardAdminTab";
import { DashboardDelegatesTab } from "@/components/dashboard/DashboardDelegatesTab";
import { DashboardInboxTab } from "@/components/dashboard/DashboardInboxTab";
import { DashboardSettingsTab } from "@/components/dashboard/DashboardSettingsTab";
import { DashboardUpgradeTab } from "@/components/dashboard/DashboardUpgradeTab";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { API, http } from "@/lib/api";
import {
  FALLBACK_PLAN_CATALOG,
  PLAN_RANK,
  INBOX_FILTER_STORAGE_KEY,
  getApiErrorMessage,
  getPricingPlanPresentation,
  getPublicPlanLabel,
  isPasskeySupported,
  credentialToJson,
  normalizePlanKey,
  normalizePublicKeyCreationOptions,
  parseEncryptedEnvelope,
  withAsyncTimeout,
} from "@/lib/app-shared";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { PaymentSuccessPage } from "@/pages/PaymentSuccessPage";
import { RegisterPage } from "@/pages/RegisterPage";
import {
  createAndStoreVault,
  decryptJsonEnvelope,
  encryptJsonPayload,
  getStoredVault,
  hasStoredVault,
  unlockStoredVault,
} from "@/lib/e2ee";
import { generateTotpCode, normalizeBase32Secret, parseOtpAuthUrl } from "@/lib/totp";

const normalizeDashboardTab = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "messages") return "inbox";
  return ["inbox", "account", "delegates", "settings", "upgrade", "admin"].includes(normalized) ? normalized : null;
};

const DashboardPage = ({ user, token, apiRequest, onLogout }) => {
  const INBOX_OTP_FILTER_STORAGE_KEY = "heirline_inbox_otp_only";
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => normalizeDashboardTab(searchParams.get("tab")) || "inbox");
  const requestedTab = normalizeDashboardTab(searchParams.get("tab"));
  const [catalogPlans, setCatalogPlans] = useState(FALLBACK_PLAN_CATALOG);
  const [stats, setStats] = useState(null);
  const [messages, setMessages] = useState([]);
  const [authSessions, setAuthSessions] = useState([]);
  const [e2eeStatus, setE2eeStatus] = useState(null);
  const [e2eePrivateKey, setE2eePrivateKey] = useState(null);
  const [e2eePublicKey, setE2eePublicKey] = useState(null);
  const [e2eePassphrase, setE2eePassphrase] = useState("");
  const [e2eeBusy, setE2eeBusy] = useState(false);
  const [messageDecryptions, setMessageDecryptions] = useState({});
  const [messageDecrypting, setMessageDecrypting] = useState(false);
  const [delegateDecryptions, setDelegateDecryptions] = useState({});
  const [passkeys, setPasskeys] = useState([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(false);
  const [passkeyLabel, setPasskeyLabel] = useState("");
  const [registeringPasskey, setRegisteringPasskey] = useState(false);
  const [deletingPasskeyId, setDeletingPasskeyId] = useState(null);
  const [hasLocalVaultState, setHasLocalVaultState] = useState(() => hasStoredVault());
  const [inboxSourceFilter, setInboxSourceFilter] = useState(() => {
    const saved = localStorage.getItem(INBOX_FILTER_STORAGE_KEY);
    return ["all", "sms", "voice", "email"].includes(saved) ? saved : "all";
  });
  const [inboxOtpOnly, setInboxOtpOnly] = useState(() => localStorage.getItem(INBOX_OTP_FILTER_STORAGE_KEY) === "true");
  const [emailAliases, setEmailAliases] = useState([]);
  const [creatingAlias, setCreatingAlias] = useState(false);
  const [loadingAliases, setLoadingAliases] = useState(false);
  const [secureNotes, setSecureNotes] = useState([]);
  const [loadingSecureNotes, setLoadingSecureNotes] = useState(false);
  const [secureNoteDecryptions, setSecureNoteDecryptions] = useState({});
  const [savingSecureNote, setSavingSecureNote] = useState(false);
  const [deletingSecureNoteId, setDeletingSecureNoteId] = useState(null);
  const [secureNoteForm, setSecureNoteForm] = useState({
    id: null,
    title: "",
    body: "",
  });
  const [totpEntries, setTotpEntries] = useState([]);
  const [totpPayloads, setTotpPayloads] = useState({});
  const [totpCodes, setTotpCodes] = useState([]);
  const [loadingTotpCodes, setLoadingTotpCodes] = useState(false);
  const [savingTotp, setSavingTotp] = useState(false);
  const [deletingTotpId, setDeletingTotpId] = useState(null);
  const [totpForm, setTotpForm] = useState({
    otpauth_url: "",
    label: "",
    issuer: "",
    account_name: "",
    secret_base32: "",
    digits: 6,
    period_seconds: 30,
    algorithm: "SHA1",
  });
  const [otpPolicy, setOtpPolicy] = useState({
    ttl_seconds: 300,
    auto_delete: false,
    whitelist_enabled: false,
    whitelist_mode: "off",
    whitelist_bypass_until: null,
    mask_otp: false,
  });
  const [savingOtpPolicy, setSavingOtpPolicy] = useState(false);
  const [trustedSenders, setTrustedSenders] = useState([]);
  const [loadingTrustedSenders, setLoadingTrustedSenders] = useState(false);
  const [savingTrustedSender, setSavingTrustedSender] = useState(false);
  const [removingTrustedSenderId, setRemovingTrustedSenderId] = useState(null);
  const [trustedSenderForm, setTrustedSenderForm] = useState({ sender_id: "", sender_name: "" });
  const [sharedAccessOwned, setSharedAccessOwned] = useState([]);
  const [sharedAccessReceived, setSharedAccessReceived] = useState([]);
  const [sharedInboxMessages, setSharedInboxMessages] = useState([]);
  const [loadingSharedInbox, setLoadingSharedInbox] = useState(false);
  const [savingSharedAccess, setSavingSharedAccess] = useState(false);
  const [revokingSharedAccessId, setRevokingSharedAccessId] = useState(null);
  const [sharedAccessForm, setSharedAccessForm] = useState({ viewer_email: "" });
  const [otpAccessLogs, setOtpAccessLogs] = useState([]);
  const [otpAutofillLogs, setOtpAutofillLogs] = useState([]);
  const [accountAuditLogs, setAccountAuditLogs] = useState([]);
  const [loadingOtpAccessLogs, setLoadingOtpAccessLogs] = useState(false);
  const [loadingOtpAutofillLogs, setLoadingOtpAutofillLogs] = useState(false);
  const [loadingAccountAuditLogs, setLoadingAccountAuditLogs] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [loadingSecurityAlerts, setLoadingSecurityAlerts] = useState(false);
  const [resolvingAlertId, setResolvingAlertId] = useState(null);
  const [panicPassword, setPanicPassword] = useState("");
  const [panicConfirmDelete, setPanicConfirmDelete] = useState(false);
  const [panicBusy, setPanicBusy] = useState(false);
  const [delegates, setDelegates] = useState([]);
  const [loadingDelegates, setLoadingDelegates] = useState(false);
  const [creatingDelegate, setCreatingDelegate] = useState(false);
  const [removingDelegateId, setRemovingDelegateId] = useState(null);
  const [overridingDelegateId, setOverridingDelegateId] = useState(null);
  const [delegateForm, setDelegateForm] = useState({
    delegate_name: "",
    delegate_email: "",
    delegate_phone: "",
    relationship: "",
    inactivity_days: 90,
  });
  const [delegateStepUpPassword, setDelegateStepUpPassword] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState(null);
  const [aliasForm, setAliasForm] = useState({ service_label: "", alias_local: "" });
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const deferredAdminSearchQuery = useDeferredValue(adminSearchQuery);
  const [adminSearchResults, setAdminSearchResults] = useState([]);
  const [searchingAdminUsers, setSearchingAdminUsers] = useState(false);
  const [selectedAdminUserId, setSelectedAdminUserId] = useState(null);
  const [adminUserProfile, setAdminUserProfile] = useState(null);
  const [loadingAdminUserProfile, setLoadingAdminUserProfile] = useState(false);
  const [adminPlanDraft, setAdminPlanDraft] = useState("silver");
  const [adminBurnerHours, setAdminBurnerHours] = useState(24);
  const [updatingAdminUserPlan, setUpdatingAdminUserPlan] = useState(false);
  const [addingAdminBurnerNumber, setAddingAdminBurnerNumber] = useState(false);
  const [freezingAdminUserId, setFreezingAdminUserId] = useState(null);
  const [realigningAdminUserId, setRealigningAdminUserId] = useState(null);
  const [adminKpiDays, setAdminKpiDays] = useState(14);
  const [adminKpiData, setAdminKpiData] = useState(null);
  const [loadingAdminKpi, setLoadingAdminKpi] = useState(false);
  const [exportingAdminCsv, setExportingAdminCsv] = useState(false);
  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    permission: pushPermission,
    loading: pushLoading,
    error: pushError,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
    sendTestNotification,
  } = usePushNotifications(token);
  const simulatedInboxSource = useMemo(
    () => (["sms", "voice", "email"].includes(inboxSourceFilter) && inboxSourceFilter !== "all" ? inboxSourceFilter : "sms"),
    [inboxSourceFilter],
  );

  const normalizeMessageSource = useCallback((message) => {
    const source = String(message?.source || "").trim().toLowerCase();
    const fromValue = String(message?.from_number || "").trim().toLowerCase();
    const toValue = String(message?.to_number || "").trim().toLowerCase();
    const senderValue = String(message?.sender_name || "").trim().toLowerCase();
    if (fromValue.includes("@") || toValue.includes("@")) return "email";
    if (senderValue.includes("@") && source !== "voice") return "email";
    if (["sms", "voice", "email"].includes(source)) return source;
    return "sms";
  }, []);

  const emailAliasLimit = Number(stats?.limits?.max_email_aliases || stats?.email_aliases_max || 0);
  const canManageEmailAliases = emailAliasLimit > 0;
  const browserSupportsPasskeys = useMemo(() => isPasskeySupported(), []);
  const canUsePasskeys = Boolean(stats?.limits?.passkeys);
  const canUseSecureNotes = Boolean(stats?.limits?.secure_notes);
  const secureNotesLimit = Number(stats?.limits?.max_secure_notes || 0);
  const canUseTotp = Boolean(stats?.limits?.totp);
  const passkeysLimit = Number(stats?.limits?.max_passkeys || stats?.passkeys_max || 0);
  const e2eeEnabled = Boolean(e2eeStatus?.enabled);
  const e2eeUnlocked = Boolean(e2eePrivateKey);
  const e2eeReadyForEncrypt = e2eeEnabled && Boolean(e2eePublicKey) && Boolean(e2eeStatus?.key_id);
  const localVaultKeyId = getStoredVault()?.key_id || null;
  const localVaultAligned = !e2eeEnabled || !localVaultKeyId || localVaultKeyId === e2eeStatus?.key_id;
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";
  const currentPlanKey = normalizePlanKey(stats?.plan || user?.plan);
  const currentPlanRank = PLAN_RANK[currentPlanKey] || 0;
  const isPendingPlan = currentPlanKey === "pending";
  const isDashboardBootstrapping = loading && !stats;
  const isAdminConsole = isAdmin;
  const shouldShowPendingCheckout = isPendingPlan && !isAdminConsole;
  const needsE2eeSetup = !isAdminConsole && !loading && !isPendingPlan && !e2eeEnabled;
  const hasBlindNumberEntitlement = Number(stats?.limits?.max_numbers || 0) > 0;
  const hasRealPrimaryNumber = Boolean(stats?.primary_number && stats?.primary_number_is_real);
  const demoToolsEnabled = Boolean(stats?.runtime?.demo_tools_enabled);
  const sortedCatalogPlans = useMemo(
    () => [...catalogPlans].sort((a, b) => Number(a?.sort_order || 0) - Number(b?.sort_order || 0)),
    [catalogPlans],
  );

  useEffect(() => {
    const defaultTab = isAdmin ? "admin" : "inbox";
    const paramTab = requestedTab === "admin" && !isAdmin ? defaultTab : (requestedTab || defaultTab);
    if (paramTab !== activeTab) {
      setActiveTab(paramTab);
    }
  }, [requestedTab, activeTab, isAdmin]);

  const handleActiveTabChange = useCallback((nextTab) => {
    if (nextTab === "admin" && !isAdmin) {
      return;
    }
    setActiveTab(nextTab);
    const nextParams = new URLSearchParams(searchParams);
    if (nextTab === "inbox") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", nextTab);
    }
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, isAdmin]);

  useEffect(() => {
    let mounted = true;
    http.get(`${API}/plans`).then((res) => {
      if (!mounted) return;
      if (Array.isArray(res.data) && res.data.length > 0) {
        setCatalogPlans(res.data);
      }
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!needsE2eeSetup || requestedTab || activeTab === "settings") {
      return;
    }
    const nextParams = new URLSearchParams();
    nextParams.set("tab", "settings");
    setSearchParams(nextParams, { replace: true });
  }, [needsE2eeSetup, requestedTab, activeTab, setSearchParams]);

  const loadEmailAliases = useCallback(async () => {
    setLoadingAliases(true);
    try {
      const res = await apiRequest({ method: "get", url: `${API}/account/email-aliases` });
      setEmailAliases(res.data.aliases || []);
    } catch {
      setEmailAliases([]);
    } finally {
      setLoadingAliases(false);
    }
  }, [apiRequest]);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await apiRequest({ method: "get", url: `${API}/auth/sessions` });
      setAuthSessions(res.data.sessions || []);
    } catch {
      setAuthSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, [apiRequest]);

  const loadPasskeys = useCallback(async () => {
    setLoadingPasskeys(true);
    try {
      const res = await apiRequest({ method: "get", url: `${API}/account/passkeys` });
      setPasskeys(res.data?.passkeys || []);
    } catch {
      setPasskeys([]);
    } finally {
      setLoadingPasskeys(false);
    }
  }, [apiRequest]);

  const loadSecureNotes = useCallback(async () => {
    if (!stats?.limits?.secure_notes) {
      setSecureNotes([]);
      setLoadingSecureNotes(false);
      return;
    }
    setLoadingSecureNotes(true);
    try {
      const res = await apiRequest({ method: "get", url: `${API}/secure-notes` });
      setSecureNotes(res.data?.notes || []);
    } catch {
      setSecureNotes([]);
    } finally {
      setLoadingSecureNotes(false);
    }
  }, [apiRequest, stats?.limits?.secure_notes]);

  const loadDelegates = useCallback(async () => {
    if (Number(stats?.limits?.max_heirs || 0) <= 0) {
      setDelegates([]);
      return;
    }
    setLoadingDelegates(true);
    try {
      const res = await apiRequest({ method: "get", url: `${API}/account/delegates` });
      setDelegates(res.data?.delegates || []);
    } catch {
      setDelegates([]);
    } finally {
      setLoadingDelegates(false);
    }
  }, [apiRequest, stats?.limits?.max_heirs]);

  const loadTrustedSenders = useCallback(async () => {
    if (!stats?.limits?.whitelist) {
      setTrustedSenders([]);
      return;
    }
    setLoadingTrustedSenders(true);
    try {
      const res = await apiRequest({ method: "get", url: `${API}/senders/whitelist` });
      setTrustedSenders(res.data?.senders || []);
    } catch {
      setTrustedSenders([]);
    } finally {
      setLoadingTrustedSenders(false);
    }
  }, [apiRequest, stats?.limits?.whitelist]);

  const loadSharedAccess = useCallback(async () => {
    if (Number(stats?.limits?.max_shared_members || 0) <= 0) {
      setSharedAccessOwned([]);
      setSharedAccessReceived([]);
      return;
    }
    try {
      const res = await apiRequest({ method: "get", url: `${API}/account/shared-access` });
      setSharedAccessOwned(res.data?.owned_grants || []);
      setSharedAccessReceived(res.data?.received_grants || []);
    } catch {
      setSharedAccessOwned([]);
      setSharedAccessReceived([]);
    }
  }, [apiRequest, stats?.limits?.max_shared_members]);

  const loadSharedInbox = useCallback(async () => {
    if (Number(stats?.limits?.max_shared_members || 0) <= 0) {
      setSharedInboxMessages([]);
      return;
    }
    setLoadingSharedInbox(true);
    try {
      const res = await apiRequest({ method: "get", url: `${API}/shared-inbox?limit=50&offset=0` });
      setSharedInboxMessages(res.data?.messages || []);
    } catch {
      setSharedInboxMessages([]);
    } finally {
      setLoadingSharedInbox(false);
    }
  }, [apiRequest, stats?.limits?.max_shared_members]);

  const loadOtpAccessLogs = useCallback(async () => {
    if (!stats?.limits?.shared_otp_audit) {
      setOtpAccessLogs([]);
      return;
    }
    setLoadingOtpAccessLogs(true);
    try {
      const res = await apiRequest({ method: "get", url: `${API}/account/otp-access-log?limit=20&offset=0` });
      setOtpAccessLogs(res.data?.logs || []);
    } catch {
      setOtpAccessLogs([]);
    } finally {
      setLoadingOtpAccessLogs(false);
    }
  }, [apiRequest, stats?.limits?.shared_otp_audit]);

  const loadOtpAutofillLogs = useCallback(async () => {
    if (!stats?.limits?.shared_otp_audit) {
      setOtpAutofillLogs([]);
      return;
    }
    setLoadingOtpAutofillLogs(true);
    try {
      const res = await apiRequest({ method: "get", url: `${API}/account/otp-autofill-log?limit=20&offset=0` });
      setOtpAutofillLogs(res.data?.logs || []);
    } catch {
      setOtpAutofillLogs([]);
    } finally {
      setLoadingOtpAutofillLogs(false);
    }
  }, [apiRequest, stats?.limits?.shared_otp_audit]);

  const loadAccountAuditLogs = useCallback(async () => {
    if (!stats?.limits?.audit_log) {
      setAccountAuditLogs([]);
      return;
    }
    setLoadingAccountAuditLogs(true);
    try {
      const res = await apiRequest({ method: "get", url: `${API}/account/audit-log?limit=20` });
      setAccountAuditLogs(res.data?.logs || []);
    } catch {
      setAccountAuditLogs([]);
    } finally {
      setLoadingAccountAuditLogs(false);
    }
  }, [apiRequest, stats?.limits?.audit_log]);

  const loadSecurityAlerts = useCallback(async () => {
    if (!isAdmin) {
      setSecurityAlerts([]);
      return;
    }
    setLoadingSecurityAlerts(true);
    try {
      const res = await apiRequest({ method: "get", url: `${API}/security/alerts?status=open&limit=20` });
      setSecurityAlerts(res.data?.alerts || []);
    } catch {
      setSecurityAlerts([]);
    } finally {
      setLoadingSecurityAlerts(false);
    }
  }, [apiRequest, isAdmin]);

  const loadAdminUserProfile = useCallback(async (userId) => {
    if (!isAdmin || !userId) {
      return;
    }
    setSelectedAdminUserId(userId);
    setLoadingAdminUserProfile(true);
    try {
      const res = await apiRequest({ method: "get", url: `${API}/admin/users/${userId}` });
      setAdminUserProfile(res.data || null);
      setAdminPlanDraft(res.data?.user?.plan || "silver");
      setAdminSearchResults((prev) => prev.map((match) => (
        match.id === userId
          ? {
              ...match,
              plan: res.data?.user?.plan || match.plan,
              plan_label: res.data?.user?.plan_label || match.plan_label,
              status: res.data?.user?.status || match.status,
              panic_mode: Boolean(res.data?.user?.panic_mode),
            }
          : match
      )));
    } catch (err) {
      setAdminUserProfile(null);
      toast.error(getApiErrorMessage(err, "Impossibile caricare il profilo utente"));
    } finally {
      setLoadingAdminUserProfile(false);
    }
  }, [apiRequest, isAdmin]);

  const loadAdminKpi = useCallback(async (days = adminKpiDays) => {
    if (!isAdmin) {
      setAdminKpiData(null);
      return;
    }
    setLoadingAdminKpi(true);
    try {
      const res = await apiRequest({ method: "get", url: `${API}/analytics/funnel?days=${days}` });
      setAdminKpiData(res.data || null);
    } catch {
      setAdminKpiData(null);
    } finally {
      setLoadingAdminKpi(false);
    }
  }, [apiRequest, adminKpiDays, isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setAdminSearchResults([]);
      setAdminUserProfile(null);
      setSelectedAdminUserId(null);
      setAdminKpiData(null);
      setSearchingAdminUsers(false);
      return;
    }

    const normalizedQuery = String(deferredAdminSearchQuery || "").trim().toLowerCase();
    if (normalizedQuery.length < 2) {
      setAdminSearchResults([]);
      setSearchingAdminUsers(false);
      return;
    }

    let cancelled = false;
    setSearchingAdminUsers(true);
    apiRequest({ method: "get", url: `${API}/admin/users/search?email=${encodeURIComponent(normalizedQuery)}` })
      .then((res) => {
        if (cancelled) return;
        setAdminSearchResults(res.data?.matches || []);
      })
      .catch(() => {
        if (cancelled) return;
        setAdminSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) {
          setSearchingAdminUsers(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiRequest, deferredAdminSearchQuery, isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    loadAdminKpi(adminKpiDays);
  }, [isAdmin, loadAdminKpi, adminKpiDays]);

  const fetchData = useCallback(async () => {
    try {
      if (isAdmin) {
        const [statsRes, sessionsRes] = await Promise.allSettled([
          withAsyncTimeout(apiRequest({ method: "get", url: `${API}/dashboard/stats` })),
          withAsyncTimeout(apiRequest({ method: "get", url: `${API}/auth/sessions` })),
        ]);

        setStats(statsRes.status === "fulfilled" ? statsRes.value.data : null);
        setAuthSessions(sessionsRes.status === "fulfilled" ? (sessionsRes.value.data?.sessions || []) : []);
        setMessages([]);
        setE2eeStatus({ enabled: false, key_id: null, algorithm: null });
        setHasLocalVaultState(false);
        setEmailAliases([]);
        setSecureNotes([]);
        setDelegates([]);
        setTotpEntries([]);
        setTrustedSenders([]);
        setSharedAccessOwned([]);
        setSharedAccessReceived([]);
        setSharedInboxMessages([]);
        setOtpAccessLogs([]);
        setOtpAutofillLogs([]);
        setAccountAuditLogs([]);
        setPasskeys([]);
        await loadSecurityAlerts();
        return;
      }

      const [statsRes, inboxRes, e2eeRes, sessionsRes] = await Promise.allSettled([
        withAsyncTimeout(apiRequest({ method: "get", url: `${API}/dashboard/stats` })),
        withAsyncTimeout(apiRequest({ method: "get", url: `${API}/inbox` })),
        withAsyncTimeout(apiRequest({ method: "get", url: `${API}/account/e2ee-status` })),
        withAsyncTimeout(apiRequest({ method: "get", url: `${API}/auth/sessions` })),
      ]);

      const statsData = statsRes.status === "fulfilled" ? statsRes.value.data : null;
      setStats(statsData);
      setMessages(inboxRes.status === "fulfilled" ? (inboxRes.value.data?.messages || []) : []);
      setE2eeStatus(e2eeRes.status === "fulfilled" ? e2eeRes.value.data : { enabled: false, key_id: null, algorithm: null });
      setHasLocalVaultState(hasStoredVault());
      setAuthSessions(sessionsRes.status === "fulfilled" ? (sessionsRes.value.data?.sessions || []) : []);

      try {
        const otpPolicyRes = await withAsyncTimeout(apiRequest({ method: "get", url: `${API}/account/otp-policy` }));
        const policyData = otpPolicyRes.data || {};
        setOtpPolicy({
          ttl_seconds: Number(policyData.ttl_seconds || 300),
          auto_delete: Boolean(policyData.auto_delete),
          whitelist_enabled: Boolean(policyData.whitelist_enabled),
          whitelist_mode: policyData.whitelist_mode || (policyData.whitelist_enabled ? "monitor" : "off"),
          whitelist_bypass_until: policyData.whitelist_bypass_until || null,
          mask_otp: Boolean(policyData.mask_otp),
        });
      } catch {
        setOtpPolicy({
          ttl_seconds: 300,
          auto_delete: false,
          whitelist_enabled: false,
          whitelist_mode: "off",
          whitelist_bypass_until: null,
          mask_otp: false,
        });
      }

      if (Number(statsData?.limits?.max_email_aliases || 0) > 0) {
        try {
          const aliasRes = await withAsyncTimeout(apiRequest({ method: "get", url: `${API}/account/email-aliases` }));
          setEmailAliases(aliasRes.data?.aliases || []);
        } catch {
          setEmailAliases([]);
        }
      } else {
        setEmailAliases([]);
      }

      if (statsData?.limits?.secure_notes) {
        setLoadingSecureNotes(true);
        try {
          const notesRes = await withAsyncTimeout(apiRequest({ method: "get", url: `${API}/secure-notes` }));
          setSecureNotes(notesRes.data?.notes || []);
        } catch {
          setSecureNotes([]);
        }
      } else {
        setSecureNotes([]);
      }

      if (Number(statsData?.limits?.max_heirs || 0) > 0) {
        try {
          const delegatesRes = await withAsyncTimeout(apiRequest({ method: "get", url: `${API}/account/delegates` }));
          setDelegates(delegatesRes.data?.delegates || []);
        } catch {
          setDelegates([]);
        }
      } else {
        setDelegates([]);
      }

      if (statsData?.limits?.totp) {
        try {
          const totpRes = await withAsyncTimeout(apiRequest({ method: "get", url: `${API}/totp` }));
          setTotpEntries(totpRes.data?.entries || []);
        } catch {
          setTotpEntries([]);
        }
      } else {
        setTotpEntries([]);
      }

      if (statsData?.limits?.whitelist) {
        try {
          const whitelistRes = await withAsyncTimeout(apiRequest({ method: "get", url: `${API}/senders/whitelist` }));
          setTrustedSenders(whitelistRes.data?.senders || []);
        } catch {
          setTrustedSenders([]);
        }
      } else {
        setTrustedSenders([]);
      }

      if (Number(statsData?.limits?.max_shared_members || 0) > 0) {
        try {
          const [sharedAccessRes, sharedInboxRes] = await Promise.all([
            withAsyncTimeout(apiRequest({ method: "get", url: `${API}/account/shared-access` })),
            withAsyncTimeout(apiRequest({ method: "get", url: `${API}/shared-inbox?limit=50&offset=0` })),
          ]);
          setSharedAccessOwned(sharedAccessRes.data?.owned_grants || []);
          setSharedAccessReceived(sharedAccessRes.data?.received_grants || []);
          setSharedInboxMessages(sharedInboxRes.data?.messages || []);
        } catch {
          setSharedAccessOwned([]);
          setSharedAccessReceived([]);
          setSharedInboxMessages([]);
        }
      } else {
        setSharedAccessOwned([]);
        setSharedAccessReceived([]);
        setSharedInboxMessages([]);
      }

      if (statsData?.limits?.shared_otp_audit) {
        try {
          const [accessRes, autofillRes] = await Promise.all([
            withAsyncTimeout(apiRequest({ method: "get", url: `${API}/account/otp-access-log?limit=20&offset=0` })),
            withAsyncTimeout(apiRequest({ method: "get", url: `${API}/account/otp-autofill-log?limit=20&offset=0` })),
          ]);
          setOtpAccessLogs(accessRes.data?.logs || []);
          setOtpAutofillLogs(autofillRes.data?.logs || []);
        } catch {
          setOtpAccessLogs([]);
          setOtpAutofillLogs([]);
        }
      } else {
        setOtpAccessLogs([]);
        setOtpAutofillLogs([]);
      }

      if (statsData?.limits?.audit_log) {
        try {
          const auditRes = await withAsyncTimeout(apiRequest({ method: "get", url: `${API}/account/audit-log?limit=20` }));
          setAccountAuditLogs(auditRes.data?.logs || []);
        } catch {
          setAccountAuditLogs([]);
        }
      } else {
        setAccountAuditLogs([]);
      }

      if (isAdmin) {
        try {
          const alertsRes = await withAsyncTimeout(apiRequest({ method: "get", url: `${API}/security/alerts?status=open&limit=20` }));
          setSecurityAlerts(alertsRes.data?.alerts || []);
        } catch {
          setSecurityAlerts([]);
        }
      } else {
        setSecurityAlerts([]);
      }

      try {
        await withAsyncTimeout(loadPasskeys());
      } catch {
        setPasskeys([]);
      }
    } catch {
      // noop
    } finally {
      setLoadingSecureNotes(false);
      setLoading(false);
    }
  }, [apiRequest, isAdmin, loadPasskeys, loadSecurityAlerts]);

  useEffect(() => {
    if (shouldShowPendingCheckout) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [fetchData, shouldShowPendingCheckout]);

  const handleSimulate = async () => {
    if (!demoToolsEnabled) {
      toast.error("Simulazione non disponibile in questo ambiente");
      return;
    }
    setSimulating(true);
    try {
      await apiRequest({ method: "post", url: `${API}/demo/simulate-otp`, data: { sender: "BANCA TEST", source: simulatedInboxSource } });
      const sourceLabel = simulatedInboxSource === "voice" ? "Voice" : simulatedInboxSource === "email" ? "Email" : "SMS";
      toast.success(`OTP ${sourceLabel} simulato ricevuto!`);
      fetchData();
    } catch {
      toast.error("Errore simulazione");
    } finally {
      setSimulating(false);
    }
  };

  const handleCheckout = async (planId) => {
    setCheckoutPlanId(planId);
    try {
      const res = await apiRequest({
        method: "post",
        url: `${API}/billing/create-checkout-session`,
        data: {
          plan_id: planId,
          origin_url: window.location.origin,
        },
      });
      const checkoutUrl = res.data?.checkout_url || res.data?.url;
      if (!checkoutUrl) {
        throw new Error("URL checkout non disponibile");
      }
      window.location.assign(checkoutUrl);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Errore avvio checkout"));
    } finally {
      setCheckoutPlanId(null);
    }
  };

  const getCheckoutPlanIdForKey = useCallback((planKey) => {
    const normalized = normalizePlanKey(planKey);
    if (!["silver", "gold", "elite"].includes(normalized)) return null;
    return `${normalized}_monthly`;
  }, []);

  const isPlanIncluded = useCallback((planKey) => {
    const normalized = normalizePlanKey(planKey);
    const targetRank = PLAN_RANK[normalized] || 0;
    return currentPlanRank > 0 && currentPlanRank >= targetRank;
  }, [currentPlanRank]);

  const getUpgradeActionLabel = useCallback((planKey) => {
    const normalized = normalizePlanKey(planKey);
    if (currentPlanKey === normalized) return "Già attivo";
    if (isPlanIncluded(normalized)) return "Già incluso";
    if (normalized === "silver") return "Attiva Vault";
    if (normalized === "gold") return "Attiva Shield";
    return "Attiva Control";
  }, [currentPlanKey, isPlanIncluded]);

  const markRead = async (id) => {
    try {
      await apiRequest({ method: "post", url: `${API}/inbox/${id}/read`, data: {} });
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: 1 } : m)));
    } catch {
      // noop
    }
  };

  useEffect(() => {
    let cancelled = false;
    const encryptedMessages = messages.filter((message) => Boolean(parseEncryptedEnvelope(message.encrypted_payload)));

    if (!e2eePrivateKey || encryptedMessages.length === 0) {
      setMessageDecryptions({});
      setMessageDecrypting(false);
      return undefined;
    }

    const decryptMessages = async () => {
      setMessageDecrypting(true);
      try {
        const entries = await Promise.all(encryptedMessages.map(async (message) => {
          try {
            const decryptedPayload = await decryptJsonEnvelope(
              e2eePrivateKey,
              parseEncryptedEnvelope(message.encrypted_payload),
            );
            return [
              message.id,
              {
                body: decryptedPayload?.body || message.body || "Contenuto decifrato lato client.",
                otp_code: message.is_otp ? (decryptedPayload?.otp_code || null) : null,
                sender_name: decryptedPayload?.sender_name || message.sender_name || message.from_number,
                decrypted_local: true,
              },
            ];
          } catch {
            return [
              message.id,
              {
                body: message.body || "Impossibile decifrare questo messaggio con la chiave locale.",
                otp_code: null,
                sender_name: message.sender_name || message.from_number,
                decrypt_error: true,
              },
            ];
          }
        }));
        if (!cancelled) {
          setMessageDecryptions(Object.fromEntries(entries));
        }
      } finally {
        if (!cancelled) {
          setMessageDecrypting(false);
        }
      }
    };

    decryptMessages();
    return () => {
      cancelled = true;
    };
  }, [messages, e2eePrivateKey]);

  const hydratedMessages = useMemo(() => {
    return messages.map((message) => {
      const decrypted = messageDecryptions[message.id];
      const hasEncryptedEnvelope = Boolean(parseEncryptedEnvelope(message.encrypted_payload));
      if (decrypted) {
        return { ...message, ...decrypted };
      }
      if (hasEncryptedEnvelope) {
        return {
          ...message,
          body: message.body || (e2eeUnlocked ? "Decifratura locale in corso..." : "Messaggio cifrato. Sblocca la cassaforte E2EE per visualizzarlo."),
          otp_code: null,
        };
      }
      return message;
    });
  }, [messages, messageDecryptions, e2eeUnlocked]);

  const filteredMessages = useMemo(() => {
    let nextMessages = hydratedMessages;
    if (inboxSourceFilter !== "all") {
      nextMessages = nextMessages.filter((m) => normalizeMessageSource(m) === inboxSourceFilter);
    }
    if (inboxOtpOnly) {
      nextMessages = nextMessages.filter((m) => Boolean(m.is_otp));
    }
    return nextMessages;
  }, [hydratedMessages, inboxSourceFilter, inboxOtpOnly, normalizeMessageSource]);

  const sourceCounts = useMemo(() => {
    const counts = { all: messages.length, sms: 0, voice: 0, email: 0 };
    messages.forEach((m) => {
      const key = normalizeMessageSource(m);
      if (key in counts) counts[key] += 1;
    });
    return counts;
  }, [messages, normalizeMessageSource]);

  useEffect(() => {
    localStorage.setItem(INBOX_FILTER_STORAGE_KEY, inboxSourceFilter);
  }, [inboxSourceFilter]);

  useEffect(() => {
    localStorage.setItem(INBOX_OTP_FILTER_STORAGE_KEY, String(inboxOtpOnly));
  }, [inboxOtpOnly]);

  const encryptedMessageCount = useMemo(
    () => messages.filter((message) => Boolean(parseEncryptedEnvelope(message.encrypted_payload))).length,
    [messages],
  );

  useEffect(() => {
    let cancelled = false;
    const encryptedTotpEntries = totpEntries.filter((entry) => Boolean(entry?.encrypted_payload));

    if (!e2eePrivateKey || encryptedTotpEntries.length === 0) {
      setTotpPayloads({});
      return undefined;
    }

    const decryptTotpEntries = async () => {
      const pairs = await Promise.all(encryptedTotpEntries.map(async (entry) => {
        try {
          const payload = await decryptJsonEnvelope(e2eePrivateKey, entry.encrypted_payload);
          return [entry.id, payload];
        } catch {
          return [entry.id, null];
        }
      }));
      if (!cancelled) {
        setTotpPayloads(Object.fromEntries(pairs.filter(([, payload]) => Boolean(payload))));
      }
    };

    decryptTotpEntries();
    return () => {
      cancelled = true;
    };
  }, [totpEntries, e2eePrivateKey]);

  useEffect(() => {
    let cancelled = false;
    const encryptedSecureNotes = secureNotes.filter((note) => Boolean(parseEncryptedEnvelope(note?.encrypted_payload)));

    if (!e2eePrivateKey || encryptedSecureNotes.length === 0) {
      setSecureNoteDecryptions({});
      return undefined;
    }

    const decryptSecureNotes = async () => {
      const pairs = await Promise.all(encryptedSecureNotes.map(async (note) => {
        try {
          const payload = await decryptJsonEnvelope(
            e2eePrivateKey,
            parseEncryptedEnvelope(note.encrypted_payload),
          );
          return [
            note.id,
            {
              title: payload?.title || "Nota sicura",
              body: payload?.body || "",
              kind: payload?.kind || "secure_note",
              decrypted_local: true,
              requires_client_decryption: false,
            },
          ];
        } catch {
          return [
            note.id,
            {
              title: "Nota cifrata",
              body: "Impossibile decifrare questa nota con la chiave locale corrente.",
              decrypt_error: true,
              requires_client_decryption: true,
            },
          ];
        }
      }));

      if (!cancelled) {
        setSecureNoteDecryptions(Object.fromEntries(pairs));
      }
    };

    decryptSecureNotes();
    return () => {
      cancelled = true;
    };
  }, [secureNotes, e2eePrivateKey]);

  useEffect(() => {
    let cancelled = false;
    const encryptedDelegates = delegates.filter((delegate) => Boolean(parseEncryptedEnvelope(delegate?.encrypted_payload)));

    if (!e2eePrivateKey || encryptedDelegates.length === 0) {
      setDelegateDecryptions({});
      return undefined;
    }

    const decryptDelegates = async () => {
      const pairs = await Promise.all(encryptedDelegates.map(async (delegate) => {
        try {
          const payload = await decryptJsonEnvelope(
            e2eePrivateKey,
            parseEncryptedEnvelope(delegate.encrypted_payload),
          );
          return [
            delegate.id,
            {
              delegate_name: payload?.delegate_name || "Erede cifrato",
              delegate_email: payload?.delegate_email || "Dato non disponibile",
              delegate_phone: payload?.delegate_phone || null,
              relationship: payload?.relationship || null,
              decrypted_local: true,
              requires_client_decryption: false,
            },
          ];
        } catch {
          return [delegate.id, null];
        }
      }));

      if (!cancelled) {
        setDelegateDecryptions(Object.fromEntries(pairs.filter(([, payload]) => Boolean(payload))));
      }
    };

    decryptDelegates();
    return () => {
      cancelled = true;
    };
  }, [delegates, e2eePrivateKey]);

  const hydratedTotpEntries = useMemo(() => {
    return totpEntries.map((entry) => {
      const payload = totpPayloads[entry.id];
      return payload
        ? {
            ...entry,
            label: payload.label || entry.label,
            issuer: payload.issuer || entry.issuer,
            account_name: payload.account_name || entry.account_name,
            digits: payload.digits || entry.digits || 6,
            period_seconds: payload.period_seconds || entry.period_seconds || 30,
            algorithm: payload.algorithm || entry.algorithm || "SHA1",
          }
        : entry;
    });
  }, [totpEntries, totpPayloads]);

  const hydratedSecureNotes = useMemo(() => {
    return secureNotes.map((note) => {
      const decrypted = secureNoteDecryptions[note.id];
      if (decrypted) {
        return { ...note, ...decrypted };
      }

      const hasEncryptedEnvelope = Boolean(parseEncryptedEnvelope(note?.encrypted_payload));
      if (hasEncryptedEnvelope) {
        return {
          ...note,
          title: "Nota cifrata",
          body: e2eeUnlocked ? "Decifratura locale in corso..." : "Sblocca la cassaforte E2EE per leggere questa nota.",
          requires_client_decryption: true,
        };
      }

      return note;
    });
  }, [secureNotes, secureNoteDecryptions, e2eeUnlocked]);

  const hydratedDelegates = useMemo(() => {
    return delegates.map((delegate) => {
      const decrypted = delegateDecryptions[delegate.id];
      if (decrypted) {
        return { ...delegate, ...decrypted };
      }

      const hasEncryptedEnvelope = Boolean(parseEncryptedEnvelope(delegate?.encrypted_payload));
      if (hasEncryptedEnvelope) {
        return {
          ...delegate,
          delegate_name: "Erede cifrato",
          delegate_email: e2eeUnlocked ? "Decifratura locale in corso..." : "Sblocca E2EE per vedere il contatto",
          delegate_phone: null,
          relationship: null,
          requires_client_decryption: true,
        };
      }

      return delegate;
    });
  }, [delegates, delegateDecryptions, e2eeUnlocked]);

  const refreshTotpCodes = useCallback(async () => {
    if (!canUseTotp) {
      setTotpCodes([]);
      return;
    }
    setLoadingTotpCodes(true);
    try {
      const now = Date.now();
      const codes = await Promise.all(hydratedTotpEntries.map(async (entry) => {
        const payload = totpPayloads[entry.id];
        if (!payload?.secret_base32) {
          return {
            id: entry.id,
            encrypted: Boolean(entry.encrypted_payload),
            code: null,
            expires_in: null,
            requires_client_decryption: Boolean(entry.encrypted_payload),
          };
        }
        const result = await generateTotpCode({
          secret_base32: payload.secret_base32,
          digits: payload.digits || entry.digits || 6,
          period_seconds: payload.period_seconds || entry.period_seconds || 30,
          algorithm: payload.algorithm || entry.algorithm || "SHA1",
          now,
        });
        return { id: entry.id, encrypted: false, ...result };
      }));
      setTotpCodes(codes);
    } catch {
      setTotpCodes([]);
    } finally {
      setLoadingTotpCodes(false);
    }
  }, [canUseTotp, hydratedTotpEntries, totpPayloads]);

  useEffect(() => {
    if (!canUseTotp || hydratedTotpEntries.length === 0) {
      setTotpCodes([]);
      return undefined;
    }
    refreshTotpCodes();
    const timer = window.setInterval(() => {
      refreshTotpCodes();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [canUseTotp, hydratedTotpEntries, refreshTotpCodes]);

  const createAlias = async (e) => {
    e.preventDefault();
    setCreatingAlias(true);
    try {
      const payload = {
        service_label: aliasForm.service_label || undefined,
        alias_local: aliasForm.alias_local || undefined,
      };
      await apiRequest({ method: "post", url: `${API}/account/email-aliases`, data: payload });
      toast.success("Alias email creato");
      setAliasForm({ service_label: "", alias_local: "" });
      loadEmailAliases();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Errore creazione alias");
    } finally {
      setCreatingAlias(false);
    }
  };

  const disableAlias = async (aliasId) => {
    try {
      await apiRequest({ method: "delete", url: `${API}/account/email-aliases/${aliasId}` });
      toast.success("Alias disattivato");
      setEmailAliases((prev) => prev.map((a) => (a.id === aliasId ? { ...a, status: "disabled" } : a)));
    } catch {
      toast.error("Errore disattivazione alias");
    }
  };

  const saveOtpPolicy = async (nextPolicy) => {
    setSavingOtpPolicy(true);
    try {
      const payload = {
        ttl_seconds: Number(nextPolicy.ttl_seconds || 300),
        auto_delete: Boolean(nextPolicy.auto_delete),
        whitelist_enabled: Boolean(nextPolicy.whitelist_mode && nextPolicy.whitelist_mode !== "off"),
        whitelist_mode: nextPolicy.whitelist_mode || "off",
        mask_otp: Boolean(nextPolicy.mask_otp),
      };
      const res = await apiRequest({ method: "put", url: `${API}/account/otp-policy`, data: payload });
      setOtpPolicy((prev) => ({
        ...prev,
        ...nextPolicy,
        whitelist_mode: res.data?.whitelist_mode || payload.whitelist_mode,
        whitelist_enabled: Boolean(res.data?.whitelist_enabled ?? payload.whitelist_enabled),
      }));
      toast.success("Policy OTP aggiornata");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile aggiornare la policy OTP"));
    } finally {
      setSavingOtpPolicy(false);
    }
  };

  const addTrustedSender = async (e) => {
    e.preventDefault();
    const sender_id = String(trustedSenderForm.sender_id || "").trim();
    if (!sender_id) {
      toast.error("Inserisci un sender ID");
      return;
    }
    setSavingTrustedSender(true);
    try {
      await apiRequest({
        method: "post",
        url: `${API}/senders/whitelist`,
        data: {
          sender_id,
          sender_name: String(trustedSenderForm.sender_name || "").trim() || sender_id,
        },
      });
      toast.success("Mittente aggiunto");
      setTrustedSenderForm({ sender_id: "", sender_name: "" });
      await loadTrustedSenders();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile aggiungere mittente"));
    } finally {
      setSavingTrustedSender(false);
    }
  };

  const removeTrustedSender = async (senderId) => {
    if (!window.confirm("Rimuovere questo mittente dalla whitelist?")) return;
    setRemovingTrustedSenderId(senderId);
    try {
      await apiRequest({ method: "delete", url: `${API}/senders/whitelist/${senderId}` });
      toast.success("Mittente rimosso");
      await loadTrustedSenders();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile rimuovere mittente"));
    } finally {
      setRemovingTrustedSenderId(null);
    }
  };

  const createSharedAccess = async (e) => {
    e.preventDefault();
    const viewer_email = String(sharedAccessForm.viewer_email || "").trim().toLowerCase();
    if (!viewer_email) {
      toast.error("Inserisci l'email del membro");
      return;
    }
    setSavingSharedAccess(true);
    try {
      await apiRequest({
        method: "post",
        url: `${API}/account/shared-access`,
        data: { viewer_email, scope_type: "all" },
      });
      toast.success("Condivisione creata");
      setSharedAccessForm({ viewer_email: "" });
      await Promise.all([loadSharedAccess(), loadSharedInbox(), fetchData()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile creare condivisione"));
    } finally {
      setSavingSharedAccess(false);
    }
  };

  const revokeSharedAccess = async (shareId) => {
    if (!window.confirm("Revocare questo accesso condiviso?")) return;
    setRevokingSharedAccessId(shareId);
    try {
      await apiRequest({ method: "delete", url: `${API}/account/shared-access/${shareId}` });
      toast.success("Condivisione revocata");
      await Promise.all([loadSharedAccess(), loadSharedInbox(), fetchData()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile revocare condivisione"));
    } finally {
      setRevokingSharedAccessId(null);
    }
  };

  const markSharedRead = async (messageId) => {
    try {
      await apiRequest({ method: "post", url: `${API}/shared-inbox/${messageId}/read`, data: {} });
      await loadSharedInbox();
      await loadOtpAccessLogs();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile registrare lettura"));
    }
  };

  const resetSecureNoteForm = useCallback(() => {
    setSecureNoteForm({
      id: null,
      title: "",
      body: "",
    });
  }, []);

  const editSecureNote = useCallback((note) => {
    if (!note?.decrypted_local || note?.decrypt_error) {
      toast.error("Sblocca la cassaforte E2EE per modificare questa nota");
      return;
    }
    setSecureNoteForm({
      id: note.id,
      title: note.title || "",
      body: note.body || "",
    });
  }, []);

  const saveSecureNote = async (e) => {
    e.preventDefault();
    if (!canUseSecureNotes) {
      toast.error("Note sicure non disponibili per il tuo piano");
      return;
    }
    if (!e2eeReadyForEncrypt) {
      toast.error("Per salvare una nota devi prima attivare o sbloccare la cassaforte E2EE");
      return;
    }

    const rawBody = String(secureNoteForm.body || "");
    const trimmedBody = rawBody.trim();
    if (!trimmedBody) {
      toast.error("Inserisci il contenuto della nota");
      return;
    }

    const fallbackTitle = `Nota sicura ${new Date().toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    const title = String(secureNoteForm.title || "").trim() || fallbackTitle;

    setSavingSecureNote(true);
    try {
      const encryptedPayload = await encryptJsonPayload(e2eePublicKey, e2eeStatus.key_id, {
        kind: "secure_note",
        title,
        body: trimmedBody,
      });
      const isEditingSecureNote = Boolean(secureNoteForm.id);
      await apiRequest({
        method: isEditingSecureNote ? "put" : "post",
        url: isEditingSecureNote ? `${API}/secure-notes/${secureNoteForm.id}` : `${API}/secure-notes`,
        data: {
          encrypted_payload: encryptedPayload,
        },
      });
      toast.success(isEditingSecureNote ? "Nota sicura aggiornata" : "Nota sicura salvata");
      resetSecureNoteForm();
      await loadSecureNotes();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile salvare nota sicura"));
    } finally {
      setSavingSecureNote(false);
    }
  };

  const deleteSecureNote = async (noteId) => {
    if (!window.confirm("Eliminare questa nota sicura?")) return;
    setDeletingSecureNoteId(noteId);
    try {
      await apiRequest({ method: "delete", url: `${API}/secure-notes/${noteId}` });
      if (secureNoteForm.id === noteId) {
        resetSecureNoteForm();
      }
      toast.success("Nota sicura eliminata");
      await loadSecureNotes();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile eliminare nota sicura"));
    } finally {
      setDeletingSecureNoteId(null);
    }
  };

  const createTotpEntry = async (e) => {
    e.preventDefault();
    if (!canUseTotp) {
      toast.error("TOTP non disponibile per il tuo piano");
      return;
    }
    if (!e2eeReadyForEncrypt) {
      toast.error("Per aggiungere un TOTP devi prima attivare o sbloccare la cassaforte E2EE");
      return;
    }

    try {
      const parsedFromUrl = totpForm.otpauth_url.trim() ? parseOtpAuthUrl(totpForm.otpauth_url) : null;
      const payload = parsedFromUrl || {
        label: String(totpForm.label || "").trim() || "TOTP",
        issuer: String(totpForm.issuer || "").trim() || null,
        account_name: String(totpForm.account_name || "").trim() || null,
        secret_base32: normalizeBase32Secret(totpForm.secret_base32),
        digits: Number(totpForm.digits) || 6,
        period_seconds: Number(totpForm.period_seconds) || 30,
        algorithm: String(totpForm.algorithm || "SHA1").toUpperCase(),
      };

      setSavingTotp(true);
      const encryptedPayload = await encryptJsonPayload(e2eePublicKey, e2eeStatus.key_id, payload);
      await apiRequest({
        method: "post",
        url: `${API}/totp`,
        data: {
          label: payload.label,
          encrypted_payload: encryptedPayload,
        },
      });
      toast.success("Account TOTP aggiunto");
      setTotpForm({
        otpauth_url: "",
        label: "",
        issuer: "",
        account_name: "",
        secret_base32: "",
        digits: 6,
        period_seconds: 30,
        algorithm: "SHA1",
      });
      await fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, err?.message || "Impossibile salvare account TOTP"));
    } finally {
      setSavingTotp(false);
    }
  };

  const deleteTotpEntry = async (entryId) => {
    if (!window.confirm("Rimuovere questo account TOTP?")) return;
    setDeletingTotpId(entryId);
    try {
      await apiRequest({ method: "delete", url: `${API}/totp/${entryId}` });
      toast.success("Account TOTP rimosso");
      await fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile rimuovere account TOTP"));
    } finally {
      setDeletingTotpId(null);
    }
  };

  const handlePushSubscribe = async () => {
    const ok = await subscribePush();
    if (ok) toast.success("Notifiche push attivate");
    else toast.error(pushError || "Impossibile attivare le notifiche push");
  };

  const handlePushUnsubscribe = async () => {
    const ok = await unsubscribePush();
    if (ok) toast.success("Notifiche push disattivate");
    else toast.error(pushError || "Impossibile disattivare le notifiche push");
  };

  const handlePushTest = async () => {
    const ok = await sendTestNotification();
    if (ok) toast.success("Notifica test inviata");
    else toast.error(pushError || "Test push non riuscito");
  };

  const resolveSecurityAlert = async (alertId) => {
    setResolvingAlertId(alertId);
    try {
      await apiRequest({ method: "post", url: `${API}/security/alerts/${alertId}/resolve`, data: {} });
      setSecurityAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      toast.success("Alert risolto");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile risolvere l'alert"));
    } finally {
      setResolvingAlertId(null);
    }
  };

  const updateAdminUserPlan = useCallback(async () => {
    if (!selectedAdminUserId) {
      toast.error("Seleziona prima un utente");
      return;
    }

    setUpdatingAdminUserPlan(true);
    try {
      const res = await apiRequest({
        method: "post",
        url: `${API}/admin/users/${selectedAdminUserId}/plan`,
        data: {
          plan: adminPlanDraft,
          provision_number: true,
        },
      });
      toast.success(`Piano aggiornato: ${res.data?.plan_label || adminPlanDraft}`);
      await loadAdminUserProfile(selectedAdminUserId);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile aggiornare il piano utente"));
    } finally {
      setUpdatingAdminUserPlan(false);
    }
  }, [adminPlanDraft, apiRequest, loadAdminUserProfile, selectedAdminUserId]);

  const grantAdminBurnerNumber = useCallback(async () => {
    if (!selectedAdminUserId) {
      toast.error("Seleziona prima un utente");
      return;
    }

    setAddingAdminBurnerNumber(true);
    try {
      const res = await apiRequest({
        method: "post",
        url: `${API}/admin/users/${selectedAdminUserId}/burner-number`,
        data: {
          ttl_hours: Number(adminBurnerHours) || 24,
        },
      });
      toast.success(`Burner aggiunto: ${res.data?.e164 || "numero creato"}`);
      await loadAdminUserProfile(selectedAdminUserId);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile creare il burner di supporto"));
    } finally {
      setAddingAdminBurnerNumber(false);
    }
  }, [adminBurnerHours, apiRequest, loadAdminUserProfile, selectedAdminUserId]);

  const freezeAdminUser = useCallback(async () => {
    if (!selectedAdminUserId) {
      toast.error("Seleziona prima un utente");
      return;
    }
    const targetEmail = adminUserProfile?.user?.email || `utente ${selectedAdminUserId}`;
    if (!window.confirm(`Congelare immediatamente l'account ${targetEmail}?`)) {
      return;
    }

    setFreezingAdminUserId(selectedAdminUserId);
    try {
      await apiRequest({
        method: "post",
        url: `${API}/admin/users/${selectedAdminUserId}/freeze`,
        data: {
          reason: "Sospetto abuso o spam su numeri Twilio",
        },
      });
      toast.success("Account congelato");
      await Promise.all([loadAdminUserProfile(selectedAdminUserId), loadSecurityAlerts()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile congelare l'account"));
    } finally {
      setFreezingAdminUserId(null);
    }
  }, [adminUserProfile?.user?.email, apiRequest, loadAdminUserProfile, loadSecurityAlerts, selectedAdminUserId]);

  const realignAdminBilling = useCallback(async () => {
    if (!selectedAdminUserId) {
      toast.error("Seleziona prima un utente");
      return;
    }

    setRealigningAdminUserId(selectedAdminUserId);
    try {
      await apiRequest({
        method: "post",
        url: `${API}/admin/users/${selectedAdminUserId}/billing/realign`,
        data: {},
      });
      toast.success("Billing riallineato correttamente");
      await loadAdminUserProfile(selectedAdminUserId);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile riallineare il billing"));
    } finally {
      setRealigningAdminUserId(null);
    }
  }, [apiRequest, loadAdminUserProfile, selectedAdminUserId]);

  const exportAdminCsv = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    setExportingAdminCsv(true);
    try {
      const response = await apiRequest({
        method: "get",
        url: `${API}/analytics/funnel/export.csv?days=${adminKpiDays}`,
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" });
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `heirline-admin-funnel-${adminKpiDays}d.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
      toast.success("CSV esportato");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile esportare il CSV"));
    } finally {
      setExportingAdminCsv(false);
    }
  }, [adminKpiDays, apiRequest, isAdmin]);

  const requestPasswordStepUpToken = useCallback(async (password, missingMessage) => {
    const trimmedPassword = String(password || "").trim();
    if (trimmedPassword.length < 8) {
      throw new Error(missingMessage || "Inserisci la password di conferma");
    }
    const stepUpRes = await apiRequest({
      method: "post",
      url: `${API}/auth/step-up/password`,
      data: { password: trimmedPassword },
    });
    const stepUpToken = stepUpRes.data?.step_up_token;
    if (!stepUpToken) {
      throw new Error("Step-up token mancante");
    }
    return stepUpToken;
  }, [apiRequest]);

  const triggerPanicFreeze = async () => {
    if (!window.confirm("Confermi il freeze immediato dell'account?")) return;

    setPanicBusy(true);
    try {
      const stepUpToken = await requestPasswordStepUpToken(
        panicPassword,
        "Inserisci la password per confermare il kill switch",
      );
      await apiRequest({
        method: "post",
        url: `${API}/panic/freeze`,
        data: {
          delete_data: panicConfirmDelete,
          notify_emergency: true,
        },
        headers: {
          "X-Step-Up-Token": stepUpToken,
        },
      });
      toast.success("Kill switch attivato: account congelato");
      setPanicPassword("");
      setPanicConfirmDelete(false);
      await onLogout(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile attivare il kill switch"));
    } finally {
      setPanicBusy(false);
    }
  };

  const createDelegate = async (e) => {
    e.preventDefault();
    const payload = {
      delegate_name: String(delegateForm.delegate_name || "").trim(),
      delegate_email: String(delegateForm.delegate_email || "").trim().toLowerCase(),
      delegate_phone: String(delegateForm.delegate_phone || "").trim() || undefined,
      relationship: String(delegateForm.relationship || "").trim() || undefined,
      inactivity_days: Number(delegateForm.inactivity_days || 90),
    };

    if (!payload.delegate_name || !payload.delegate_email) {
      toast.error("Nome ed email dell'erede sono obbligatori");
      return;
    }

    setCreatingDelegate(true);
    try {
      const stepUpToken = await requestPasswordStepUpToken(
        delegateStepUpPassword,
        "Inserisci la password per confermare la gestione eredi",
      );
      await apiRequest({
        method: "post",
        url: `${API}/account/delegates`,
        data: payload,
        headers: {
          "X-Step-Up-Token": stepUpToken,
        },
      });
      toast.success("Erede digitale aggiunto");
      setDelegateForm({
        delegate_name: "",
        delegate_email: "",
        delegate_phone: "",
        relationship: "",
        inactivity_days: 90,
      });
      setDelegateStepUpPassword("");
      await Promise.all([loadDelegates(), fetchData()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Errore creazione erede"));
    } finally {
      setCreatingDelegate(false);
    }
  };

  const removeDelegate = async (delegateId) => {
    if (!window.confirm("Revocare questo erede digitale?")) return;
    setRemovingDelegateId(delegateId);
    try {
      const stepUpToken = await requestPasswordStepUpToken(
        delegateStepUpPassword,
        "Inserisci la password per confermare la gestione eredi",
      );
      await apiRequest({
        method: "delete",
        url: `${API}/account/delegates/${delegateId}`,
        headers: {
          "X-Step-Up-Token": stepUpToken,
        },
      });
      toast.success("Erede revocato");
      setDelegateStepUpPassword("");
      await Promise.all([loadDelegates(), fetchData()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Errore revoca erede"));
    } finally {
      setRemovingDelegateId(null);
    }
  };

  const overrideDelegateRelease = async (delegateId) => {
    setOverridingDelegateId(delegateId);
    try {
      const stepUpToken = await requestPasswordStepUpToken(
        delegateStepUpPassword,
        "Inserisci la password per confermare la gestione eredi",
      );
      await apiRequest({
        method: "post",
        url: `${API}/account/delegates/${delegateId}/override`,
        data: {},
        headers: {
          "X-Step-Up-Token": stepUpToken,
        },
      });
      toast.success("Procedura delega annullata");
      setDelegateStepUpPassword("");
      await Promise.all([loadDelegates(), fetchData()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Nessun rilascio delega da annullare"));
    } finally {
      setOverridingDelegateId(null);
    }
  };

  const handleEnableE2ee = async () => {
    const passphrase = e2eePassphrase.trim();
    if (passphrase.length < 10) {
      toast.error("Usa una passphrase di almeno 10 caratteri");
      return;
    }

    setE2eeBusy(true);
    try {
      const vault = await createAndStoreVault(passphrase);
      await apiRequest({
        method: "put",
        url: `${API}/account/e2ee-key`,
        data: {
          key_id: vault.key_id,
          public_key_pem: vault.public_key_pem,
          algorithm: "RSA-OAEP-256+AES-256-GCM",
        },
      });
      setHasLocalVaultState(true);
      setE2eePrivateKey(vault.privateKey);
      setE2eePublicKey(vault.publicKey);
      setE2eePassphrase("");
      toast.success("Cassaforte E2EE attivata");
      await fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile attivare E2EE"));
    } finally {
      setE2eeBusy(false);
    }
  };

  const handleUnlockE2ee = async () => {
    const passphrase = e2eePassphrase.trim();
    if (!hasStoredVault() || !passphrase) {
      toast.error("Inserisci la passphrase della cassaforte");
      return;
    }

    setE2eeBusy(true);
    try {
      const unlocked = await unlockStoredVault(passphrase);
      if (e2eeEnabled && e2eeStatus?.key_id && unlocked.key_id !== e2eeStatus.key_id) {
        throw new Error("Chiave locale non allineata all'account");
      }
      setHasLocalVaultState(true);
      setE2eePrivateKey(unlocked.privateKey);
      setE2eePublicKey(unlocked.publicKey);
      setE2eePassphrase("");
      toast.success("Cassaforte sbloccata");
    } catch {
      toast.error("Passphrase non valida o chiave locale non compatibile");
    } finally {
      setE2eeBusy(false);
    }
  };

  const handleLockE2ee = () => {
    setE2eePrivateKey(null);
    setE2eePublicKey(null);
    setMessageDecryptions({});
    setSecureNoteDecryptions({});
    resetSecureNoteForm();
    setTotpPayloads({});
    setTotpCodes([]);
    toast.success("Cassaforte bloccata");
  };

  const handleRegisterPasskey = async () => {
    if (!browserSupportsPasskeys) {
      toast.error("Passkey non supportate su questo browser o dispositivo");
      return;
    }
    if (!canUsePasskeys) {
      toast.error("Passkeys disponibili solo su piano Control");
      return;
    }
    if (passkeysLimit > 0 && passkeys.length >= passkeysLimit) {
      toast.error(`Limite passkeys raggiunto (${passkeysLimit})`);
      return;
    }

    setRegisteringPasskey(true);
    try {
      const label = passkeyLabel.trim() || null;
      const optionsRes = await apiRequest({
        method: "post",
        url: `${API}/account/passkeys/register/options`,
        data: { label },
      });
      const challengeId = optionsRes.data?.challenge_id;
      const publicKey = normalizePublicKeyCreationOptions(optionsRes.data?.public_key);
      if (!challengeId || !publicKey) {
        throw new Error("Opzioni passkey non valide");
      }

      const credential = await navigator.credentials.create({ publicKey });
      if (!credential) {
        throw new Error("Registrazione passkey annullata");
      }

      await apiRequest({
        method: "post",
        url: `${API}/account/passkeys/register/verify`,
        data: {
          challenge_id: challengeId,
          credential: credentialToJson(credential),
          label,
        },
      });
      setPasskeyLabel("");
      toast.success("Passkey registrata con successo");
      await Promise.all([loadPasskeys(), fetchData()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Registrazione passkey non riuscita"));
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleDeletePasskey = async (passkeyId) => {
    if (!window.confirm("Revocare questa passkey?")) return;
    setDeletingPasskeyId(passkeyId);
    try {
      await apiRequest({ method: "delete", url: `${API}/account/passkeys/${passkeyId}` });
      toast.success("Passkey revocata");
      await Promise.all([loadPasskeys(), fetchData()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossibile revocare passkey"));
    } finally {
      setDeletingPasskeyId(null);
    }
  };

  const revokeSession = async (sessionId, isCurrent) => {
    setRevokingSessionId(sessionId);
    try {
      await apiRequest({ method: "delete", url: `${API}/auth/sessions/${sessionId}` });
      toast.success(isCurrent ? "Sessione corrente revocata" : "Sessione revocata");
      if (isCurrent) {
        await onLogout(false);
        return;
      }
      setAuthSessions((prev) => prev.map((session) => (
        session.session_id === sessionId
          ? { ...session, revoked_at: new Date().toISOString() }
          : session
      )));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Errore revoca sessione"));
    } finally {
      setRevokingSessionId(null);
    }
  };

  const logoutAllSessions = async () => {
    setLoggingOutAll(true);
    try {
      await onLogout(true);
      toast.success("Tutte le sessioni sono state terminate");
    } catch {
      toast.error("Errore logout globale");
    } finally {
      setLoggingOutAll(false);
    }
  };

  const currentPlanBadgeClass = currentPlanKey === "elite" ? "badge-team" : currentPlanKey === "gold" ? "badge-pro" : "badge-otp";
  const dashboardStats = [
    {
      label: "Messaggi totali",
      value: stats?.messages_total ?? "0",
      helper: "Feed consolidato",
      icon: MessageSquare,
      color: "text-accent-primary",
    },
    {
      label: "Non letti",
      value: stats?.messages_unread ?? "0",
      helper: "Da verificare",
      icon: Bell,
      color: "text-accent-secondary",
    },
    {
      label: "Dispositivi",
      value: stats ? `${stats?.devices_active ?? 0}/${stats?.devices_max ?? 0}` : "0/0",
      helper: "Sessioni trusted",
      icon: Smartphone,
      color: "text-foreground",
    },
    {
      label: "Eredi digitali",
      value: stats ? `${stats?.delegates_count ?? 0}/${stats?.delegates_max ?? 0}` : "0/0",
      helper: "Continuita operativa",
      icon: Users,
      color: "text-accent-gold",
    },
  ];
  const adminMetrics = stats?.admin_metrics || {};
  const adminDashboardStats = [
    {
      label: "Alert aperti",
      value: adminMetrics.open_security_alerts ?? 0,
      helper: "Sicurezza",
      icon: ShieldAlert,
      color: "text-danger",
    },
    {
      label: "Utenti attivi",
      value: adminMetrics.active_users ?? 0,
      helper: `Totali ${adminMetrics.total_users ?? 0}`,
      icon: Users,
      color: "text-accent-primary",
    },
    {
      label: "Pagamenti falliti",
      value: adminMetrics.failed_payments ?? 0,
      helper: "Billing",
      icon: CreditCard,
      color: "text-accent-secondary",
    },
    {
      label: "Webhook falliti",
      value: adminMetrics.failed_webhooks ?? 0,
      helper: "Stripe sync",
      icon: Bell,
      color: "text-accent-gold",
    },
  ];
  const statusSummary = !e2eeEnabled ? "E2EE richiesta" : e2eeUnlocked ? "Cassaforte sbloccata" : "Cassaforte protetta";
  const dashboardHeroSummary = needsE2eeSetup
    ? "L'account non e ancora protetto end-to-end. Completa la cassaforte E2EE prima di usare il vault."
    : hasRealPrimaryNumber
      ? "Numero blindato attivo e dashboard allineata."
      : hasBlindNumberEntitlement
        ? "Piano attivo, provisioning del numero in corso."
        : "Vault attivo. Il numero blindato si aggiunge solo se ti serve.";

  if (shouldShowPendingCheckout) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="grain-overlay" />
        <div className="absolute left-[-8%] top-[10%] h-[360px] w-[360px] rounded-full bg-accent-primary/10 blur-[140px]" />
        <div className="absolute right-[-10%] top-[22%] h-[420px] w-[420px] rounded-full bg-accent-secondary/10 blur-[150px]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="panel-surface-strong p-6 sm:p-10">
              <Badge className="section-kicker border-0">Checkout richiesto</Badge>
              <div className="mt-5 max-w-3xl space-y-3">
                <h1 className="text-3xl font-display font-bold tracking-tight text-foreground sm:text-5xl">
                  Registrazione completata. Scegli ora il piano.
                </h1>
                <p className="text-base leading-relaxed text-neutral-400 sm:text-lg">
                  Parti da Vault, passa a Shield se ti serve il numero blindato, oppure scegli Control per la parte operativa avanzata.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {sortedCatalogPlans.map((plan) => {
                const presentation = getPricingPlanPresentation(plan);
                const checkoutId = getCheckoutPlanIdForKey(plan.plan_key);
                const buttonClass = presentation.isPopular
                  ? "bg-accent-secondary hover:bg-accent-secondary/90 text-white shadow-[0_18px_38px_rgba(79,140,255,0.2)]"
                  : plan.plan_key === "elite"
                    ? "bg-accent-gold hover:bg-accent-gold/90 text-obsidian"
                    : "btn-teal";

                return (
                  <Card
                    key={plan.plan_key || plan.id}
                    className={`relative flex flex-col gap-8 rounded-[32px] border p-6 sm:p-8 ${
                      presentation.isPopular
                        ? "bg-accent-secondary/10 border-accent-secondary/30 shadow-[0_24px_64px_rgba(79,140,255,0.18)]"
                        : "panel-surface"
                    }`}
                  >
                    {presentation.badgeLabel ? (
                      <div className={`absolute left-6 top-6 ${presentation.isPopular ? "badge-pro" : plan.plan_key === "elite" ? "badge-team" : "badge-otp"}`}>
                        {presentation.badgeLabel}
                      </div>
                    ) : null}

                    <div className="space-y-2 pt-8">
                      <h3 className="text-2xl font-display font-bold text-foreground">{presentation.publicLabel}</h3>
                      <p className="text-sm text-neutral-300">{presentation.headline}</p>
                      <p className="text-sm text-neutral-500">{presentation.subheadline}</p>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-display font-bold text-foreground">{presentation.priceValue}</span>
                      <span className="text-sm text-neutral-500">{presentation.priceSuffix}</span>
                    </div>

                    <ul className="space-y-4">
                      {(plan.features || []).slice(0, 5).map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-neutral-400">
                          <Check className="mt-0.5 h-4 w-4 text-accent-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => checkoutId && handleCheckout(checkoutId)}
                      disabled={!checkoutId || checkoutPlanId === checkoutId}
                      className={`mt-auto h-12 w-full ${buttonClass}`}
                    >
                      {checkoutPlanId === checkoutId ? <RefreshCw className="w-4 h-4 animate-spin" /> : getUpgradeActionLabel(plan.plan_key)}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isAdminConsole) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="grain-overlay" />
        <div className="absolute left-[-8%] top-[10%] h-[360px] w-[360px] rounded-full bg-accent-primary/10 blur-[140px]" />
        <div className="absolute right-[-10%] top-[22%] h-[420px] w-[420px] rounded-full bg-accent-secondary/10 blur-[150px]" />
        <div className="absolute bottom-[-12%] left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-danger/10 blur-[160px]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="panel-surface-strong p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                  <Badge className="section-kicker border-0">Console Admin</Badge>
                  <h1 className="text-3xl font-display font-bold tracking-tight text-foreground sm:text-5xl">
                    Gestione errori e utenti
                  </h1>
                  <p className="max-w-3xl text-base leading-relaxed text-neutral-400 sm:text-lg">
                    Questo account admin non viene trattato come un cliente della piattaforma: niente numeri blindati, inbox, upgrade o vault personale. Qui gestisci solo sicurezza, utenti, billing e KPI.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Badge className="bg-danger/15 text-danger border border-danger/25">
                    RUOLO ADMIN
                  </Badge>
                  <div className="rounded-full border border-border/70 bg-muted/45 px-4 py-2 text-sm font-medium text-foreground">
                    Sessioni attive {adminMetrics.active_sessions ?? 0}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchData}
                    disabled={loading}
                    className="h-11 w-11 border-border/80"
                    aria-label="Aggiorna console admin"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {adminDashboardStats.map((item) => (
                <Card key={item.label} className="stat-tile overflow-hidden border-border/70">
                  <CardContent className="p-5 sm:p-6">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/70 ${item.color}`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-500">{item.helper}</div>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-500">{item.label}</p>
                    <p className="mt-2 text-3xl font-display font-bold text-foreground">{item.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs value="admin" onValueChange={() => {}} className="space-y-8">
              <AnimatePresence mode="wait">
                <motion.div key="admin" className="dashboard-stage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <DashboardAdminTab
                    section={{
                      securityAlerts,
                      loadingSecurityAlerts,
                      loadSecurityAlerts,
                      resolveSecurityAlert,
                      resolvingAlertId,
                      adminSearchQuery,
                      onAdminSearchQueryChange: setAdminSearchQuery,
                      adminSearchResults,
                      searchingAdminUsers,
                      selectedAdminUserId,
                      loadAdminUserProfile,
                      adminUserProfile,
                      loadingAdminUserProfile,
                      adminPlanDraft,
                      onAdminPlanDraftChange: setAdminPlanDraft,
                      updateAdminUserPlan,
                      updatingAdminUserPlan,
                      adminBurnerHours,
                      onAdminBurnerHoursChange: setAdminBurnerHours,
                      grantAdminBurnerNumber,
                      addingAdminBurnerNumber,
                      freezeAdminUser,
                      freezingAdminUserId,
                      realignAdminBilling,
                      realigningAdminUserId,
                      kpiData: adminKpiData,
                      kpiDays: adminKpiDays,
                      onKpiDaysChange: setAdminKpiDays,
                      loadAdminKpi,
                      loadingAdminKpi,
                      exportAdminCsv,
                      exportingAdminCsv,
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="grain-overlay" />
      <div className="absolute left-[-8%] top-[10%] h-[360px] w-[360px] rounded-full bg-accent-primary/10 blur-[140px]" />
      <div className="absolute right-[-10%] top-[22%] h-[420px] w-[420px] rounded-full bg-accent-secondary/10 blur-[150px]" />
      <div className="absolute bottom-[-12%] left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-accent-gold/10 blur-[160px]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-32 pt-24 sm:px-6 lg:px-8 md:pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="panel-surface-strong p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <Badge className="section-kicker border-0">Dashboard</Badge>
                <h1 className="text-3xl font-display font-bold tracking-tight text-foreground sm:text-5xl">
                  Bentornato, {user?.nome || user?.email}
                </h1>
                <p className="max-w-3xl text-base leading-relaxed text-neutral-400 sm:text-lg">
                  {dashboardHeroSummary}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Badge className={currentPlanBadgeClass}>
                  PIANO {getPublicPlanLabel(stats?.plan || user?.plan).toUpperCase()}
                </Badge>
                <div className="rounded-full border border-border/70 bg-muted/45 px-4 py-2 text-sm font-medium text-foreground">
                  {statusSummary}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchData}
                  disabled={loading}
                  className="h-11 w-11 border-border/80"
                  aria-label="Aggiorna dashboard"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </div>

          {needsE2eeSetup ? (
            <Card className="panel-surface-strong overflow-hidden border-danger/30 bg-danger/5">
              <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-danger">
                    <Shield className="h-5 w-5" />
                    <p className="text-sm font-bold uppercase tracking-[0.22em]">Setup obbligatorio</p>
                  </div>
                  <h2 className="text-2xl font-display font-bold text-foreground">E2EE non attivo su questo account</h2>
                  <p className="max-w-2xl text-sm leading-relaxed text-neutral-300 sm:text-base">
                    Finche non registri la chiave client-side, inbox protetti, deleghe e TOTP restano parziali. La dashboard ti porta ora nella sezione Sicurezza per completare il setup.
                  </p>
                </div>
                <Button onClick={() => handleActiveTabChange("settings")} className="btn-teal h-12 min-w-[220px]">
                  <Shield className="mr-2 h-5 w-5" />
                  Attiva E2EE ora
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardStats.map((item) => (
              <Card key={item.label} className="stat-tile overflow-hidden border-border/70">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/70 ${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-500">{item.helper}</div>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-display font-bold text-foreground">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="panel-surface-strong overflow-hidden border-border/80">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-4 lg:max-w-2xl">
                  <div className="section-kicker border-0">Numero Heirline</div>
                  {isDashboardBootstrapping ? (
                    <>
                      <h2 className="text-2xl font-display font-bold tracking-tight text-foreground sm:text-4xl">
                        Sincronizzazione dashboard in corso
                      </h2>
                    </>
                  ) : hasRealPrimaryNumber ? (
                    <>
                      <h2 className="font-mono text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                        {stats?.primary_number}
                      </h2>
                      <p className="flex items-center gap-2 text-sm font-medium text-accent-primary">
                        <CheckCircle className="h-4 w-4" />
                        Numero Twilio attivo e protetto
                      </p>
                    </>
                  ) : hasBlindNumberEntitlement ? (
                    <>
                      <h2 className="text-2xl font-display font-bold tracking-tight text-foreground sm:text-4xl">
                        Attivazione in corso
                      </h2>
                      <p className="max-w-xl text-sm leading-relaxed text-neutral-400 sm:text-base">Il numero blindato non e ancora disponibile.</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-display font-bold tracking-tight text-foreground sm:text-4xl">
                        Numero blindato non attivo
                      </h2>
                      <p className="max-w-xl text-sm leading-relaxed text-neutral-400 sm:text-base">Per SMS bancari e casi sensibili serve Shield.</p>
                    </>
                  )}
                </div>

                <div className="flex w-full max-w-xl flex-wrap gap-3 lg:justify-end">
                  {isDashboardBootstrapping ? (
                    <Button disabled className="btn-teal h-12 min-w-[180px] flex-1">
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      Caricamento
                    </Button>
                  ) : hasRealPrimaryNumber ? (
                    <>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(stats?.primary_number || "");
                          toast.success("Numero copiato");
                        }}
                        variant="outline"
                        className="btn-outline-teal h-12 min-w-[180px] flex-1"
                      >
                        <Copy className="mr-2 h-5 w-5" />
                        Copia numero
                      </Button>
                      {demoToolsEnabled ? (
                        <Button onClick={handleSimulate} disabled={simulating} className="btn-teal h-12 min-w-[180px] flex-1">
                          {simulating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <><Zap className="mr-2 h-5 w-5" /> Simula OTP</>}
                        </Button>
                      ) : null}
                    </>
                  ) : hasBlindNumberEntitlement ? (
                    <Button onClick={fetchData} variant="outline" className="btn-outline-teal h-12 min-w-[180px] flex-1">
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Aggiorna stato
                    </Button>
                  ) : (
                    <Button onClick={() => handleCheckout("gold_monthly")} disabled={checkoutPlanId === "gold_monthly"} className="btn-teal h-12 min-w-[180px] flex-1">
                      {checkoutPlanId === "gold_monthly" ? <RefreshCw className="h-5 w-5 animate-spin" /> : <><CreditCard className="mr-2 h-5 w-5" /> Sblocca Shield</>}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={handleActiveTabChange} className="space-y-8">
            <TabsList className="sticky top-[92px] z-20 hidden w-full justify-start overflow-x-auto rounded-[22px] border border-border/70 bg-background/85 p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.16)] backdrop-blur-2xl md:flex">
              <TabsTrigger value="inbox" className="px-4 py-2.5 data-[state=active]:bg-accent-primary data-[state=active]:text-obsidian">
                <Inbox className="mr-2 h-4 w-4" />
                Inbox
              </TabsTrigger>
              <TabsTrigger value="account" className="px-4 py-2.5 data-[state=active]:bg-accent-primary data-[state=active]:text-obsidian">
                <Smartphone className="mr-2 h-4 w-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="delegates" className="px-4 py-2.5 data-[state=active]:bg-accent-primary data-[state=active]:text-obsidian">
                <Users className="mr-2 h-4 w-4" />
                Eredi
              </TabsTrigger>
              <TabsTrigger value="settings" className="px-4 py-2.5 data-[state=active]:bg-accent-primary data-[state=active]:text-obsidian">
                <Settings className="mr-2 h-4 w-4" />
                Sicurezza
              </TabsTrigger>
              {isAdmin ? (
                <TabsTrigger value="admin" className="px-4 py-2.5 data-[state=active]:bg-accent-secondary data-[state=active]:text-white">
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Admin
                </TabsTrigger>
              ) : null}
              <TabsTrigger value="upgrade" className="px-4 py-2.5 data-[state=active]:bg-accent-secondary data-[state=active]:text-white">
                <CreditCard className="mr-2 h-4 w-4" />
                Upgrade
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} className="dashboard-stage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <DashboardInboxTab
                  messages={messages}
                  inboxSourceFilter={inboxSourceFilter}
                  onInboxSourceFilterChange={setInboxSourceFilter}
                  inboxOtpOnly={inboxOtpOnly}
                  onInboxOtpOnlyChange={setInboxOtpOnly}
                  sourceCounts={sourceCounts}
                  encryptedMessageCount={encryptedMessageCount}
                  e2eeUnlocked={e2eeUnlocked}
                  messageDecrypting={messageDecrypting}
                  filteredMessages={filteredMessages}
                  onSimulate={handleSimulate}
                  canSimulate={demoToolsEnabled}
                  normalizeMessageSource={normalizeMessageSource}
                  onMarkRead={markRead}
                  sharedInboxMessages={sharedInboxMessages}
                  loadingSharedInbox={loadingSharedInbox}
                  canManageSharedAccess={Number(stats?.limits?.max_shared_members || 0) > 0}
                  sharedAccessOwned={sharedAccessOwned}
                  sharedAccessReceived={sharedAccessReceived}
                  sharedAccessForm={sharedAccessForm}
                  onSharedAccessFormChange={setSharedAccessForm}
                  createSharedAccess={createSharedAccess}
                  savingSharedAccess={savingSharedAccess}
                  revokeSharedAccess={revokeSharedAccess}
                  revokingSharedAccessId={revokingSharedAccessId}
                  onMarkSharedRead={markSharedRead}
                />

                <DashboardDelegatesTab
                  delegates={hydratedDelegates}
                  delegatesLimit={Number(stats?.limits?.max_heirs || stats?.delegates_max || 0)}
                  e2eeReadyForEncrypt={e2eeReadyForEncrypt}
                  delegateForm={delegateForm}
                  onDelegateFormChange={setDelegateForm}
                  delegateStepUpPassword={delegateStepUpPassword}
                  onDelegateStepUpPasswordChange={setDelegateStepUpPassword}
                  createDelegate={createDelegate}
                  creatingDelegate={creatingDelegate}
                  loadDelegates={loadDelegates}
                  loadingDelegates={loadingDelegates}
                  removeDelegate={removeDelegate}
                  removingDelegateId={removingDelegateId}
                  overrideDelegateRelease={overrideDelegateRelease}
                  overridingDelegateId={overridingDelegateId}
                />

                <DashboardAccountTab
                  section={{
                    user,
                    planLabel: getPublicPlanLabel(stats?.plan || user?.plan),
                    authSessions,
                    loadSessions,
                    loadingSessions,
                    logoutAllSessions,
                    loggingOutAll,
                    revokingSessionId,
                    revokeSession,
                    onLogoutCurrent: () => onLogout(false),
                    canUsePasskeys,
                    browserSupportsPasskeys,
                    passkeysLimit,
                    passkeys,
                    passkeyLabel,
                    onPasskeyLabelChange: setPasskeyLabel,
                    handleRegisterPasskey,
                    registeringPasskey,
                    loadingPasskeys,
                    loadPasskeys,
                    deletingPasskeyId,
                    handleDeletePasskey,
                    canManageEmailAliases,
                    createAlias,
                    aliasForm,
                    onAliasFormChange: setAliasForm,
                    creatingAlias,
                    emailAliases,
                    emailAliasLimit,
                    loadingAliases,
                    disableAlias,
                    pushSupported,
                    pushSubscribed,
                    pushPermission,
                    pushLoading,
                    pushError,
                    handlePushSubscribe,
                    handlePushUnsubscribe,
                    handlePushTest,
                  }}
                />

                <DashboardSettingsTab
                  section={{
                    e2eeEnabled,
                    e2eeStatus,
                    e2eeUnlocked,
                    hasLocalVaultState,
                    localVaultAligned,
                    e2eePassphrase,
                    onE2eePassphraseChange: setE2eePassphrase,
                    handleEnableE2ee,
                    handleUnlockE2ee,
                    handleLockE2ee,
                    e2eeBusy,
                    canUseSecureNotes,
                    secureNotes: hydratedSecureNotes,
                    secureNotesLimit,
                    secureNoteForm,
                    onSecureNoteFormChange: setSecureNoteForm,
                    saveSecureNote,
                    savingSecureNote,
                    resetSecureNoteForm,
                    loadSecureNotes,
                    loadingSecureNotes,
                    editSecureNote,
                    deleteSecureNote,
                    deletingSecureNoteId,
                    canUseTotp,
                    e2eeReadyForEncrypt,
                    totpEntries: hydratedTotpEntries,
                    totpCodes,
                    loadingTotpCodes,
                    refreshTotpCodes,
                    totpForm,
                    onTotpFormChange: setTotpForm,
                    createTotpEntry,
                    savingTotp,
                    deleteTotpEntry,
                    deletingTotpId,
                    otpPolicy,
                    savingOtpPolicy,
                    saveOtpPolicy,
                    canUseAutoDelete: Boolean(stats?.limits?.auto_destruct),
                    canUseWhitelist: Boolean(stats?.limits?.whitelist),
                    trustedSenders,
                    loadingTrustedSenders,
                    trustedSenderForm,
                    onTrustedSenderFormChange: setTrustedSenderForm,
                    addTrustedSender,
                    savingTrustedSender,
                    removeTrustedSender,
                    removingTrustedSenderId,
                    otpAccessLogs,
                    otpAutofillLogs,
                    accountAuditLogs,
                    canViewSharedOtpAudit: Boolean(stats?.limits?.shared_otp_audit),
                    canViewAccountAudit: Boolean(stats?.limits?.audit_log),
                    loadingOtpAccessLogs,
                    loadingOtpAutofillLogs,
                    loadingAccountAuditLogs,
                    loadOtpAccessLogs,
                    loadOtpAutofillLogs,
                    loadAccountAuditLogs,
                    securityAlerts,
                    loadingSecurityAlerts,
                    loadSecurityAlerts,
                    resolveSecurityAlert,
                    resolvingAlertId,
                    canUseKillSwitch: Boolean(stats?.limits?.kill_switch),
                    panicPassword,
                    onPanicPasswordChange: setPanicPassword,
                    panicConfirmDelete,
                    onPanicConfirmDeleteChange: setPanicConfirmDelete,
                    triggerPanicFreeze,
                    panicBusy,
                    isAdmin,
                  }}
                />

                {isAdmin ? (
                  <DashboardAdminTab
                    section={{
                      securityAlerts,
                      loadingSecurityAlerts,
                      loadSecurityAlerts,
                      resolveSecurityAlert,
                      resolvingAlertId,
                      adminSearchQuery,
                      onAdminSearchQueryChange: setAdminSearchQuery,
                      adminSearchResults,
                      searchingAdminUsers,
                      selectedAdminUserId,
                      loadAdminUserProfile,
                      adminUserProfile,
                      loadingAdminUserProfile,
                      adminPlanDraft,
                      onAdminPlanDraftChange: setAdminPlanDraft,
                      updateAdminUserPlan,
                      updatingAdminUserPlan,
                      adminBurnerHours,
                      onAdminBurnerHoursChange: setAdminBurnerHours,
                      grantAdminBurnerNumber,
                      addingAdminBurnerNumber,
                      freezeAdminUser,
                      freezingAdminUserId,
                      realignAdminBilling,
                      realigningAdminUserId,
                      kpiData: adminKpiData,
                      kpiDays: adminKpiDays,
                      onKpiDaysChange: setAdminKpiDays,
                      loadAdminKpi,
                      loadingAdminKpi,
                      exportAdminCsv,
                      exportingAdminCsv,
                    }}
                  />
                ) : null}

                <DashboardUpgradeTab
                  sortedCatalogPlans={sortedCatalogPlans}
                  getCheckoutPlanIdForKey={getCheckoutPlanIdForKey}
                  isPlanIncluded={isPlanIncluded}
                  currentPlanKey={currentPlanKey}
                  currentPlanLabel={getPublicPlanLabel(stats?.plan || user?.plan)}
                  handleCheckout={handleCheckout}
                  checkoutPlanId={checkoutPlanId}
                  getUpgradeActionLabel={getUpgradeActionLabel}
                />
              </motion.div>
            </AnimatePresence>
          </Tabs>

          <div className="mobile-bottom-nav md:hidden">
            {[
              { value: "inbox", icon: Inbox, label: "Inbox" },
              { value: "account", icon: Smartphone, label: "Account" },
              { value: "delegates", icon: Users, label: "Eredi" },
              { value: "settings", icon: Settings, label: "Sicurezza" },
              ...(isAdmin ? [{ value: "admin", icon: ShieldAlert, label: "Admin" }] : []),
              { value: "upgrade", icon: CreditCard, label: "Upgrade" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => handleActiveTabChange(item.value)}
                aria-current={activeTab === item.value ? "page" : undefined}
                className={`mobile-bottom-item ${activeTab === item.value ? "active" : ""}`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default function App() {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute left-[-8%] top-[16%] h-72 w-72 rounded-full bg-accent-primary/10 blur-[120px]" />
        <div className="absolute right-[-10%] top-[10%] h-72 w-72 rounded-full bg-accent-secondary/10 blur-[120px]" />
        <div className="grain-overlay" />
        <div className="panel-surface flex items-center gap-4 px-6 py-5">
          <RefreshCw className="h-10 w-10 animate-spin text-accent-primary" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Loading</p>
            <p className="text-base font-semibold text-foreground">Sincronizzazione sessione in corso</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-accent-primary focus:text-obsidian focus:font-semibold"
      >
        Salta al contenuto principale
      </a>
      <div className="App selection:bg-accent-primary/30 selection:text-white">
        <HashRouter>
          <Navbar isAuthenticated={auth.isAuthenticated} user={auth.user} onLogout={auth.logout} />
          <Toaster position="top-center" expand={false} richColors closeButton />

          <main id="main-content">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<LandingPage isAuthenticated={auth.isAuthenticated} />} />
                <Route path="/register" element={<RegisterPage onLogin={auth.login} />} />
                <Route path="/login" element={<LoginPage onLogin={auth.login} />} />
                <Route
                  path="/dashboard"
                  element={
                    auth.isAuthenticated ? (
                      <DashboardPage user={auth.user} token={auth.token} apiRequest={auth.apiRequest} onLogout={auth.logout} />
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
                <Route path="/payment-success" element={<PaymentSuccessPage apiRequest={auth.apiRequest} refreshUser={auth.refreshUser} />} />
              </Routes>
            </AnimatePresence>
          </main>
        </HashRouter>
      </div>
    </ThemeProvider>
  );
}
