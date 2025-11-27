const Layout = ({ session, children }) => {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="subtle">Whop Leaderboard</p>
          <h1>Rank Up</h1>
          <p className="muted">
            Track engagement across your community in real time.
          </p>
        </div>
        <div className="session-pill">
          <span className="status-dot" />
          {session?.user?.name || 'Awaiting Whop context'}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
};

export default Layout;

