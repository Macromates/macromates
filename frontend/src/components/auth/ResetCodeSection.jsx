import { Link } from "react-router";
import { CheckIcon } from "@heroicons/react/24/solid";
import { motion } from "motion/react";
import ResetPasswordProgress from "./ResetPasswordProgress";

export default function ResetCodeSection() {
  const userEmail = localStorage.getItem("reset_email");

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="bg-base-200/75 border border-base-300 rounded-box p-6 max-w-xs w-full space-y-6 text-center">
        <h2 className="text-2xl font-semibold !text-primary-content">
          Reset Code Sent
        </h2>
        <motion.div
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: [0, 1.3, 1], rotate: [0, -10, 0] }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="mx-auto flex items-center justify-center w-20 h-20 rounded-full border-2 border-primary-content"
        >
          <CheckIcon className="mx-auto h-12 w-12 text-primary-content" />
        </motion.div>

        <p className="text-primary-content">
          We’ve sent a reset code to your email{" "}
          <span className="font-medium">{userEmail}</span>
        </p>

        {/* Continue button + progress */}
        <div className="space-y-4">
          <Link
            to="/reset-password"
            className="btn btn-primary w-full bg-primary"
          >
            Continue
          </Link>
          <ResetPasswordProgress step={2} />
        </div>
      </div>
    </div>
  );
}
