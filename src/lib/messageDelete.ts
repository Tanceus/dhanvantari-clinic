import type { MessageStatus } from "../types";

/** Matches backend SENT_DELETE_DETAIL. */
export const SENT_MESSAGE_DELETE_HINT =
  "Cannot delete: this message was already sent to the patient. Sent messages are kept as a permanent record.";

export function canDeleteMessage(status: MessageStatus): boolean {
  return status !== "sent";
}
