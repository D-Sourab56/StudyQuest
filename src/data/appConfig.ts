
import {
  Award,
  History,
  LayoutDashboard,
  Settings,
  Timer,
  Waypoints,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

// =========================================
// APP INFORMATION
// =========================================

export const APP_NAME = "StudyQuest";

export const APP_TAGLINE =
  "Level up your knowledge";

export const APP_DESCRIPTION =
  "Turn learning into progress you can see.";

// =========================================
// ROUTES
// =========================================

export const ROUTES = {
  dashboard: "/",

  study: "/study",

  skills: "/skills",

  history: "/history",

  achievements: "/achievements",

  settings: "/settings",

  subjectDetails: "/study/subject/:subjectName",

  subjectSummaries:
    "/study/subject/:subjectName/summaries",

  subjectSkills:
    "/study/subject/:subjectName/skills",
} as const;

// =========================================
// SUBJECT ROUTE HELPERS
// =========================================

export function getSubjectRoute(
  subjectName: string
): string {
  return `/study/subject/${encodeURIComponent(
    subjectName
  )}`;
}

export function getSubjectSummariesRoute(
  subjectName: string
): string {
  return `${getSubjectRoute(subjectName)}/summaries`;
}

export function getSubjectSkillsRoute(
  subjectName: string
): string {
  return `${getSubjectRoute(subjectName)}/skills`;
}

// =========================================
// NAVIGATION TYPES
// =========================================

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

// =========================================
// NAVIGATION ITEMS
// =========================================

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: "Dashboard",
    path: ROUTES.dashboard,
    icon: LayoutDashboard,
  },
  {
    label: "Study",
    path: ROUTES.study,
    icon: Timer,
  },
  {
    label: "Skill Tree",
    path: ROUTES.skills,
    icon: Waypoints,
  },
  {
    label: "History",
    path: ROUTES.history,
    icon: History,
  },
  {
    label: "Achievements",
    path: ROUTES.achievements,
    icon: Award,
  },
  {
    label: "Settings",
    path: ROUTES.settings,
    icon: Settings,
  },
];
