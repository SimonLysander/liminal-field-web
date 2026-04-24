import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="not-found-view">
      <div className="not-found-card paper-texture">
        <h1>Page not found</h1>
        <p>This route does not belong to the current public shell. Return to the room entry and continue from there.</p>
        <Link to="/home">Back to home</Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
