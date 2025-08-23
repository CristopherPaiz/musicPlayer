import PropTypes from "prop-types";

const Skeleton = ({ className }) => <div className={`bg-white/10 animate-pulse rounded-md ${className}`} />;

Skeleton.propTypes = {
  className: PropTypes.string,
};

export default Skeleton;
