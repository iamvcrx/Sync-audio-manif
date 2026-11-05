process.on('unhandledRejection', (reason, _p) => {
  console.error('> Unhandled Promise Rejection');
  console.error(reason);
});

process.on('uncaughtException', (err) => {
  console.error('> Uncaught Exception:');
  console.error(err);
});
