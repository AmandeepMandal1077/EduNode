import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "@/store";
import { registerThunk, clearError } from "@/store/authSlice";

export function useRegister() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  
  const { loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(registerThunk({ name, email, password, role }));
    if (registerThunk.fulfilled.match(result)) {
      navigate("/dashboard");
    }
  };

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    role,
    setRole,
    loading,
    error,
    handleSubmit,
  };
}
