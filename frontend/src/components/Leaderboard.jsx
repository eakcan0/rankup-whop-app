const Leaderboard = ({ entries, loading, error }) => {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Top Contributors</h2>
          <p className="muted">Synced from Whop memberships + webhook events.</p>
        </div>
        <button className="ghost-btn" type="button">
          View full logs
        </button>
      </div>
      <div className="leaderboard">
        {loading && <p className="muted">Fetching fresh data...</p>}
        {!loading &&
          entries.map((entry) => (
            <article key={entry.id} className="leaderboard-row">
              <div className="rank">{entry.rank}</div>
              <img src={entry.avatar} alt={entry.name} className="avatar" />
              <div className="identity">
                <p className="name">{entry.name}</p>
                <p className="muted">{entry.membership}</p>
              </div>
              <div className="score">
                <p className="value">{entry.score}</p>
                <p className="muted small">{entry.metric}</p>
              </div>
            </article>
          ))}
        {!loading && entries.length === 0 && (
          <p className="muted">No activity yet. Webhooks will hydrate this view.</p>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </section>
  );
};

export default Leaderboard;

