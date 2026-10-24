// Unit tests of the mapping only. They do not exercise a real Supabase project or email delivery.
import { describe, expect, it } from "vitest";
import { authErrorMessage, MESSAGES } from "./error-map";

describe("authErrorMessage", () => {
  it("sign-in: wrong password and unknown email look identical", () => {
    expect(authErrorMessage({ code: "invalid_credentials", status: 400 }, "sign-in")).toBe(MESSAGES.signInFailed);
    expect(authErrorMessage({ status: 400 }, "sign-in")).toBe(MESSAGES.signInFailed);
  });

  it("sign-in: unconfirmed email gets its own hint", () => {
    expect(authErrorMessage({ code: "email_not_confirmed", status: 400 }, "sign-in")).toBe(MESSAGES.signInUnconfirmed);
  });

  it("sign-up: an existing account is treated as success so nothing leaks", () => {
    expect(authErrorMessage({ code: "user_already_exists" }, "sign-up")).toBe("treat-as-success");
    expect(authErrorMessage({ code: "email_exists" }, "sign-up")).toBe("treat-as-success");
    expect(authErrorMessage({ code: "weak_password" }, "sign-up")).toBe(MESSAGES.weakPassword);
  });

  it("sign-up: the built-in-email recipient restriction gets its own explanation", () => {
    expect(authErrorMessage({ code: "email_address_not_authorized", status: 400 }, "sign-up")).toBe(MESSAGES.emailNotAllowed);
  });

  it("password reset request never reveals anything", () => {
    expect(authErrorMessage({ code: "user_not_found", status: 400 }, "reset-request")).toBe("treat-as-success");
  });

  it("reset update maps expired sessions and same-password", () => {
    expect(authErrorMessage({ code: "session_not_found", status: 401 }, "reset-update")).toBe(MESSAGES.linkExpired);
    expect(authErrorMessage({ code: "same_password" }, "reset-update")).toBe(MESSAGES.samePassword);
  });

  it("rate limits and unknown errors map to fixed text, never raw provider text", () => {
    expect(authErrorMessage({ status: 429 }, "sign-in")).toBe(MESSAGES.rateLimited);
    expect(authErrorMessage({ code: "over_email_send_rate_limit" }, "sign-up")).toBe(MESSAGES.rateLimited);
    expect(authErrorMessage({ code: "something_new", status: 500 }, "sign-in")).toBe(MESSAGES.generic);
    expect(authErrorMessage(null, "sign-in")).toBe(MESSAGES.generic);
  });
});
