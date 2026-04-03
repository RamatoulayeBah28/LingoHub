import { track } from "@vercel/analytics";

export function trackLogin(method) {
  track("login", { method });
}

export function trackSignUp(method) {
  track("sign_up", { method });
}

export function trackPostCreated({ isAnonymous, tagCount }) {
  track("post_created", { isAnonymous, tagCount });
}

export function trackPostViewed(postId) {
  track("post_viewed", { postId });
}

export function trackCommentAdded(postId) {
  track("comment_added", { postId });
}

export function trackUpvote(postId) {
  track("upvote", { postId });
}
