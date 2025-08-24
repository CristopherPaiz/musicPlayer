import PropTypes from "prop-types";

const NoRandom = ({ className, color }) => {
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
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M21 17l-18 0" />
      <path d="M18 4l3 3l-3 3" />
      <path d="M18 20l3 -3l-3 -3" />
      <path d="M21 7l-18 0" />
    </svg>
  );
};

NoRandom.propTypes = {
  className: PropTypes.string,
  color: PropTypes.string,
};

NoRandom.defaultProps = {
  color: "currentColor",
};

export default NoRandom;
