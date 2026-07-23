"use client";

const KEY = "about_staff_authed";

export function isAuthed() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(KEY) === "1";
}

export function setAuthed() {
  window.sessionStorage.setItem(KEY, "1");
}

export function logout() {
  window.sessionStorage.removeItem(KEY);
}
