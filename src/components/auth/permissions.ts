import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  userAc,
} from "better-auth/plugins/admin/access";

export const statement = {
  ...defaultStatements,
  tradeAccount: [
    "create",
    "read",
    "update",
    "delete",
    "list",
    "create-own",
    "read-own",
    "update-own",
    "delete-own",
    "list-own",
  ], // <-- Permissions available for created roles
} as const;

export const accessControl = createAccessControl({
  ...statement,
});

export const user = accessControl.newRole({
  ...userAc.statements,
  user: [...userAc.statements.user],
});

export const admin = accessControl.newRole({ ...adminAc.statements });
