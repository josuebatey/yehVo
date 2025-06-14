import { useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";

export function VerifyEmail() {
  const location = useLocation();
  const email = location.state?.email;

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We’ve sent a verification link to <b>{email}</b>. <br />
            Please check your inbox and click the link to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4 text-muted-foreground">
            Didn’t receive the email? Check your spam folder or&nbsp;
            <Link to="/register" className="text-primary hover:underline">
              try again
            </Link>.
          </p>
          <Button asChild>
            <Link to="/login">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}