import { hookstate } from "@hookstate/core";
import { Suburb } from "../types";

// Deprecate this suburb state in favour of all suburb state
type SuburbState = { [key: number]: Suburb };

export const globalSuburbState = hookstate<SuburbState>({});

// all suburb state
export const allSuburbState = hookstate<Suburb[]>([]);
