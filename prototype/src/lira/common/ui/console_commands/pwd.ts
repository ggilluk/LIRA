import type { ConsoleCommand } from "./types";

export const pwdCommand: ConsoleCommand = {
  name: "pwd",
  description: "print the working directory",
  run: ({ fs }) => [fs.pwd()],
};
