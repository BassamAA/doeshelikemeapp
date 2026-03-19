import type { NextAuthConfig } from "next-auth";
import type { PlanType } from "@prisma/client";

type SessionUserWithPlan = {
  entitlement?: {
    planType: PlanType;
  } | null;
};

export const authConfig = {
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
        session.user.plan = (user as SessionUserWithPlan).entitlement?.planType ?? "FREE";
      }
      return session;
    },
  },
} satisfies Omit<NextAuthConfig, "providers">;
