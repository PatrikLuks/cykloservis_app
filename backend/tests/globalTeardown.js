const mongoose = require('mongoose');

module.exports = async () => {
  // Zavřít mongoose pokud ještě otevřen
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close();
    } catch (e) {
      /* ignore close */
    }
  }
  // Shutdown případných rate-limiter intervalů (např. pokud FORCE_RATE_LIMIT=1 v některém testu)
  try {
    const app = require('..');
    if (app && Array.isArray(app._rateLimiters)) {
      app._rateLimiters.forEach((lim) => {
        try {
          if (lim && lim.store && typeof lim.store.shutdown === 'function') {
            lim.store.shutdown();
          }
        } catch (_) {
          /* ignore limiter shutdown */
        }
      });
    }
  } catch (e) {
    /* ignore app import */
  }
  // Rate limitery jsou v test prostředí vypnuté; není třeba řešit shutdown store
  // Stop mongodb-memory-server if used
  try {
    const { stopMemory } = require('./helpers/testFactory');
    await stopMemory();
  } catch (e) {
    /* ignore memory stop */
  }
  try {
    const { stopDefaultMetrics } = require('../metrics');
    if (typeof stopDefaultMetrics === 'function') stopDefaultMetrics();
  } catch (e) {
    /* ignore metrics stop */
  }
  // Pokus o generické uzavření serverů vytvořených např. supertestem
  try {
    const handles = process._getActiveHandles ? process._getActiveHandles() : [];
    handles.forEach((h) => {
      if (h && h.constructor && h.constructor.name === 'Server') {
        try {
          h.closeAllConnections && h.closeAllConnections();
        } catch (_) {
          /* ignore closeAllConnections */
        }
        try {
          h.close && h.close();
        } catch (_) {
          /* ignore server close */
        }
      }
    });
  } catch (e) {
    /* ignore closing servers */
  }
  // Krátké čekání na ukončení případných ChildProcess (mongod) po stopMemory()
  await new Promise((r) => setTimeout(r, 50));
  // Diagnostika přetrvávajících open handles (dočasně – až najdeme příčinu, odstraníme)
  try {
    const handles = process._getActiveHandles ? process._getActiveHandles() : [];
    const requests = process._getActiveRequests ? process._getActiveRequests() : [];
    // Filtrovat známé benigní objekty (stdout/stderr)
    const filtered = handles.filter(
      (h) => !(h === process.stdout || h === process.stderr || h === process.stdin)
    );
    if (filtered.length || requests.length) {
      // Stručný popis, abychom měli typy
      // eslint-disable-next-line no-console
      console.log(
        '[globalTeardown] Active handles:',
        filtered.map((h) => h.constructor && h.constructor.name)
      );
      // eslint-disable-next-line no-console
      console.log(
        '[globalTeardown] Active requests:',
        requests.map((r) => r.constructor && r.constructor.name)
      );
      // Detailnější inspekce soketů (pokud nějaké jsou)
      const net = filtered.filter((h) => h.remoteAddress || h.address);
      if (net.length) {
        // eslint-disable-next-line no-console
        console.log(
          '[globalTeardown] Socket details:',
          net.map((s) => ({
            local: (() => {
              try {
                return s.address();
              } catch (_) {
                return null;
              }
            })(),
            pending: s.pending || false,
            readable: s.readable,
            writable: s.writable,
          }))
        );
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('[globalTeardown] Žádné aktivní handle nezjištěny');
    }
  } catch (e) {
    /* ignore diagnostics */
  }
};
