const logger = {
  info: (msg, meta = null) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (msg, meta = null) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`, meta ? JSON.stringify(meta) : '');
  },
  error: (msg, meta = null) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, meta ? JSON.stringify(meta) : '');
  }
};

module.exports = logger;
