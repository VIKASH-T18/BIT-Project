/**
 * @file SkeletonCard.jsx
 * @description Reusable skeleton loading placeholder.
 */
const SkeletonCard = ({ height = "80px", className = "" }) => (
  <div className={`skeleton rounded-xl ${className}`} style={{ height }} />
);

export default SkeletonCard;
