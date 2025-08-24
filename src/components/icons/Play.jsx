import PropTypes from "prop-types";

const Play = ({ className, color }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke={color}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M0 0h24v24H0z" stroke="none" />
      <path d="M6 4v16a1 1 0 0 0 1.524.852l13-8a1 1 0 0 0 0-1.704l-13-8A1 1 0 0 0 6 4z" fill={color} stroke="none" />
    </svg>
  );
};

Play.propTypes = {
  className: PropTypes.string,
  color: PropTypes.string,
};

Play.defaultProps = {
  color: "currentColor",
};

export default Play;
