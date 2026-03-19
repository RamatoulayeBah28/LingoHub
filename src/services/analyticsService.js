import { logEvent } from "firebase/analytics";
import { analytics } from "../firebase";

export function trackSignUp(method) {
  logEvent(analytics, "sign_up", { method });
}

export function trackLogin(method) {
  logEvent(analytics, "login", { method });
}

export function trackPostCreated({ isAnonymous, tagCount }) {
  logEvent(analytics, "post_created", { isAnonymous, tagCount });
}

export function trackPostViewed(postId) {
  logEvent(analytics, "post_viewed", { postId });
}

export function trackCommentAdded(postId) {
  logEvent(analytics, "comment_added", { postId });
}

export function trackUpvote(postId) {
  logEvent(analytics, "post_upvoted", { postId });
}

export function trackPostSaved(postId) {
  logEvent(analytics, "post_saved", { postId });
}
