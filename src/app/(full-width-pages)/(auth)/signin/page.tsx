import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hexa Billing System SignIn",
  description: "SignIn Page for Hexa Billing System",
};

export default function SignIn() {
  return <SignInForm />;
}
