// src/utils/logger.js
// Named exports used across the project.
// Safe: provides both 'log' and 'error' without changing other code.
export const log = (...args) => {
  try {
    if (typeof args[0] === 'string') {
      console.log(args[0], ...(args.slice(1) || []));
    } else {
      console.log(...args);
    }
  } catch {}
};

export const error = (...args) => {
  try {
    if (typeof args[0] === 'string') {
      console.error(args[0], ...(args.slice(1) || []));
    } else {
      console.error(...args);
    }
  } catch {}
};

export default { log, error };
