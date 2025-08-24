import PropTypes from "prop-types";

const ExpandIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5v4m0 0h-4" />
  </svg>
);

ExpandIcon.propTypes = {
  className: PropTypes.string,
};

ExpandIcon.defaultProps = {
  className: "size-5",
};

export default ExpandIcon;
