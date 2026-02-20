import {
  accessControl,
  admin,
  user,
} from "./../../components/auth/permissions";
import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  inferAdditionalFields,
  passkeyClient,
  twoFactorClient,
  organizationClient,
} from "better-auth/client/plugins";
import { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    passkeyClient(),
    twoFactorClient({
      onTwoFactorRedirect: () => {
        window.location.href = "/auth/2fa";
      },
    }),
    adminClient({
      accessControl,
      roles: {
        admin,
        user,
      },
    }),
    organizationClient(),
  ],
});
