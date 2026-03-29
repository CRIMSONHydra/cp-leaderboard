import { Link } from 'react-router-dom';
import './Spaces.css';

export default function SpaceCard({ space }) {
  return (
    <Link to={`/spaces/${space._id}`} className="space-card">
      <h3 className="space-card-name">{space.name}</h3>
      {space.description && (
        <p className="space-card-desc">{space.description}</p>
      )}
      <div className="space-card-meta">
        <span className="space-card-role">{space.myRole}</span>
        <span>{space.memberCount} members</span>
        <span>{space.trackedUserCount} tracked</span>
      </div>
    </Link>
  );
}
