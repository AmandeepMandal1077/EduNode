import { useNavigate } from "react-router-dom";

export function useCancel() {
  const navigate = useNavigate();

  const handleBrowseCourses = () => {
    navigate("/explore");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return {
    handleBrowseCourses,
    handleGoBack,
  };
}
