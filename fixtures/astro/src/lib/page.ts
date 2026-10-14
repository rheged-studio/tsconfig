import { shout } from "./format.js";

export const heading: string = shout("hello");
document.title = heading;
