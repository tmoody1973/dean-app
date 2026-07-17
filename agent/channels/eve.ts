import { eveChannel } from "eve/channels/eve";
import {
  type AuthFn,
  UnauthenticatedError,
  localDev,
  vercelOidc,
} from "eve/channels/auth";

import { DEMO_PASSCODE_HEADER } from "../../lib/demo-access";
import { hasValidDemoPasscode } from "../lib/demo-passcode";

function sharedDemoPasscode(): AuthFn<Request> {
  return (request) => {
    const configured = process.env.DEAN_DEMO_PASSCODE;

    if (configured === undefined || configured.length === 0) {
      throw new UnauthenticatedError({
        code: "demo_access_not_configured",
        message: "Dean demo access is not configured. Set DEAN_DEMO_PASSCODE before inviting viewers.",
      });
    }

    if (!hasValidDemoPasscode(request.headers.get(DEMO_PASSCODE_HEADER), configured)) {
      throw new UnauthenticatedError({
        code: "demo_access_required",
        message: "Enter the Dean demo passcode to continue.",
      });
    }

    return {
      attributes: { access: "shared-demo" },
      authenticator: "dean-demo-passcode",
      principalId: "dean-shared-demo",
      principalType: "user",
    };
  };
}

export default eveChannel({
  auth: [
    // Lets the eve TUI and your Vercel deployments reach the deployed agent.
    vercelOidc(),
    // Open on localhost for `eve dev` and the REPL; ignored in production.
    localDev(),
    sharedDemoPasscode(),
  ],
});
